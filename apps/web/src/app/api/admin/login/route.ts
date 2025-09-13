import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@dohy/backend/convex/_generated/api";
import { signAdminSession } from "@/lib/session";
import crypto from "node:crypto";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

async function hashPasswordPBKDF2(password: string, saltB64: string, iter: number): Promise<string> {
  const salt = Buffer.from(saltB64, "base64");
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(password, salt, iter, 32, "sha256", (err, derivedKey) => {
      if (err) return reject(err);
      resolve(derivedKey.toString("base64"));
    });
  });
}

function parseStored(hash: string): { iter: number; saltB64: string; hashB64: string } | null {
  // format: pbkdf2$<iter>$<saltB64>$<hashB64>
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
    // Bootstrap: if no admin exists, allow creating first admin via login
    const existing = (await convex.query(api.admins.listBrief, {})) as any[];
    let admin = await convex.query(api.admins.getByUsernameWithHash, { username });
    if (!admin && existing.length === 0) {
      const envUser = process.env.ADMIN_EMAIL;
      const envPass = process.env.ADMIN_PASSWORD;
      if ((envUser && username !== envUser) || (envPass && password !== envPass)) {
        return NextResponse.json({ error: "Bootstrap credentials mismatch" }, { status: 401 });
      }
      // Create first admin
      const iter = 100_000;
      const salt = crypto.randomBytes(16).toString("base64");
      const hashB64 = await hashPasswordPBKDF2(password, salt, iter);
      const passwordHash = `pbkdf2$${iter}$${salt}$${hashB64}`;
      const created = (await convex.mutation(api.admins.create, {
        username,
        name: username,
        phone: undefined,
        passwordHash,
        active: true,
        order: 0,
      })) as any;
      admin = { _id: created._id, username: created.username, name: created.name, active: created.active, passwordHash } as any;
    }

    if (!admin || !admin.active) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    const parsed = parseStored(admin.passwordHash);
    if (!parsed) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    const calc = await hashPasswordPBKDF2(password, parsed.saltB64, parsed.iter);
    if (calc !== parsed.hashB64) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

    const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 8; // 8h
    const token = signAdminSession({ sub: String(admin._id), username, name: admin.name, exp }, process.env.AUTH_SECRET!);

    const res = NextResponse.json({ ok: true });
    res.cookies.set("adminSession", token, {
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
