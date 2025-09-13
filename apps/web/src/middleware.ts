import { NextResponse, type NextRequest } from "next/server";

function b64ToUint8(b64url: string): Uint8Array {
  const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/") + "==".slice((2 - (b64url.length * 3) % 4) % 4);
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function verify(token: string, secret: string): Promise<boolean> {
  const [payloadB64, sigB64] = token.split(".");
  if (!payloadB64 || !sigB64) return false;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );
  const sigBytes = b64ToUint8(sigB64);
  const payloadBytes = new TextEncoder().encode(payloadB64);
  let ok: boolean;
  try {
    const sigView = sigBytes as unknown as ArrayBuffer;
    const payloadView = payloadBytes as unknown as ArrayBuffer;
    ok = await crypto.subtle.verify("HMAC", key, sigView, payloadView);
  } catch {
    // Fallback for runtimes expecting ArrayBuffer
    ok = await crypto.subtle.verify("HMAC", key, sigBytes.buffer as ArrayBuffer, payloadBytes.buffer as ArrayBuffer);
  }
  if (!ok) return false;
  const payloadJson = atob(payloadB64.replace(/-/g, "+").replace(/_/g, "/"));
  try {
    const claims = JSON.parse(payloadJson);
    if (!claims || typeof claims.exp !== "number") return false;
    if (Date.now() / 1000 > claims.exp) return false;
    return true;
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  if (path.startsWith("/dashboard")) {
    const token = req.cookies.get("adminSession")?.value;
    const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "";
    if (!token || !secret || !(await verify(token, secret))) {
      const url = req.nextUrl.clone();
      url.pathname = "/sign-in";
      url.searchParams.set("next", path);
      return NextResponse.redirect(url);
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
