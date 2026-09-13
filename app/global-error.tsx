"use client";

/**
 * Last-resort boundary for a throw in the ROOT layout itself.
 *
 * app/error.tsx renders inside the root layout, so it cannot catch a failure
 * in that layout — a bad getSettings() call in generateMetadata, a font load
 * that throws, anything in SiteChrome. When that happens Next replaces the
 * whole document, which is why this file must supply its own <html>/<body>
 * and cannot rely on globals.css being applied. Styles are inlined for that
 * reason, and kept to the brand's cream/forest so the page still reads as
 * KGP PAWS rather than a browser error.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#FAF6EE",
          color: "#173F35",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          padding: "24px",
        }}
      >
        <div style={{ maxWidth: "32rem", textAlign: "center" }}>
          <p
            style={{
              margin: 0,
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "#5F7A6B",
            }}
          >
            KGP PAWS
          </p>
          <h1 style={{ margin: "10px 0 0", fontSize: "28px", lineHeight: 1.2 }}>
            The site failed to load.
          </h1>
          <p style={{ margin: "12px 0 0", fontSize: "15px", lineHeight: 1.6, color: "#5F7A6B" }}>
            This is a fault on our side, not yours. Please try again in a moment.
          </p>

          <div
            style={{
              marginTop: "24px",
              display: "flex",
              gap: "12px",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              onClick={reset}
              style={{
                border: 0,
                cursor: "pointer",
                borderRadius: "9999px",
                padding: "12px 24px",
                fontSize: "14px",
                fontWeight: 700,
                color: "#FFFDF8",
                background: "#C2571E",
              }}
            >
              Try again
            </button>
            {/*
              A plain <a>, not next/link, on purpose: this boundary only
              renders when the root layout itself threw, so the router context
              it would need may be exactly what is broken. A full document
              navigation is the reliable escape hatch here.
            */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/report"
              style={{
                borderRadius: "9999px",
                padding: "12px 24px",
                fontSize: "14px",
                fontWeight: 600,
                textDecoration: "none",
                color: "#173F35",
                border: "1px solid rgba(23,63,53,0.2)",
              }}
            >
              Report an animal
            </a>
          </div>

          {error.digest && (
            <p style={{ marginTop: "20px", fontSize: "11px", color: "#8AA096" }}>
              Reference: {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  );
}
