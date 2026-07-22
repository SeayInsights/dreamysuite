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

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[dashboard] route error", error.digest ?? "");
  }, [error]);

  return (
    <main style={wrap}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 400, margin: 0 }}>
        Something went wrong in your dashboard
      </h1>
      <p style={{ color: "#78716c", maxWidth: 360 }}>
        An unexpected error occurred. Your sites are safe — try again, or head
        back to your dashboard.
      </p>
      <button type="button" onClick={reset} style={primaryBtn}>
        Try again
      </button>
      <Link href="/" style={{ color: "#78716c", fontSize: "0.875rem" }}>
        Back to dashboard
      </Link>
    </main>
  );
}
