"use client";

import { useActionState } from "react";
import Link from "next/link";

type State = { error: string | null };

interface Props {
  action: (prevState: State, formData: FormData) => Promise<State>;
}

export default function SignupForm({ action }: Props) {
  const [state, formAction, pending] = useActionState(action, { error: null });
  const error = state?.error ?? null;

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.625rem 0.875rem",
    border: "1px solid #e8e4e0",
    borderRadius: "8px",
    fontSize: "0.9rem",
    color: "#1c1917",
    background: "#faf8f5",
    outline: "none",
    transition: "border-color 0.15s",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "0.8rem",
    fontWeight: 500,
    color: "#44403c",
    marginBottom: "0.375rem",
  };

  return (
    <div
      style={{
        background: "white",
        borderRadius: "12px",
        border: "1px solid #e8e4e0",
        padding: "2.5rem",
        width: "100%",
        maxWidth: "400px",
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
      }}
    >
      <h1
        style={{
          fontSize: "1.5rem",
          fontWeight: 700,
          color: "#1c1917",
          marginBottom: "0.375rem",
          letterSpacing: "-0.02em",
        }}
      >
        Create your account
      </h1>
      <p style={{ color: "#9b8e85", fontSize: "0.9rem", marginBottom: "2rem" }}>
        Start building beautiful sites with DreamySuite
      </p>

      <form
        action={formAction}
        style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
      >
        <div>
          <label htmlFor="name" style={labelStyle}>
            Full name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            required
            placeholder="Jane Smith"
            style={inputStyle}
            onFocus={(e) => (e.target.style.borderColor = "#B8921A")}
            onBlur={(e) => (e.target.style.borderColor = "#e8e4e0")}
          />
        </div>

        <div>
          <label htmlFor="email" style={labelStyle}>
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
            style={inputStyle}
            onFocus={(e) => (e.target.style.borderColor = "#B8921A")}
            onBlur={(e) => (e.target.style.borderColor = "#e8e4e0")}
          />
        </div>

        <div>
          <label htmlFor="password" style={labelStyle}>
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            placeholder="Min. 8 characters"
            style={inputStyle}
            onFocus={(e) => (e.target.style.borderColor = "#B8921A")}
            onBlur={(e) => (e.target.style.borderColor = "#e8e4e0")}
          />
        </div>

        {error && (
          <p
            style={{
              fontSize: "0.8rem",
              color: "#dc2626",
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: "6px",
              padding: "0.625rem 0.875rem",
            }}
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          style={{
            width: "100%",
            padding: "0.7rem",
            background: "#B8921A",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "0.9rem",
            fontWeight: 600,
            cursor: pending ? "not-allowed" : "pointer",
            transition: "background 0.15s",
            marginTop: "0.25rem",
            opacity: pending ? 0.7 : 1,
          }}
          onMouseOver={(e) => {
            if (!pending)
              (e.target as HTMLButtonElement).style.background = "#9A780E";
          }}
          onMouseOut={(e) =>
            ((e.target as HTMLButtonElement).style.background = "#B8921A")
          }
        >
          {pending ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p
        style={{
          textAlign: "center",
          fontSize: "0.85rem",
          color: "#9b8e85",
          marginTop: "1.5rem",
        }}
      >
        Already have an account?{" "}
        <Link
          href="/login"
          style={{ color: "#B8921A", fontWeight: 500, textDecoration: "none" }}
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
