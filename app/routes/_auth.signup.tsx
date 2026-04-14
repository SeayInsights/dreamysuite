import { Form, Link, redirect, useActionData } from "react-router";
import { createAuth } from "~/lib/auth.server";
import type { Route } from "./+types/_auth.signup";
import "~/lib/context";

export function meta() {
  return [{ title: "Create account — DreamySuite" }];
}

export async function loader({ request, context }: Route.LoaderArgs) {
  const auth = createAuth(context.cloudflare.env);
  const session = await auth.api.getSession({ headers: request.headers });
  if (session) throw redirect("/");
  return null;
}

export async function action({ request, context }: Route.ActionArgs) {
  const formData = await request.formData();
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!name || !email || !password) {
    return { error: "All fields are required." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const auth = createAuth(context.cloudflare.env);

  try {
    const response = await auth.api.signUpEmail({
      body: { name, email, password },
      asResponse: true,
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      return {
        error:
          (body as { message?: string }).message ?? "Could not create account.",
      };
    }

    const headers = new Headers({ Location: "/" });
    response.headers.forEach((value, key) => {
      if (key.toLowerCase() === "set-cookie") {
        headers.append("set-cookie", value);
      }
    });

    return new Response(null, { status: 302, headers });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[signup error]", msg);
    return { error: msg };
  }
}

export default function Signup() {
  const data = useActionData<typeof action>();
  const error = data && "error" in data ? data.error : null;

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

      <Form method="post" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
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
          Create account
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
        Already have an account?{" "}
        <Link
          to="/login"
          style={{ color: "#B8921A", fontWeight: 500, textDecoration: "none" }}
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
