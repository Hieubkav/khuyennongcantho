import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@dohy/backend/convex/_generated/api";
import { signMemberSession } from "@/lib/session";
import crypto from "node:crypto";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

async function hashPBKDF2(password: string, saltB64: string, iter: number): Promise<string> {
  const salt = Buffer.from(saltB64, "base64");
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(password, salt, iter, 32, "sha256", (err, derived) => {
      if (err) return reject(err);
      resolve(derived.toString("base64"));
    });
  });
}

function parseStored(hash: string): { iter: number; saltB64: string; hashB64: string } | null {
  const parts = hash.split("$");
  if (parts.length !== 4 || parts[0] !== "pbkdf2") return null;
  const iter = parseInt(parts[1], 10);
  if (!Number.isFinite(iter)) return null;
  return { iter, saltB64: parts[2], hashB64: parts[3] };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, password } = body ?? {};
    if (!username || !password) return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
    const member = (await convex.query(api.members.getByUsernameWithHash as any, { username })) as any;
    if (!member || !member.active) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    const parsed = parseStored(member.passwordHash);
    if (!parsed) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    const calc = await hashPBKDF2(password, parsed.saltB64, parsed.iter);
    if (calc !== parsed.hashB64) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

    const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 8;
    const token = signMemberSession({ sub: String(member._id), username, name: member.name, exp }, process.env.AUTH_SECRET!);
    const res = NextResponse.json({ ok: true });
    res.cookies.set("memberSession", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 8,
    });
    return res;
  } catch (e: any) {
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}

