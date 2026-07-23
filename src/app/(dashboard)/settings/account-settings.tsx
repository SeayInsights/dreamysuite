"use client";

import { useState } from "react";
import { LogoutButton } from "@/app/components/LogoutButton";

const CARD: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #e8e4e0",
  borderRadius: 12,
  padding: "1.5rem",
  maxWidth: 560,
  marginBottom: "1.25rem",
};
const LABEL: React.CSSProperties = {
  display: "block",
  fontSize: "0.78rem",
  fontWeight: 500,
  color: "#44403c",
  marginBottom: "0.375rem",
};
const INPUT: React.CSSProperties = {
  width: "100%",
  padding: "0.625rem 0.875rem",
  border: "1px solid #e8e4e0",
  borderRadius: 8,
  fontSize: "0.9rem",
  color: "#1c1917",
  background: "#faf8f5",
  outline: "none",
  boxSizing: "border-box",
};
const BTN: React.CSSProperties = {
  padding: "0.6rem 1.25rem",
  background: "#B8921A",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  fontSize: "0.85rem",
  fontWeight: 600,
  cursor: "pointer",
};
const H2: React.CSSProperties = {
  fontSize: "1rem",
  fontWeight: 600,
  color: "#1c1917",
  margin: "0 0 1rem",
};

type Msg = { kind: "ok" | "err"; text: string } | null;

function Notice({ msg }: { msg: Msg }) {
  if (!msg) return null;
  const ok = msg.kind === "ok";
  return (
    <p
      style={{
        fontSize: "0.8rem",
        color: ok ? "#166534" : "#dc2626",
        background: ok ? "#f0fdf4" : "#fef2f2",
        border: `1px solid ${ok ? "#bbf7d0" : "#fecaca"}`,
        borderRadius: 6,
        padding: "0.5rem 0.75rem",
        margin: "0.75rem 0 0",
      }}
    >
      {msg.text}
    </p>
  );
}

export function AccountSettings({
  name: initialName,
  email,
}: {
  name: string;
  email: string;
}) {
  const [name, setName] = useState(initialName);
  const [savingName, setSavingName] = useState(false);
  const [nameMsg, setNameMsg] = useState<Msg>(null);

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [savingPw, setSavingPw] = useState(false);
  const [pwMsg, setPwMsg] = useState<Msg>(null);

  async function saveName(e: React.FormEvent) {
    e.preventDefault();
    setNameMsg(null);
    if (!name.trim()) {
      setNameMsg({ kind: "err", text: "Name can't be empty." });
      return;
    }
    setSavingName(true);
    try {
      const res = await fetch("/api/auth/update-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
        credentials: "include",
      });
      setNameMsg(
        res.ok
          ? { kind: "ok", text: "Name updated." }
          : { kind: "err", text: "Couldn't update your name." },
      );
    } catch {
      setNameMsg({ kind: "err", text: "Network error — try again." });
    } finally {
      setSavingName(false);
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwMsg(null);
    if (next.length < 8) {
      setPwMsg({
        kind: "err",
        text: "New password must be at least 8 characters.",
      });
      return;
    }
    if (next !== confirm) {
      setPwMsg({ kind: "err", text: "New passwords don't match." });
      return;
    }
    setSavingPw(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: current,
          newPassword: next,
          revokeOtherSessions: true,
        }),
        credentials: "include",
      });
      if (res.ok) {
        setPwMsg({ kind: "ok", text: "Password changed." });
        setCurrent("");
        setNext("");
        setConfirm("");
      } else {
        setPwMsg({
          kind: "err",
          text: "Couldn't change password — check your current password.",
        });
      }
    } catch {
      setPwMsg({ kind: "err", text: "Network error — try again." });
    } finally {
      setSavingPw(false);
    }
  }

  return (
    <div className="sites-page ds-animate">
      <div className="sites-header">
        <div>
          <h1 className="sites-heading">Settings</h1>
          <p className="sites-subheading">Manage your account</p>
        </div>
      </div>

      {/* Profile */}
      <form style={CARD} onSubmit={saveName}>
        <h2 style={H2}>Profile</h2>
        <div style={{ marginBottom: "1rem" }}>
          <label htmlFor="acct-name" style={LABEL}>
            Display name
          </label>
          <input
            id="acct-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={INPUT}
          />
        </div>
        <div style={{ marginBottom: "1rem" }}>
          <label style={LABEL}>Email</label>
          <input
            type="email"
            value={email}
            readOnly
            style={{ ...INPUT, color: "#9b8e85", cursor: "not-allowed" }}
          />
        </div>
        <button type="submit" disabled={savingName} style={BTN}>
          {savingName ? "Saving…" : "Save"}
        </button>
        <Notice msg={nameMsg} />
      </form>

      {/* Password */}
      <form style={CARD} onSubmit={changePassword}>
        <h2 style={H2}>Change password</h2>
        <div style={{ marginBottom: "0.875rem" }}>
          <label htmlFor="pw-current" style={LABEL}>
            Current password
          </label>
          <input
            id="pw-current"
            type="password"
            autoComplete="current-password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            style={INPUT}
            required
          />
        </div>
        <div style={{ marginBottom: "0.875rem" }}>
          <label htmlFor="pw-new" style={LABEL}>
            New password
          </label>
          <input
            id="pw-new"
            type="password"
            autoComplete="new-password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            style={INPUT}
            required
          />
        </div>
        <div style={{ marginBottom: "1rem" }}>
          <label htmlFor="pw-confirm" style={LABEL}>
            Confirm new password
          </label>
          <input
            id="pw-confirm"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            style={INPUT}
            required
          />
        </div>
        <button type="submit" disabled={savingPw} style={BTN}>
          {savingPw ? "Updating…" : "Update password"}
        </button>
        <Notice msg={pwMsg} />
      </form>

      {/* Session */}
      <div style={CARD}>
        <h2 style={H2}>Session</h2>
        <LogoutButton
          style={{
            padding: "0.6rem 1.25rem",
            background: "#fff",
            color: "#dc2626",
            border: "1px solid #fecaca",
            borderRadius: 8,
            fontSize: "0.85rem",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Log out
        </LogoutButton>
      </div>
    </div>
  );
}
