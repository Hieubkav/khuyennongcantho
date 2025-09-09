// Ensure Node runtime on Vercel and disable caching
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export { GET, POST } from "@/auth";
