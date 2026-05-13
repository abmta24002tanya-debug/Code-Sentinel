import uuid
import asyncio
import re
import base64
from datetime import datetime, timezone
import httpx
from backend.db import update_scan

TIMEOUT = httpx.Timeout(10.0, connect=5.0)

def _finding(category, severity, title, description, evidence="", remediation=""):
    return {
        "id": str(uuid.uuid4()),
        "category": category,
        "severity": severity,
        "title": title,
        "description": description,
        "evidence": evidence,
        "remediation": remediation,
    }

def check_security_headers(response: httpx.Response) -> list:
    findings = []
    h = {k.lower(): v for k, v in response.headers.items()}
    checks = [
        ("strict-transport-security", "medium", "Missing HSTS",
         "HTTP Strict Transport Security not set. Browsers may connect over plain HTTP.",
         "Add: Strict-Transport-Security: max-age=31536000; includeSubDomains"),
        ("x-content-type-options", "low", "Missing X-Content-Type-Options",
         "Browser may MIME-sniff responses, enabling XSS attacks.",
         "Add: X-Content-Type-Options: nosniff"),
        ("content-security-policy", "medium", "Missing Content-Security-Policy",
         "No CSP header. XSS attacks may execute arbitrary scripts.",
         "Define a strict CSP policy header."),
        ("referrer-policy", "low", "Missing Referrer-Policy",
         "Referrer information may leak to third parties.",
         "Add: Referrer-Policy: strict-origin-when-cross-origin"),
        ("permissions-policy", "low", "Missing Permissions-Policy",
         "Browser features (camera, mic, geolocation) not restricted.",
         "Add: Permissions-Policy: geolocation=(), microphone=(), camera=()"),
    ]
    for header, severity, title, desc, fix in checks:
        if header not in h:
            findings.append(_finding("Headers", severity, title, desc, f"Header '{header}' absent", fix))
    return findings

def check_cors(response: httpx.Response) -> list:
    findings = []
    acao = response.headers.get("access-control-allow-origin", "")
    acac = response.headers.get("access-control-allow-credentials", "")
    if acao == "*" and acac.lower() == "true":
        findings.append(_finding(
            "CORS", "high", "CORS Wildcard + Credentials",
            "Access-Control-Allow-Origin: * combined with credentials=true allows cross-origin credential theft.",
            f"ACAO: {acao}, ACAC: {acac}",
            "Specify explicit allowed origins. Never use wildcard with credentials."
        ))
    elif acao == "*":
        findings.append(_finding(
            "CORS", "medium", "CORS Wildcard Origin",
            "Any origin can read responses from this server.",
            f"ACAO: {acao}",
            "Restrict Access-Control-Allow-Origin to trusted domains."
        ))
    return findings

def check_cookies(response: httpx.Response) -> list:
    findings = []
    cookies = response.headers.get_list("set-cookie") if hasattr(response.headers, "get_list") else []
    if not cookies:
        raw = response.headers.get("set-cookie", "")
        if raw:
            cookies = [raw]
    for cookie in cookies:
        name = cookie.split("=")[0].strip()
        low = cookie.lower()
        if "secure" not in low:
            findings.append(_finding(
                "Cookies", "medium", f"Cookie '{name}' missing Secure flag",
                "Cookie transmitted over plain HTTP connections.",
                cookie[:120],
                "Add 'Secure' flag to all cookies."
            ))
        if "httponly" not in low:
            findings.append(_finding(
                "Cookies", "medium", f"Cookie '{name}' missing HttpOnly flag",
                "Cookie accessible via JavaScript — risk of XSS theft.",
                cookie[:120],
                "Add 'HttpOnly' flag to all session cookies."
            ))
        if "samesite" not in low:
            findings.append(_finding(
                "Cookies", "medium", f"Cookie '{name}' missing SameSite flag",
                "Cookie sent with cross-site requests — CSRF risk.",
                cookie[:120],
                "Add 'SameSite=Strict' or 'SameSite=Lax'."
            ))
    return findings

def check_clickjacking(response: httpx.Response) -> list:
    h = {k.lower(): v for k, v in response.headers.items()}
    xfo = h.get("x-frame-options", "")
    csp = h.get("content-security-policy", "")
    if not xfo and "frame-ancestors" not in csp:
        return [_finding(
            "Clickjacking", "medium", "Clickjacking Protection Missing",
            "Page can be embedded in an iframe by malicious sites.",
            "X-Frame-Options absent, CSP frame-ancestors absent",
            "Add: X-Frame-Options: DENY  or  CSP: frame-ancestors 'none'"
        )]
    return []

async def check_exposed_paths(base_url: str, client: httpx.AsyncClient) -> list:
    findings = []
    paths = [
        ("/.env", "critical", "Exposed .env File", "Environment variables may be publicly accessible."),
        ("/.git/HEAD", "critical", "Exposed Git Repository", "Source code repository is publicly accessible."),
        ("/admin", "high", "Admin Panel Exposed", "Admin interface may be accessible without authentication."),
        ("/phpmyadmin", "high", "phpMyAdmin Exposed", "Database admin panel publicly accessible."),
        ("/wp-admin", "high", "WordPress Admin Exposed", "WordPress admin panel is publicly accessible."),
        ("/api/swagger", "medium", "Swagger UI Exposed", "API documentation exposed without authentication."),
        ("/api/docs", "medium", "API Docs Exposed", "API documentation exposed without authentication."),
        ("/graphql", "medium", "GraphQL Endpoint Exposed", "GraphQL introspection may leak schema."),
    ]
    base = base_url.rstrip("/")
    tasks = [(path, sev, title, desc) for path, sev, title, desc in paths]
    
    async def probe(path, sev, title, desc):
        try:
            r = await client.get(base + path, follow_redirects=False)
            if r.status_code == 200:
                return _finding(
                    "Exposed Paths", sev, title, desc,
                    f"GET {base + path} → HTTP {r.status_code}",
                    "Restrict access via authentication or server config."
                )
        except Exception:
            pass
        return None

    results = await asyncio.gather(*[probe(p, s, t, d) for p, s, t, d in tasks])
    return [r for r in results if r]

def check_jwt_in_headers(response: httpx.Response) -> list:
    findings = []
    for key, value in response.headers.items():
        # Look for Bearer tokens
        tokens = re.findall(r'Bearer\s+([A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]*)', value)
        for token in tokens:
            findings.append(_finding(
                "JWT", "high", "Exposed JWT in Response Header",
                "A JWT token is leaked in a response header.",
                f"Header '{key}': Bearer {token[:40]}...",
                "Remove JWT tokens from response headers. Use secure HttpOnly cookies."
            ))
    return findings

def check_xss_headers(response: httpx.Response) -> list:
    h = {k.lower(): v for k, v in response.headers.items()}
    if "x-xss-protection" not in h:
        return [_finding(
            "XSS", "info", "Missing X-XSS-Protection",
            "Legacy XSS filter header not set (low impact on modern browsers).",
            "Header 'x-xss-protection' absent",
            "Add: X-XSS-Protection: 1; mode=block"
        )]
    return []

async def check_rate_limiting(base_url: str, client: httpx.AsyncClient) -> list:
    try:
        responses = await asyncio.gather(*[
            client.get(base_url) for _ in range(10)
        ], return_exceptions=True)
        codes = [r.status_code for r in responses if isinstance(r, httpx.Response)]
        if codes and 429 not in codes:
            return [_finding(
                "Rate Limiting", "low", "No Rate Limiting Detected",
                "10 rapid requests returned no HTTP 429 responses.",
                f"Received status codes: {set(codes)}",
                "Implement rate limiting (e.g. 100 req/min per IP)."
            )]
    except Exception:
        pass
    return []

def check_information_disclosure(response: httpx.Response) -> list:
    findings = []
    leak_headers = {
        "server": ("info", "Server Version Disclosure"),
        "x-powered-by": ("low", "Technology Stack Disclosed"),
        "x-aspnet-version": ("low", "ASP.NET Version Disclosed"),
        "x-aspnetmvc-version": ("low", "ASP.NET MVC Version Disclosed"),
    }
    for header, (severity, title) in leak_headers.items():
        val = response.headers.get(header, "")
        if val:
            findings.append(_finding(
                "Information Disclosure", severity, title,
                f"Response discloses technology version via '{header}' header.",
                f"{header}: {val}",
                f"Remove or redact the '{header}' header in server config."
            ))
    return findings

def _compute_summary(findings: list) -> dict:
    counts = {"critical": 0, "high": 0, "medium": 0, "low": 0, "info": 0}
    for f in findings:
        sev = f.get("severity", "info")
        counts[sev] = counts.get(sev, 0) + 1
    
    score = min(100,
        counts["critical"] * 20 +
        counts["high"] * 10 +
        counts["medium"] * 5 +
        counts["low"] * 2 +
        counts["info"] * 1
    )
    
    total = sum(counts.values())
    if total == 0:
        ai_summary = "No issues detected. Surface-level checks passed."
    elif counts["critical"] > 0:
        ai_summary = f"CRITICAL: {counts['critical']} critical issue(s) found. Immediate remediation required. {total} total findings."
    elif counts["high"] > 0:
        ai_summary = f"HIGH RISK: {counts['high']} high-severity issue(s) detected. {total} total findings. Address promptly."
    elif counts["medium"] > 0:
        ai_summary = f"MODERATE: {counts['medium']} medium-severity issue(s). {total} total findings. Review recommended."
    else:
        ai_summary = f"LOW RISK: {total} minor finding(s). Standard hardening recommended."
    
    return {"total": total, **counts, "riskScore": score, "aiSummary": ai_summary}

async def run_scan(scan_id: str, url: str):
    from backend.db import update_scan
    try:
        await update_scan(scan_id, "running", progress=5, current_step="Starting scan")
        findings = []
        
        limits = httpx.Limits(max_connections=20, max_keepalive_connections=5)
        async with httpx.AsyncClient(timeout=TIMEOUT, limits=limits, follow_redirects=True,
                                     headers={"User-Agent": "Sentinel-Scanner/1.0 (security-audit)"}) as client:
            try:
                await update_scan(scan_id, "running", progress=10, current_step="Fetching target URL")
                response = await client.get(url)
            except Exception as e:
                await update_scan(scan_id, "failed",
                    findings=[],
                    summary={"total": 0, "critical": 0, "high": 0, "medium": 0, "low": 0,
                             "info": 0, "riskScore": 0, "aiSummary": f"Scan failed: {str(e)[:200]}"},
                    completed_at=datetime.now(timezone.utc).isoformat(),
                    progress=100,
                    current_step="Scan failed"
                )
                return

            await update_scan(scan_id, "running", progress=20, current_step="Analyzing security headers")
            findings.extend(check_security_headers(response))

            await update_scan(scan_id, "running", progress=30, current_step="Checking CORS settings")
            findings.extend(check_cors(response))

            await update_scan(scan_id, "running", progress=40, current_step="Evaluating cookie security")
            findings.extend(check_cookies(response))

            await update_scan(scan_id, "running", progress=50, current_step="Checking clickjacking protection")
            findings.extend(check_clickjacking(response))

            await update_scan(scan_id, "running", progress=60, current_step="Scanning headers for exposed JWTs")
            findings.extend(check_jwt_in_headers(response))

            await update_scan(scan_id, "running", progress=70, current_step="Validating XSS protections")
            findings.extend(check_xss_headers(response))

            await update_scan(scan_id, "running", progress=80, current_step="Checking information disclosure")
            findings.extend(check_information_disclosure(response))

            await update_scan(scan_id, "running", progress=85, current_step="Probing exposed paths and rate limits")
            path_findings, rate_findings = await asyncio.gather(
                check_exposed_paths(url, client),
                check_rate_limiting(url, client),
            )
            findings.extend(path_findings)
            findings.extend(rate_findings)

        summary = _compute_summary(findings)
        await update_scan(
            scan_id, "completed",
            findings=findings,
            summary=summary,
            completed_at=datetime.now(timezone.utc).isoformat(),
            progress=100,
            current_step="Scan complete"
        )
    except Exception as e:
        await update_scan(scan_id, "failed",
            findings=[],
            summary={"total": 0, "critical": 0, "high": 0, "medium": 0, "low": 0,
                     "info": 0, "riskScore": 0, "aiSummary": f"Internal error: {str(e)[:200]}"},
            completed_at=datetime.now(timezone.utc).isoformat(),
            progress=100,
            current_step="Scan failed"
        )
