// Uses only Web Crypto + TextEncoder/btoa so this file works identically in
// both the Node runtime (API routes) and the Edge runtime (middleware).

export const SESSION_COOKIE = "aa_session";

async function sha256Base64Url(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const bytes = Array.from(new Uint8Array(hashBuffer));
  const binary = bytes.map((b) => String.fromCharCode(b)).join("");
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** The session token a valid login should produce, derived from PASSWORD
 * (never stored/transmitted in plaintext as the cookie value). */
export async function getExpectedToken(): Promise<string | null> {
  const password = process.env.PASSWORD;
  if (!password) return null;
  return sha256Base64Url(`agent-agar-session:${password}`);
}

export async function isValidSessionToken(token: string | undefined | null): Promise<boolean> {
  if (!token) return false;
  const expected = await getExpectedToken();
  if (!expected) return false;
  return token === expected;
}
