import "./global.css";

export const metadata = {
  title: "SENTINEL — AI-Powered Web Security Scanner",
  description:
    "Advanced AI-powered web security scanner. Detect vulnerabilities, misconfigurations, and threats in real-time.",
  keywords:
    "security scanner, web security, vulnerability scanner, penetration testing, AI security",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=JetBrains+Mono:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div className="grid-bg" aria-hidden="true" />
        {children}

        <style>{`
          #createos-badge {
            position: fixed;
            bottom: 12px;
            right: 12px;
            z-index: 9999;
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 6px 10px;
            background: rgba(255,255,255,0.92);
            backdrop-filter: blur(8px);
            border: 1px solid rgba(0,0,0,0.08);
            border-radius: 999px;
            box-shadow: 0 1px 4px rgba(0,0,0,0.10);
            font-size: 11px;
            font-weight: 500;
            color: #374151;
            text-decoration: none;
            font-family: system-ui, sans-serif;
          }
          #createos-badge:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.15); }
          #createos-badge img { width: 14px; height: 14px; }
        `}</style>
        <a
          id="createos-badge"
          href="https://createos.sh/app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img src="https://nodeops.network/SymbolBlack.svg" alt="" />
          Built with CreateOS
        </a>
      </body>
    </html>
  );
}
