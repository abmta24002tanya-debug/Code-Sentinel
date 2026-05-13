# Code Sentinel - Complete Repository Analysis

## Project Overview

**Code Sentinel** is a comprehensive **Web Security Vulnerability Scanner** built as a full-stack application. It automatically scans websites for security vulnerabilities, misconfigurations, and compliance issues, providing detailed remediation guidance for each finding.

**Version**: 1.0.0  
**Status**: Running ✓

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│         Next.js Frontend (React 18)                     │
│         Port 3000 - User Interface                      │
│  - Bootstrap UI with cyberpunk theme                    │
│  - Scan submission form                                 │
│  - Real-time results display                            │
└──────────────────┬──────────────────────────────────────┘
                   │ HTTP/JSON
                   ↓
┌──────────────────────────────────────────────────────────┐
│      FastAPI Backend (Python 3.11+)                      │
│      Port 8000 - REST API                               │
│  - Async request handling                               │
│  - Background task processing                           │
│  - CORS middleware enabled                              │
└──────────────────┬──────────────────────────────────────┘
                   │ SQL
                   ↓
┌──────────────────────────────────────────────────────────┐
│      SQLite Database (sentinel.db)                       │
│      Persistent scan history & findings                 │
└──────────────────────────────────────────────────────────┘
```

---

## Key Features & Security Checks

### 1. **Security Headers Validation** 📋

Verifies presence of critical HTTP security headers:

- `Strict-Transport-Security` (HSTS) - Prevent downgrade attacks
- `X-Content-Type-Options` - Prevent MIME sniffing
- `Content-Security-Policy` (CSP) - Block XSS/injection attacks
- `Referrer-Policy` - Prevent referrer leaks
- `Permissions-Policy` - Restrict browser features

**Severity**: Low to Medium

### 2. **CORS Configuration Analysis** 🔐

Detects dangerous CORS misconfigurations:

- Wildcard origin (`*`) with credentials enabled
- Overly permissive access control
- Missing proper origin validation

**Severity**: Medium to High

### 3. **Cookie Security Checks** 🍪

Validates cookie flags:

- **Secure** flag - Ensures transmission over HTTPS only
- **HttpOnly** flag - Prevents JavaScript access (XSS protection)
- **SameSite** flag - Defends against CSRF attacks

**Severity**: Medium

### 4. **Clickjacking Protection** 🎯

Checks for anti-clickjacking defenses:

- `X-Frame-Options` header presence
- Content-Security-Policy `frame-ancestors` directive

**Severity**: Medium

### 5. **Exposed Paths Detection** 🚨

Probes for publicly accessible sensitive endpoints:

- `.env` files (environment variable leaks)
- `.git/HEAD` (source code exposure)
- Admin panels (`/admin`, `/phpmyadmin`, `/wp-admin`)
- API documentation (`/api/swagger`, `/api/docs`)
- GraphQL endpoints (schema introspection)

**Severity**: Critical to High

### 6. **JWT Token Leaks** 🔑

Scans response headers for exposed JWT tokens:

- Bearer token pattern detection in headers
- Risk: Token theft and privilege escalation

**Severity**: High

### 7. **Information Disclosure** ℹ️

Detects version info leaks through headers:

- `Server` header (web server version)
- `X-Powered-By` (framework/technology stack)
- `X-AspNet-Version` (ASP.NET version)

**Severity**: Low to Info

### 8. **Rate Limiting Detection** ⏱️

Tests if the application implements rate limiting:

- Sends 10 rapid requests
- Checks for HTTP 429 responses
- Recommends implementation if missing

**Severity**: Low

### 9. **XSS Protection Headers** ⚠️

Validates XSS-related security headers:

- `X-XSS-Protection` (legacy protection)

**Severity**: Info

---

## File Structure

```
code-sentinel/
├── backend/
│   ├── main.py              # FastAPI application & routes
│   ├── db.py                # SQLite database setup & operations
│   ├── scanner.py           # Security check implementations
│   ├── __init__.py          # Python package marker
│   └── requirements.txt      # Python dependencies
│
├── src/
│   └── app/
│       ├── page.js          # Home page with scan form
│       ├── layout.js        # Root layout wrapper
│       └── global.css       # Application styles
│
├── package.json             # Node.js dependencies
├── next.config.js           # Next.js configuration
├── docker-compose.yml       # Docker Compose orchestration
├── Dockerfile               # Multi-stage Docker build
├── start.sh                 # Application startup script
└── skills-lock.js           # Project metadata (Skills framework)
```

---

## API Endpoints

### GET `/health`

Health check endpoint.

```json
{ "status": "ok" }
```

### GET `/api`

API information endpoint.

```json
{
  "name": "Sentinel Security Scanner",
  "version": "1.0.0",
  "status": "running"
}
```

### POST `/api/scan`

Submit a website for security scanning.

**Request**:

```json
{
  "url": "https://example.com"
}
```

**Response**:

```json
{
  "scanId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "queued",
  "url": "https://example.com"
}
```

### GET `/api/scan/{scanId}`

Retrieve scan results.

**Response**:

```json
{
  "scanId": "550e8400-e29b-41d4-a716-446655440000",
  "url": "https://example.com",
  "status": "completed",
  "createdAt": "2026-05-13T18:51:38.123456+00:00",
  "completedAt": "2026-05-13T18:51:42.456789+00:00",
  "findings": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "category": "Headers",
      "severity": "medium",
      "title": "Missing HSTS",
      "description": "HTTP Strict Transport Security not set...",
      "evidence": "Header 'strict-transport-security' absent",
      "remediation": "Add: Strict-Transport-Security: max-age=31536000"
    }
  ],
  "summary": {
    "totalFindings": 1,
    "critical": 0,
    "high": 0,
    "medium": 1,
    "low": 0,
    "info": 0
  }
}
```

---

## Technology Stack

### Frontend

- **Next.js** 14.2.29 - React framework with SSR
- **React** 18.x - UI library
- **CSS** - Custom styling with cyberpunk theme

### Backend

- **FastAPI** 0.136.1 - Async Python web framework
- **Uvicorn** 0.46.0 - ASGI server
- **httpx** 0.28.1 - Async HTTP client for scanning
- **aiosqlite** 0.22.1 - Async SQLite driver
- **Pydantic** 2.13.4 - Data validation

### Database

- **SQLite** 3 - Lightweight relational database
- Located at: `sentinel.db` (Windows) or `/tmp/sentinel.db` (Linux/Docker)

### Deployment

- **Docker** - Containerization
- **Docker Compose** - Orchestration
- **Multi-stage build** - Optimized image size

---

## Running the Application

### Backend Server Status

✅ **Successfully Started**

- **URL**: http://0.0.0.0:8000
- **Port**: 8000
- **Status**: Running
- **Database**: Connected to sentinel.db

### Backend API Response

```json
{
  "name": "Sentinel Security Scanner",
  "version": "1.0.0",
  "status": "running"
}
```

### Frontend Server (Not Yet Started)

The Next.js frontend on port 3000 can be started with:

```bash
npm run dev
# or for production:
npm run build && npm start
```

### Complete Startup (start.sh)

The `start.sh` script will start both services:

```bash
#!/bin/sh
# Start FastAPI backend on port 8000
cd /app
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 &

# Start Next.js frontend on port 3000
NEXT_PUBLIC_API_URL=http://localhost:8000 node_modules/.bin/next start -p 3000
```

---

## How It Works

1. **User Submits URL**: Via the Next.js web interface
2. **Backend Receives Request**: FastAPI creates a scan record with UUID
3. **Background Processing**: Scanner runs async security checks
4. **HTTP Analysis**: Sends requests to target URL and analyzes responses
5. **Finding Collection**: Categorizes issues by severity
6. **Database Storage**: Persists results in SQLite
7. **Results Retrieval**: User can fetch findings via API or UI

---

## Finding Categories & Severity Levels

| Category               | Severity      | Impact                          |
| ---------------------- | ------------- | ------------------------------- |
| Exposed Paths          | Critical/High | Direct access to sensitive data |
| JWT Leaks              | High          | Account compromise              |
| CORS Misconfiguration  | High          | Cross-origin attacks            |
| Cookie Security        | Medium        | Session hijacking, XSS          |
| Security Headers       | Medium/Low    | Various attack vectors          |
| Rate Limiting          | Low           | DoS vulnerability               |
| Information Disclosure | Info/Low      | Reconnaissance aid              |

---

## Configuration

### Environment Variables

- `DB_PATH` - Path to SQLite database (default: `/tmp/sentinel.db`)
- `NEXT_PUBLIC_API_URL` - Frontend API endpoint (default: `http://localhost:8000`)
- `PORT` - API port (default: 8000)

### Database Schema

```sql
CREATE TABLE scans (
    id TEXT PRIMARY KEY,
    url TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'queued',
    findings TEXT DEFAULT '[]',
    summary TEXT DEFAULT NULL,
    created_at TEXT NOT NULL,
    completed_at TEXT DEFAULT NULL
);
```

---

## Deployment Options

### 1. Local Development

```bash
# Terminal 1: Backend
export DB_PATH=sentinel.db
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000

# Terminal 2: Frontend
npm run dev
```

### 2. Docker Compose

```bash
docker-compose up
```

### 3. Production Docker

```bash
docker build -t code-sentinel .
docker run -p 3000:3000 -p 8000:8000 code-sentinel
```

---

## Summary

**Code Sentinel** is a sophisticated security scanning tool that:

- ✅ Performs comprehensive web security analysis
- ✅ Provides detailed remediation guidance
- ✅ Stores scan history in persistent database
- ✅ Offers RESTful API for integration
- ✅ Features modern async Python and React architecture
- ✅ Supports containerized deployment

**Current Status**: Backend API is fully operational and responding to requests.

---

Generated: May 13, 2026
