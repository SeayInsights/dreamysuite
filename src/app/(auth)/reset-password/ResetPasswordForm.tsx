"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

type State = { error: string | null; success: boolean };

interface Props {
  action: (prevState: State, formData: FormData) => Promise<State>;
}

export default function ResetPasswordForm({ action }: Props) {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const expired = searchParams.get("error") === "INVALID_TOKEN";

  const [state, formAction, pending] = useActionState(action, {
    error: null,
    success: false,
  });

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
        Set a new password
      </h1>

      {expired || !token ? (
        <div>
          <p
            style={{
              fontSize: "0.9rem",
              color: "#dc2626",
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: "6px",
              padding: "0.875rem",
              marginTop: "1rem",
              marginBottom: "1.5rem",
            }}
          >
            This reset link is invalid or has expired.
          </p>
          <Link
            href="/forgot-password"
            style={{
              display: "block",
              textAlign: "center",
              padding: "0.7rem",
              background: "#B8921A",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "0.9rem",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Request a new link
          </Link>
        </div>
      ) : state.success ? (
        <div>
          <p
            style={{
              fontSize: "0.9rem",
              color: "#15803d",
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              borderRadius: "6px",
              padding: "0.875rem",
              marginTop: "1rem",
              marginBottom: "1.5rem",
            }}
          >
            Your password has been reset successfully.
          </p>
          <Link
            href="/login"
            style={{
              display: "block",
              textAlign: "center",
              padding: "0.7rem",
              background: "#B8921A",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "0.9rem",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Sign in
          </Link>
        </div>
      ) : (
        <>
          <p
            style={{
              color: "#9b8e85",
              fontSize: "0.9rem",
              marginBottom: "2rem",
            }}
          >
            Enter your new password below.
          </p>

          <form
            action={formAction}
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            <input type="hidden" name="token" value={token} />

            <div>
              <label
                htmlFor="newPassword"
                style={{
                  display: "block",
                  fontSize: "0.8rem",
                  fontWeight: 500,
                  color: "#44403c",
                  marginBottom: "0.375rem",
                }}
              >
                New password
              </label>
              <input
                id="newPassword"
                name="newPassword"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                placeholder="••••••••"
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = "#B8921A")}
                onBlur={(e) => (e.target.style.borderColor = "#e8e4e0")}
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                style={{
                  display: "block",
                  fontSize: "0.8rem",
                  fontWeight: 500,
                  color: "#44403c",
                  marginBottom: "0.375rem",
                }}
              >
                Confirm password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                placeholder="••••••••"
                style={inputStyle}
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
              {pending ? "Resetting…" : "Reset password"}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
