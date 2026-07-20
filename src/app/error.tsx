"use client";

import { useEffect } from "react";

const wrap: React.CSSProperties = {
  fontFamily: "Georgia, serif",
  background: "#faf8f5",
  color: "#292524",
  minHeight: "100dvh",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: "0.75rem",
  padding: "1.5rem",
  textAlign: "center",
};

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface the digest (not the raw message/stack) for correlation.
    console.error("[app] route error", error.digest ?? "");
  }, [error]);

  return (
    <main style={wrap}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 400, margin: 0 }}>
        Something went wrong
      </h1>
      <p style={{ color: "#78716c", maxWidth: 360 }}>
        An unexpected error occurred. You can try again, or head back home.
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
    </main>
  );
}
