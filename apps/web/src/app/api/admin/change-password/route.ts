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
    const token = (await cookies()).get("adminSession")?.value;
    const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "";
    if (!token || !secret || !verifyAdminSession(token, secret)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();
    const { id, newPassword } = body ?? {};
    if (!id || !newPassword) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    const passwordHash = await hashPasswordPBKDF2(newPassword);
    await convex.mutation(api.admins.changePassword, { id, passwordHash });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Failed" }, { status: 500 });
  }
}
