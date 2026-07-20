"use client";

import { useEffect } from "react";

// global-error replaces the root layout when the layout itself throws, so it
// must render its own <html>/<body> and cannot rely on globals.css.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app] global error", error.digest ?? "");
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          fontFamily: "Georgia, serif",
          background: "#faf8f5",
          color: "#292524",
          minHeight: "100dvh",
          margin: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.75rem",
          padding: "1.5rem",
          textAlign: "center",
        }}
      >
        <h1 style={{ fontSize: "1.5rem", fontWeight: 400, margin: 0 }}>
          Something went wrong
        </h1>
        <p style={{ color: "#78716c", maxWidth: 360 }}>
          The page failed to load. Please try again.
        </p>
        <button
          type="button"
          onClick={reset}
          style={{
            marginTop: "0.75rem",
            padding: "0.625rem 1.5rem",
            background: "#B8921A",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            fontFamily: "inherit",
            fontSize: "0.9375rem",
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
