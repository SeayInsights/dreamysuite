"use client";

import { useState } from "react";

/**
 * Signs the user out via better-auth (POST /api/auth/sign-out) then returns to
 * the public homepage. Style is caller-supplied via className so it can live in
 * the dashboard nav or the landing nav. A full navigation (not router.push)
 * guarantees the cleared session cookie is picked up.
 */
export function LogoutButton({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const [pending, setPending] = useState(false);

  async function handleLogout() {
    if (pending) return;
    setPending(true);
    try {
      await fetch("/api/auth/sign-out", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      /* fall through to navigation regardless */
    }
    window.location.href = "/";
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={pending}
      className={className}
      aria-label="Log out"
    >
      {children}
    </button>
  );
}
