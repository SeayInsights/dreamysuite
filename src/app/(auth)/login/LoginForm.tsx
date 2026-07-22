"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch("/api/auth/sign-in/email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
          credentials: "include", // Important: include cookies
        });

        if (!res.ok) {
          setError("Invalid email or password.");
          return;
        }

        // Success - redirect to dashboard
        router.push("/sites");
        router.refresh(); // Refresh to pick up new session
      } catch {
        setError("Invalid email or password.");
      }
    });
  }

  const pending = isPending;

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
        Welcome back
      </h1>
      <p style={{ color: "#9b8e85", fontSize: "0.9rem", marginBottom: "2rem" }}>
        Sign in to your DreamySuite account
      </p>

      <form
        onSubmit={handleSubmit}
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

        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "0.375rem",
            }}
          >
            <label
              htmlFor="password"
              style={{ fontSize: "0.8rem", fontWeight: 500, color: "#44403c" }}
            >
              Password
            </label>
            <Link
              href="/forgot-password"
              style={{
                fontSize: "0.8rem",
                color: "#B8921A",
                textDecoration: "none",
                fontWeight: 500,
              }}
            >
              Forgot password?
            </Link>
          </div>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            placeholder="••••••••"
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
          {pending ? "Signing in…" : "Sign in"}
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
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          style={{ color: "#B8921A", fontWeight: 500, textDecoration: "none" }}
        >
          Sign up free
        </Link>
      </p>
    </div>
  );
}
