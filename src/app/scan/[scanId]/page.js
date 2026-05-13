"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

function formatDate(iso) {
  if (!iso) return "N/A";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function severityBadge(severity) {
  const colors = {
    critical: "#ff3b55",
    high: "#ff8c00",
    medium: "#ffd200",
    low: "#33b5ff",
    info: "#8f9bb3",
  };
  return {
    background: colors[severity] ? `${colors[severity]}20` : "#ffffff10",
    borderColor: colors[severity] || "#ffffff33",
    color: colors[severity] || "#ffffff",
  };
}

export default function ScanResultPage({ params }) {
  const { scanId } = params;
  const [scan, setScan] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!scanId) return;

    let isMounted = true;
    const abortController = new AbortController();
    const fetchScan = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`/api/scan/${scanId}`, {
          signal: abortController.signal,
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(
            data.detail || data.message || `API error ${response.status}`,
          );
        }

        const data = await response.json();
        if (isMounted) {
          setScan(data);
        }
      } catch (err) {
        if (isMounted && err.name !== "AbortError") {
          setError(err.message || "Unable to load scan result.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchScan();
    const interval = setInterval(fetchScan, 3000);

    return () => {
      isMounted = false;
      abortController.abort();
      clearInterval(interval);
    };
  }, [scanId]);

  return (
    <main style={styles.main}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Scan Result</h1>
            <p style={styles.subtitle}>Scan ID: {scanId}</p>
          </div>
          <Link href="/" style={styles.homeLink}>
            ← Back to Scanner
          </Link>
        </div>

        {loading && <div style={styles.message}>Loading scan results...</div>}
        {error && <div style={styles.error}>{error}</div>}

        {scan && !loading && !error && (
          <div>
            <div style={styles.metaRow}>
              <div style={styles.metaItem}>
                <span style={styles.metaLabel}>URL</span>
                <span style={styles.urlText}>{scan.url}</span>
              </div>
              <div style={styles.metaItem}>
                <span style={styles.metaLabel}>Status</span>
                <span style={styles.statusTag}>
                  {scan.status.toUpperCase()}
                </span>
              </div>
            </div>
            <div style={styles.metaRow}>
              <div style={styles.metaItem}>
                <span style={styles.metaLabel}>Created</span>
                <span>{formatDate(scan.createdAt)}</span>
              </div>
              <div style={styles.metaItem}>
                <span style={styles.metaLabel}>Completed</span>
                <span>
                  {scan.completedAt ? formatDate(scan.completedAt) : "Pending"}
                </span>
              </div>
            </div>
            <div style={styles.metaRow}>
              <div style={{ ...styles.metaItem, gridColumn: "1 / -1" }}>
                <div style={styles.progressLabelRow}>
                  <span style={styles.metaLabel}>Progress</span>
                  <span>{scan.progress ?? 0}%</span>
                </div>
                <div style={styles.progressOuter}>
                  <div
                    className={
                      scan?.status === "running" ? "progress-animated" : ""
                    }
                    style={{
                      ...styles.progressInner,
                      width: `${scan.progress ?? 0}%`,
                    }}
                  />
                </div>
                {scan.currentStep && (
                  <div style={styles.stepText}>{scan.currentStep}</div>
                )}
              </div>
            </div>

            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>Findings</h2>
              {scan.findings.length === 0 ? (
                <div style={styles.empty}>
                  No findings yet. The scan may still be running.
                </div>
              ) : (
                scan.findings.map((finding) => (
                  <div key={finding.id} style={styles.findingCard}>
                    <div style={styles.findingHeader}>
                      <span style={styles.findingCategory}>
                        {finding.category}
                      </span>
                      <span
                        style={{
                          ...styles.findingSeverity,
                          ...severityBadge(finding.severity),
                        }}
                      >
                        {finding.severity.toUpperCase()}
                      </span>
                    </div>
                    <h3 style={styles.findingTitle}>{finding.title}</h3>
                    <p style={styles.findingText}>{finding.description}</p>
                    {finding.evidence && (
                      <p style={styles.findingEvidence}>
                        <strong>Evidence:</strong> {finding.evidence}
                      </p>
                    )}
                    {finding.remediation && (
                      <p style={styles.findingRemediation}>
                        <strong>Remediation:</strong> {finding.remediation}
                      </p>
                    )}
                  </div>
                ))
              )}
            </section>
          </div>
        )}
      </div>
    </main>
  );
}

const styles = {
  main: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    padding: "40px 20px",
    background: "linear-gradient(180deg, #080b14 0%, #0e1428 100%)",
  },
  card: {
    width: "100%",
    maxWidth: "980px",
    borderRadius: "24px",
    background: "rgba(8, 12, 20, 0.95)",
    border: "1px solid rgba(0, 255, 136, 0.1)",
    boxShadow: "0 24px 80px rgba(0, 0, 0, 0.35)",
    padding: "32px",
    color: "#e0ffe8",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
    marginBottom: "24px",
  },
  title: {
    margin: 0,
    fontSize: "clamp(32px, 4vw, 42px)",
    letterSpacing: "0.18em",
    textTransform: "uppercase",
  },
  subtitle: {
    margin: "8px 0 0",
    color: "#7a9e8a",
  },
  homeLink: {
    color: "#00ff88",
    textDecoration: "none",
    fontWeight: 600,
  },
  message: {
    padding: "24px",
    color: "#8f9bb3",
    background: "rgba(255,255,255,0.04)",
    borderRadius: "16px",
  },
  error: {
    padding: "24px",
    color: "#ff6b6b",
    background: "rgba(255, 107, 107, 0.12)",
    borderRadius: "16px",
    border: "1px solid rgba(255, 107, 107, 0.2)",
  },
  metaRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "18px",
    marginBottom: "24px",
  },
  metaItem: {
    padding: "18px",
    background: "rgba(255,255,255,0.04)",
    borderRadius: "18px",
    border: "1px solid rgba(0, 255, 136, 0.08)",
    overflowWrap: "anywhere",
    wordBreak: "break-word",
  },
  urlText: {
    display: "block",
    marginTop: "4px",
    color: "#d2ffd8",
    fontSize: "0.95rem",
    lineHeight: 1.5,
    overflowWrap: "anywhere",
    wordBreak: "break-word",
  },
  statusTag: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "8px 14px",
    borderRadius: "999px",
    background: "rgba(0, 255, 136, 0.1)",
    border: "1px solid rgba(0, 255, 136, 0.2)",
    color: "#00ff88",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.12em",
  },
  progressLabelRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    marginBottom: "10px",
  },
  progressOuter: {
    width: "100%",
    height: "10px",
    borderRadius: "999px",
    background: "rgba(255, 255, 255, 0.08)",
    overflow: "hidden",
    border: "1px solid rgba(0, 255, 136, 0.08)",
  },
  progressInner: {
    height: "100%",
    background: "linear-gradient(90deg, #00ff88, #7cffb4)",
    transition: "width 0.3s ease",
  },
  stepText: {
    marginTop: "10px",
    color: "#8f9bb3",
    fontSize: "0.94rem",
  },
  metaLabel: {
    display: "block",
    marginBottom: "8px",
    color: "#7a9e8a",
    fontSize: "13px",
    letterSpacing: "0.14em",
    textTransform: "uppercase",
  },
  section: {
    marginTop: "16px",
  },
  sectionTitle: {
    margin: "0 0 16px",
    fontSize: "1.15rem",
    color: "#00ff88",
  },
  empty: {
    padding: "20px",
    borderRadius: "18px",
    background: "rgba(0, 255, 136, 0.06)",
    color: "#d2ffe1",
  },
  findingCard: {
    padding: "22px",
    marginBottom: "18px",
    background: "rgba(255,255,255,0.04)",
    borderRadius: "20px",
    border: "1px solid rgba(0,255,136,0.08)",
  },
  findingHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    alignItems: "center",
    marginBottom: "12px",
  },
  findingCategory: {
    fontSize: "12px",
    color: "#7a9e8a",
    textTransform: "uppercase",
    letterSpacing: "0.2em",
  },
  findingSeverity: {
    padding: "6px 12px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: 700,
    letterSpacing: "0.08em",
  },
  findingTitle: {
    margin: "0 0 10px",
    fontSize: "1.04rem",
  },
  findingText: {
    margin: "0 0 10px",
    color: "#c6ffd5",
    lineHeight: 1.7,
  },
  findingEvidence: {
    margin: "0 0 6px",
    color: "#a8d7b4",
  },
  findingRemediation: {
    margin: 0,
    color: "#96c89f",
  },
};
