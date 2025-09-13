import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAdminSession } from "@/lib/session";

export async function GET() {
  const token = (await cookies()).get("adminSession")?.value;
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "";
  const superUsername = process.env.ADMIN_EMAIL || null;
  if (!token || !secret) return NextResponse.json({ ok: false });
  const claims = verifyAdminSession(token, secret);
  if (!claims) return NextResponse.json({ ok: false });
  const isSuper = !!(superUsername && claims.username === superUsername);
  return NextResponse.json({ ok: true, username: claims.username, name: claims.name ?? null, isSuper, superUsername });
}
