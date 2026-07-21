"use client";

import { useEffect } from "react";
import Link from "next/link";

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

const primaryBtn: React.CSSProperties = {
  marginTop: "0.75rem",
  padding: "0.625rem 1.5rem",
  background: "#B8921A",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  fontFamily: "inherit",
  fontSize: "0.9375rem",
  cursor: "pointer",
};

// Editor-specific boundary: the editor is a heavy full-screen client surface
// (WebGL effects, drag, dynamic imports), so it gets its own recovery UI
// rather than bubbling to the dashboard boundary.
export default function EditorError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[editor] route error", error.digest ?? "");
  }, [error]);

  return (
    <main style={wrap}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 400, margin: 0 }}>
        The editor hit an unexpected error
      </h1>
      <p style={{ color: "#78716c", maxWidth: 380 }}>
        Your saved work isn&apos;t affected. You can reload the editor, or go
        back to your dashboard.
      </p>
      <button type="button" onClick={reset} style={primaryBtn}>
        Reload editor
      </button>
      <Link href="/" style={{ color: "#78716c", fontSize: "0.875rem" }}>
        Back to dashboard
      </Link>
    </main>
  );
}
