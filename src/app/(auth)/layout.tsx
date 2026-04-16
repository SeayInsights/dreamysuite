import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#faf8f5",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
      }}
    >
      <div style={{ marginBottom: "2.5rem", textAlign: "center" }}>
        <Link
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            textDecoration: "none",
          }}
        >
          <span
            style={{
              width: "32px",
              height: "32px",
              background: "#B8921A",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
              <path d="M8 12h8M12 8v8" />
            </svg>
          </span>
          <span
            style={{
              fontSize: "1.25rem",
              fontWeight: 700,
              color: "#1c1917",
              letterSpacing: "-0.02em",
            }}
          >
            DreamySuite
          </span>
        </Link>
      </div>
      {children}
    </div>
  );
}
