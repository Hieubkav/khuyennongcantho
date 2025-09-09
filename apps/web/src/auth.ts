import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

export const { auth, signIn, signOut, handlers: { GET, POST } } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      authorize: async (credentials) => {
        // Get email and password from credentials
        const email = credentials.email as string;
        const password = credentials.password as string;
        
        // Compare with ENV variables
        if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
          return { id: 'admin', name: 'Admin', email, role: 'admin' };
        }
        
        // Return null if credentials are invalid
        return null;
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
