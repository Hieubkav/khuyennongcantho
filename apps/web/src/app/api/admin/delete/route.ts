import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@dohy/backend/convex/_generated/api";
import { cookies } from "next/headers";
import { verifyAdminSession } from "@/lib/session";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: Request) {
  try {
    const token = (await cookies()).get("adminSession")?.value;
    const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "";
    if (!token || !secret || !verifyAdminSession(token, secret)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const payload = JSON.parse(Buffer.from(token.split(".")[0], "base64").toString("utf8"));
    const superEmail = process.env.ADMIN_EMAIL;
    if (!superEmail || payload?.username !== superEmail) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { id, username } = body ?? {};
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    if (username && superEmail && username === superEmail) {
      return NextResponse.json({ error: "Cannot delete super admin" }, { status: 400 });
    }
    await convex.mutation(api.admins.deleteById, { id });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Failed" }, { status: 500 });
  }
}
