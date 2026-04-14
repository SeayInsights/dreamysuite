import { Form, Link, redirect, useActionData } from "react-router";
import { createAuth } from "~/lib/auth.server";
import type { Route } from "./+types/_auth.login";
import "~/lib/context";

export function meta() {
  return [{ title: "Sign in — DreamySuite" }];
}

export async function loader({ request, context }: Route.LoaderArgs) {
  const auth = createAuth(context.cloudflare.env);
  const session = await auth.api.getSession({ headers: request.headers });
  if (session) throw redirect("/");
  return null;
}

export async function action({ request, context }: Route.ActionArgs) {
  const formData = await request.formData();
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const auth = createAuth(context.cloudflare.env);

  try {
    const response = await auth.api.signInEmail({
      body: { email, password },
      asResponse: true,
    });

    if (!response.ok) {
      return { error: "Invalid email or password." };
    }

    const headers = new Headers({ Location: "/" });
    response.headers.forEach((value, key) => {
      if (key.toLowerCase() === "set-cookie") {
        headers.append("set-cookie", value);
      }
    });

    return new Response(null, { status: 302, headers });
  } catch {
    return { error: "Invalid email or password." };
  }
}

export default function Login() {
  const data = useActionData<typeof action>();
  const error = data && "error" in data ? data.error : null;

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

      <Form method="post" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
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
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.375rem" }}>
            <label
              htmlFor="password"
              style={{ fontSize: "0.8rem", fontWeight: 500, color: "#44403c" }}
            >
              Password
            </label>
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
          style={{
            width: "100%",
            padding: "0.7rem",
            background: "#B8921A",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "0.9rem",
            fontWeight: 600,
            cursor: "pointer",
            transition: "background 0.15s",
            marginTop: "0.25rem",
          }}
          onMouseOver={(e) =>
            ((e.target as HTMLButtonElement).style.background = "#9A780E")
          }
          onMouseOut={(e) =>
            ((e.target as HTMLButtonElement).style.background = "#B8921A")
          }
        >
          Sign in
        </button>
      </Form>

      <p
        style={{
          textAlign: "center",
          fontSize: "0.85rem",
          color: "#9b8e85",
          marginTop: "1.5rem",
        }}
      >
        Don't have an account?{" "}
        <Link
          to="/signup"
          style={{ color: "#B8921A", fontWeight: 500, textDecoration: "none" }}
        >
          Sign up free
        </Link>
      </p>
    </div>
  );
}
