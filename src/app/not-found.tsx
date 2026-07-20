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

export default function NotFound() {
  return (
    <main style={wrap}>
      <p
        style={{
          fontSize: "3rem",
          fontWeight: 400,
          color: "#B8921A",
          margin: 0,
        }}
      >
        404
      </p>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 400, margin: 0 }}>
        We couldn&apos;t find that page
      </h1>
      <p style={{ color: "#78716c", maxWidth: 360 }}>
        The link may be broken, or the page may have been moved.
      </p>
      <Link
        href="/"
        style={{
          marginTop: "0.75rem",
          padding: "0.625rem 1.5rem",
          background: "#B8921A",
          color: "#fff",
          textDecoration: "none",
          borderRadius: 6,
        }}
      >
        Go home
      </Link>
    </main>
  );
}
