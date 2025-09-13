// Minimal HMAC-signed session token for admin
import crypto from "node:crypto";

export type AdminClaims = {
  sub: string; // admin _id
  username: string;
  name?: string;
  exp: number; // epoch seconds
};

function b64url(input: Buffer | string) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

export function signAdminSession(claims: AdminClaims, secret: string) {
  const payload = b64url(JSON.stringify(claims));
  const sig = crypto.createHmac("sha256", secret).update(payload).digest();
  const token = `${payload}.${b64url(sig)}`;
  return token;
}

export function verifyAdminSession(token: string, secret: string): AdminClaims | null {
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expect = b64url(crypto.createHmac("sha256", secret).update(payload).digest());
  if (crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expect)) === false) return null;
  const claims = JSON.parse(Buffer.from(payload, "base64").toString("utf8")) as AdminClaims;
  if (typeof claims.exp !== "number" || Date.now() / 1000 > claims.exp) return null;
  return claims;
}

