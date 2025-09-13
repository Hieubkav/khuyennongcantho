import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@dohy/backend/convex/_generated/api";
import { cookies } from "next/headers";
import { verifyAdminSession } from "@/lib/session";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

async function hashPasswordPBKDF2(password: string, iter = 100_000) {
  const salt = crypto.randomBytes(16);
  return new Promise<string>((resolve, reject) => {
    crypto.pbkdf2(password, salt, iter, 32, "sha256", (err, derivedKey) => {
      if (err) return reject(err);
      resolve(`pbkdf2$${iter}$${salt.toString("base64")}$${derivedKey.toString("base64")}`);
    });
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, name, phone, password, active, order } = body ?? {};
    if (!username || !name || !password) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    // Allow bootstrap without auth only if there is no admin yet
    const existing = (await convex.query(api.admins.listBrief, {})) as any[];
    if (existing.length > 0) {
      const token = (await cookies()).get("adminSession")?.value;
      const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "";
      if (!token || !secret || !verifyAdminSession(token, secret)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      // Only super admin can create more admins
      try {
        const payload = JSON.parse(Buffer.from(token.split('.')[0], 'base64').toString('utf8')) as any;
        const superEmail = process.env.ADMIN_EMAIL;
        if (!superEmail || payload?.username !== superEmail) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
      } catch {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }
    const passwordHash = await hashPasswordPBKDF2(password);
    const admin = await convex.mutation(api.admins.create, {
      username,
      name,
      phone,
      passwordHash,
      active: active ?? true,
      order: order ?? 0,
    });
    return NextResponse.json({ ok: true, admin });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Failed" }, { status: 500 });
  }
}
