/**
 * Guest password hashing and verification using PBKDF2 (Web Crypto API).
 *
 * Stored format: `$pbkdf2$<saltHex>$<hashHex>`
 * Legacy formats supported for read (verify only):
 *   `$sha256$<hashHex>` — plain SHA-256, migration shim
 *   `<plaintext>`       — bare plaintext, migration shim
 */

export async function hashGuestPassword(pw: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const saltHex = Array.from(salt)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(pw),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 100_000, hash: "SHA-256" },
    key,
    256,
  );
  const hashHex = Array.from(new Uint8Array(bits))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `$pbkdf2$${saltHex}$${hashHex}`;
}

export async function verifyGuestPassword(
  submitted: string,
  stored: string,
): Promise<boolean> {
  if (stored.startsWith("$pbkdf2$")) {
    const parts = stored.split("$"); // ["", "pbkdf2", saltHex, hashHex]
    const salt = new Uint8Array(
      parts[2].match(/.{2}/g)!.map((b) => parseInt(b, 16)),
    );
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(submitted),
      "PBKDF2",
      false,
      ["deriveBits"],
    );
    const bits = await crypto.subtle.deriveBits(
      { name: "PBKDF2", salt, iterations: 100_000, hash: "SHA-256" },
      key,
      256,
    );
    const computedHex = Array.from(new Uint8Array(bits))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return computedHex === parts[3];
  }
  if (stored.startsWith("$sha256$")) {
    const buf = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(submitted),
    );
    const hex = Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return `$sha256$${hex}` === stored;
  }
  return submitted === stored; // plaintext migration shim
}
