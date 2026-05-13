"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [inputFocused, setInputFocused] = useState(false);
  const inputRef = useRef(null);

  // Boot sequence text
  const [bootLines, setBootLines] = useState([]);
  const bootSequence = [
    "> SENTINEL v3.7.1 INITIALIZING...",
    "> LOADING THREAT INTELLIGENCE DATABASE...",
    "> AI NEURAL NETWORK: ONLINE",
    "> VULNERABILITY SIGNATURES: 47,291 LOADED",
    "> SCANNING ENGINE: READY",
    "> SYSTEM STATUS: OPERATIONAL",
  ];

  useEffect(() => {
    let idx = 0;
    const timer = setInterval(() => {
      if (idx < bootSequence.length) {
        setBootLines((prev) => [...prev, bootSequence[idx]]);
        idx++;
      } else {
        clearInterval(timer);
      }
    }, 300);
    return () => clearInterval(timer);
  }, []);

  const validateUrl = (val) => {
    try {
      const u = new URL(val);
      return u.protocol === "http:" || u.protocol === "https:";
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const trimmed = url.trim();
    if (!trimmed) {
      setError("TARGET URL IS REQUIRED");
      return;
    }

    let finalUrl = trimmed;
    if (!finalUrl.startsWith("http://") && !finalUrl.startsWith("https://")) {
      finalUrl = "https://" + finalUrl;
    }

    if (!validateUrl(finalUrl)) {
      setError("INVALID URL FORMAT — EXAMPLE: https://target.com");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: finalUrl }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          data.message || data.error || `SERVER ERROR: ${res.status}`,
        );
      }

      const data = await res.json();
      router.push(`/scan/${data.scanId}`);
    } catch (err) {
      setError(err.message || "CONNECTION FAILED — CHECK NETWORK");
      setLoading(false);
    }
  };

  return (
    <main style={styles.main}>
      {/* Animated corner decorations */}
      <div style={styles.cornerTL} aria-hidden="true">
        <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
          <path
            d="M0 60 L0 0 L60 0"
            stroke="#00ff88"
            strokeWidth="1"
            opacity="0.4"
          />
          <path
            d="M0 40 L0 0 L40 0"
            stroke="#00ff88"
            strokeWidth="1"
            opacity="0.2"
          />
        </svg>
      </div>
      <div style={styles.cornerTR} aria-hidden="true">
        <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
          <path
            d="M60 60 L60 0 L0 0"
            stroke="#00ff88"
            strokeWidth="1"
            opacity="0.4"
          />
          <path
            d="M60 40 L60 0 L20 0"
            stroke="#00ff88"
            strokeWidth="1"
            opacity="0.2"
          />
        </svg>
      </div>
      <div style={styles.cornerBL} aria-hidden="true">
        <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
          <path
            d="M0 0 L0 60 L60 60"
            stroke="#00ff88"
            strokeWidth="1"
            opacity="0.4"
          />
          <path
            d="M0 20 L0 60 L40 60"
            stroke="#00ff88"
            strokeWidth="1"
            opacity="0.2"
          />
        </svg>
      </div>
      <div style={styles.cornerBR} aria-hidden="true">
        <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
          <path
            d="M60 0 L60 60 L0 60"
            stroke="#00ff88"
            strokeWidth="1"
            opacity="0.4"
          />
          <path
            d="M60 20 L60 60 L20 60"
            stroke="#00ff88"
            strokeWidth="1"
            opacity="0.2"
          />
        </svg>
      </div>

      <div style={styles.container}>
        {/* Logo/Title */}
        <div style={styles.titleBlock}>
          <div style={styles.shield} aria-hidden="true">
            <svg width="48" height="56" viewBox="0 0 48 56" fill="none">
              <path
                d="M24 2L4 10V26C4 38 13 49 24 54C35 49 44 38 44 26V10L24 2Z"
                stroke="#00ff88"
                strokeWidth="1.5"
                fill="rgba(0,255,136,0.05)"
              />
              <path
                d="M24 8L10 14V26C10 35 16 43 24 48C32 43 38 35 38 26V14L24 8Z"
                stroke="#00ff88"
                strokeWidth="0.5"
                strokeDasharray="3 3"
                fill="none"
                opacity="0.4"
              />
              <text
                x="24"
                y="33"
                textAnchor="middle"
                fill="#00ff88"
                fontSize="16"
                fontFamily="Share Tech Mono"
                fontWeight="bold"
              >
                ⬡
              </text>
            </svg>
          </div>

          <div style={styles.glitchWrapper}>
            <h1 style={styles.title} className="sentinel-title">
              SENTINEL
            </h1>
            <div style={styles.titleGhost} aria-hidden="true">
              SENTINEL
            </div>
          </div>

          <p style={styles.subtitle}>AI-POWERED WEB SECURITY SCANNER</p>

          <div style={styles.divider}>
            <span style={styles.dividerLine}></span>
            <span style={styles.dividerDot}></span>
            <span style={styles.dividerLine}></span>
          </div>
        </div>

        {/* Boot sequence terminal */}
        <div style={styles.bootTerminal}>
          {bootLines.map((line, i) => (
            <div
              key={i}
              style={{
                ...styles.bootLine,
                animationDelay: `${i * 0.05}s`,
                color:
                  line && line.includes("OPERATIONAL")
                    ? "#00ff88"
                    : line && line.includes("LOADING")
                      ? "#7a9e8a"
                      : "#4a7a5a",
              }}
            >
              {line}
              {i === bootLines.length - 1 &&
                bootLines.length < bootSequence.length && (
                  <span style={styles.cursor}>█</span>
                )}
            </div>
          ))}
          {bootLines.length === bootSequence.length && (
            <div
              style={{ ...styles.bootLine, color: "#00ff88", marginTop: "4px" }}
            >
              &gt; READY FOR TARGET ACQUISITION
              <span style={styles.cursor}>█</span>
            </div>
          )}
        </div>

        {/* Scan form */}
        <form onSubmit={handleSubmit} style={styles.form} noValidate>
          <div style={styles.inputWrapper}>
            <label style={styles.label} htmlFor="url-input">
              <span style={styles.labelDot}></span>
              TARGET URL
            </label>
            <div
              style={{
                ...styles.inputContainer,
                ...(inputFocused ? styles.inputContainerFocused : {}),
              }}
            >
              <span style={styles.inputPrefix}>$&nbsp;</span>
              <input
                ref={inputRef}
                id="url-input"
                type="text"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  setError("");
                }}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                placeholder="https://target.example.com"
                style={styles.input}
                autoComplete="off"
                spellCheck={false}
                disabled={loading}
              />
              {url && !loading && (
                <button
                  type="button"
                  onClick={() => {
                    setUrl("");
                    setError("");
                    inputRef.current?.focus();
                  }}
                  style={styles.clearBtn}
                  aria-label="Clear input"
                >
                  ✕
                </button>
              )}
            </div>
            {error && (
              <div style={styles.errorMsg}>
                <span style={styles.errorIcon}>⚠</span>
                {error}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.button,
              ...(loading ? styles.buttonLoading : {}),
            }}
          >
            {loading ? (
              <>
                <span style={styles.spinnerDot}></span>
                <span style={styles.spinnerDot}></span>
                <span style={styles.spinnerDot}></span>
                &nbsp;INITIATING SCAN...
              </>
            ) : (
              <>
                <span style={styles.buttonArrow}>▶</span>
                INITIATE SCAN
              </>
            )}
          </button>
        </form>

        {/* Feature tags */}
        <div style={styles.tags}>
          {[
            "OWASP TOP 10",
            "SSL/TLS AUDIT",
            "HEADER ANALYSIS",
            "INJECTION TESTS",
            "AI ANALYSIS",
          ].map((tag) => (
            <span key={tag} style={styles.tag}>
              {tag}
            </span>
          ))}
        </div>

        {/* Status bar */}
        <div style={styles.statusBar}>
          <span style={styles.statusDot}></span>
          <span style={styles.statusText}>SYSTEMS NOMINAL</span>
          <span style={styles.statusSep}>|</span>
          <span style={styles.statusText}>v3.7.1</span>
          <span style={styles.statusSep}>|</span>
          <span style={styles.statusText}>47,291 SIGNATURES</span>
        </div>
      </div>

      <style>{`
        .sentinel-title {
          font-family: 'Share Tech Mono', monospace;
          font-size: clamp(56px, 10vw, 96px);
          font-weight: 400;
          letter-spacing: 0.15em;
          color: #00ff88;
          text-shadow:
            0 0 10px rgba(0,255,136,0.8),
            0 0 20px rgba(0,255,136,0.5),
            0 0 40px rgba(0,255,136,0.3);
          animation: glitch 6s infinite, glow-pulse 3s ease-in-out infinite;
          position: relative;
          z-index: 1;
          line-height: 1;
          margin: 0;
        }

        .sentinel-btn:hover {
          background: rgba(0, 255, 136, 0.1) !important;
          box-shadow: 0 0 20px rgba(0,255,136,0.4), inset 0 0 20px rgba(0,255,136,0.05) !important;
          letter-spacing: 0.2em !important;
          transform: translateY(-1px);
        }

        .sentinel-tag:hover {
          background: rgba(0,255,136,0.12) !important;
          border-color: rgba(0,255,136,0.4) !important;
          color: #00ff88 !important;
        }

        @keyframes dot-blink {
          0%, 60%, 100% { opacity: 1; }
          30% { opacity: 0; }
        }

        .spinner-dot:nth-child(1) { animation: dot-blink 1.2s infinite 0s; }
        .spinner-dot:nth-child(2) { animation: dot-blink 1.2s infinite 0.2s; }
        .spinner-dot:nth-child(3) { animation: dot-blink 1.2s infinite 0.4s; }

        @media (max-width: 600px) {
          .sentinel-title { font-size: 48px !important; }
        }
      `}</style>
    </main>
  );
}

const styles = {
  main: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 20px",
    position: "relative",
  },
  cornerTL: {
    position: "fixed",
    top: "16px",
    left: "16px",
    zIndex: 10,
  },
  cornerTR: {
    position: "fixed",
    top: "16px",
    right: "16px",
    zIndex: 10,
  },
  cornerBL: {
    position: "fixed",
    bottom: "16px",
    left: "16px",
    zIndex: 10,
  },
  cornerBR: {
    position: "fixed",
    bottom: "16px",
    right: "64px",
    zIndex: 10,
  },
  container: {
    width: "100%",
    maxWidth: "680px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "32px",
    position: "relative",
    zIndex: 1,
    animation: "fade-in-up 0.8s ease both",
  },
  titleBlock: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px",
    textAlign: "center",
  },
  shield: {
    marginBottom: "8px",
    filter: "drop-shadow(0 0 8px rgba(0,255,136,0.5))",
    animation: "glow-pulse 3s ease-in-out infinite",
  },
  glitchWrapper: {
    position: "relative",
    display: "inline-block",
  },
  titleGhost: {
    position: "absolute",
    top: 0,
    left: 0,
    fontFamily: "'Share Tech Mono', monospace",
    fontSize: "clamp(56px, 10vw, 96px)",
    fontWeight: 400,
    letterSpacing: "0.15em",
    color: "#00ff88",
    lineHeight: 1,
    margin: 0,
    opacity: 0,
    animation: "glitch-2 6s infinite",
    pointerEvents: "none",
    zIndex: 0,
  },
  subtitle: {
    fontFamily: "'Share Tech Mono', monospace",
    fontSize: "12px",
    letterSpacing: "0.3em",
    color: "#00cc6a",
    textTransform: "uppercase",
    marginTop: "4px",
    opacity: 0.8,
  },
  divider: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    width: "200px",
    marginTop: "4px",
  },
  dividerLine: {
    flex: 1,
    height: "1px",
    background: "linear-gradient(90deg, transparent, rgba(0,255,136,0.3))",
  },
  dividerDot: {
    width: "4px",
    height: "4px",
    borderRadius: "50%",
    background: "rgba(0,255,136,0.6)",
  },
  bootTerminal: {
    width: "100%",
    background: "rgba(0,0,0,0.4)",
    border: "1px solid rgba(0,255,136,0.15)",
    borderRadius: "4px",
    padding: "16px 20px",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "11px",
    lineHeight: "1.8",
    maxHeight: "160px",
    overflowY: "hidden",
  },
  bootLine: {
    animation: "fade-in-up 0.3s ease both",
    display: "block",
  },
  cursor: {
    display: "inline-block",
    animation: "terminal-blink 1s step-end infinite",
    marginLeft: "2px",
    color: "#00ff88",
  },
  form: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  inputWrapper: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  label: {
    fontFamily: "'Share Tech Mono', monospace",
    fontSize: "11px",
    letterSpacing: "0.2em",
    color: "#7a9e8a",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    textTransform: "uppercase",
  },
  labelDot: {
    display: "inline-block",
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: "#00ff88",
    animation: "glow-pulse 2s ease-in-out infinite",
  },
  inputContainer: {
    display: "flex",
    alignItems: "center",
    background: "rgba(0,0,0,0.5)",
    border: "1px solid rgba(0,255,136,0.2)",
    borderRadius: "4px",
    padding: "0 16px",
    transition: "all 0.2s ease",
    position: "relative",
  },
  inputContainerFocused: {
    borderColor: "#00ff88",
    boxShadow: "0 0 0 1px rgba(0,255,136,0.3), 0 0 20px rgba(0,255,136,0.1)",
    background: "rgba(0,255,136,0.02)",
  },
  inputPrefix: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "16px",
    color: "#00ff88",
    opacity: 0.7,
    userSelect: "none",
    flexShrink: 0,
  },
  input: {
    flex: 1,
    background: "transparent",
    border: "none",
    outline: "none",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "16px",
    color: "#e0ffe8",
    padding: "16px 8px",
    width: "100%",
    caretColor: "#00ff88",
  },
  clearBtn: {
    background: "none",
    border: "none",
    color: "#3d5a4a",
    cursor: "pointer",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "14px",
    padding: "4px",
    transition: "color 0.2s",
    flexShrink: 0,
  },
  errorMsg: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "11px",
    color: "#ff4466",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 12px",
    background: "rgba(255,34,68,0.08)",
    border: "1px solid rgba(255,34,68,0.2)",
    borderRadius: "4px",
    animation: "fade-in-up 0.2s ease",
  },
  errorIcon: {
    fontSize: "12px",
    flexShrink: 0,
  },
  button: {
    fontFamily: "'Share Tech Mono', monospace",
    fontSize: "14px",
    letterSpacing: "0.15em",
    color: "#00ff88",
    background: "rgba(0,0,0,0.4)",
    border: "1px solid rgba(0,255,136,0.5)",
    borderRadius: "4px",
    padding: "18px 32px",
    cursor: "pointer",
    transition: "all 0.2s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    width: "100%",
    textTransform: "uppercase",
    position: "relative",
    overflow: "hidden",
  },
  buttonLoading: {
    opacity: 0.7,
    cursor: "not-allowed",
    letterSpacing: "0.12em",
  },
  buttonArrow: {
    fontSize: "12px",
    opacity: 0.8,
  },
  spinnerDot: {
    display: "inline-block",
    width: "5px",
    height: "5px",
    borderRadius: "50%",
    background: "#00ff88",
  },
  tags: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    justifyContent: "center",
  },
  tag: {
    fontFamily: "'Share Tech Mono', monospace",
    fontSize: "10px",
    letterSpacing: "0.12em",
    color: "#4a7a5a",
    border: "1px solid rgba(0,255,136,0.1)",
    borderRadius: "2px",
    padding: "4px 10px",
    transition: "all 0.2s",
    cursor: "default",
  },
  statusBar: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "10px",
    color: "#3d5a4a",
    letterSpacing: "0.1em",
  },
  statusDot: {
    display: "inline-block",
    width: "5px",
    height: "5px",
    borderRadius: "50%",
    background: "#00ff88",
    animation: "glow-pulse 2s ease-in-out infinite",
  },
  statusText: {
    color: "#3d5a4a",
  },
  statusSep: {
    color: "#1a2a1f",
  },
};
