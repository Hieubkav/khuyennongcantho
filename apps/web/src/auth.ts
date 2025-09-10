import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@dohy/backend/convex/_generated/api";

export const { auth, signIn, signOut, handlers: { GET, POST } } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      authorize: async (credentials) => {
        // Lấy email và password
        const email = credentials.email as string;
        const password = credentials.password as string;

        // Ủy quyền qua Convex: profiles.verifyCredentials
        const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL!;
        const client = new ConvexHttpClient(convexUrl);
        // Nếu chưa có tài khoản (lần đầu), cho phép bootstrap từ ENV
        let user = await client.action(api.auth.verifyCredentials, { email, password });
        // Bootstrap admin lần đầu từ ENV nếu khớp
        if (!user && process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
          const isEnvAdmin =
            email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD;
          if (isEnvAdmin) {
            const existed = await client.query(api.profiles.getByEmail, { email });
            if (!existed) {
              // tạo admin lần đầu
              await client.action(api.auth.createUser, {
                email,
                name: 'Admin',
                role: 'admin',
                password,
              } as any);
            }
            user = await client.action(api.auth.verifyCredentials, { email, password });
          }
        }
        if (!user) return null;
        return {
          id: String(user._id),
          name: user.name ?? user.email,
          email: user.email,
          role: user.role,
        } as any;
      }
    })
  ],
  trustHost: true,
  session: { strategy: 'jwt' },
  callbacks: {
    jwt({ token, user }) {
      (token as any).role = (user as any)?.role ?? (token as any).role ?? 'member';
      return token;
    },
    session({ session, token }) {
      (session.user as any).role = (token as any).role ?? 'member';
      return session;
    }
  },
  secret: process.env.AUTH_SECRET!,
});
