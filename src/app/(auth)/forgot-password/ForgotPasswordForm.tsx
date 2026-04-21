"use client";

import { useActionState } from "react";
import Link from "next/link";

type State = { error: string | null; success: boolean };

interface Props {
  action: (prevState: State, formData: FormData) => Promise<State>;
}

export default function ForgotPasswordForm({ action }: Props) {
  const [state, formAction, pending] = useActionState(action, {
    error: null,
    success: false,
  });

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
        Reset your password
      </h1>
      <p style={{ color: "#9b8e85", fontSize: "0.9rem", marginBottom: "2rem" }}>
        Enter your email and we&apos;ll send you a reset link.
      </p>

      {state.success ? (
        <div>
          <p
            style={{
              fontSize: "0.9rem",
              color: "#15803d",
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              borderRadius: "6px",
              padding: "0.875rem",
              marginBottom: "1.5rem",
            }}
          >
            If that email exists in our system, you&apos;ll receive a password
            reset link shortly. Check your inbox.
          </p>
          <Link
            href="/login"
            style={{
              display: "block",
              textAlign: "center",
              color: "#B8921A",
              fontWeight: 500,
              fontSize: "0.9rem",
              textDecoration: "none",
            }}
          >
            Back to sign in
          </Link>
        </div>
      ) : (
        <>
          <form
            action={formAction}
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            <div>
              <label
                htmlFor="email"
                style={{
                  display: "block",
                  fontSize: "0.8rem",
                  fontWeight: 500,
                  color: "#44403c",
                  marginBottom: "0.375rem",
                }}
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="you@example.com"
                style={{
                  width: "100%",
                  padding: "0.625rem 0.875rem",
                  border: "1px solid #e8e4e0",
                  borderRadius: "8px",
                  fontSize: "0.9rem",
                  color: "#1c1917",
                  background: "#faf8f5",
                  outline: "none",
                  transition: "border-color 0.15s",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#B8921A")}
                onBlur={(e) => (e.target.style.borderColor = "#e8e4e0")}
              />
            </div>

            {state.error && (
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
                {state.error}
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
              {pending ? "Sending…" : "Send reset link"}
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
            Remember your password?{" "}
            <Link
              href="/login"
              style={{
                color: "#B8921A",
                fontWeight: 500,
                textDecoration: "none",
              }}
            >
              Sign in
            </Link>
          </p>
        </>
      )}
    </div>
  );
}
