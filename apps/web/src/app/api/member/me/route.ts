import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyMemberSession } from "@/lib/session";

export async function GET() {
  const token = (await cookies()).get("memberSession")?.value;
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "";
  if (!token || !secret) return NextResponse.json({ ok: false });
  const claims = verifyMemberSession(token, secret);
  if (!claims) return NextResponse.json({ ok: false });
  return NextResponse.json({ ok: true, sub: claims.sub, username: claims.username, name: claims.name ?? null });
}

