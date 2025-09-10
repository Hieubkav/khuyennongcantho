"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ThemeProvider } from "./theme-provider";
import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";
import { Toaster } from "./ui/sonner";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export default function Providers({ children, session }: { children: React.ReactNode; session?: Session | null }) {
	return (
		<SessionProvider session={session}>
		<ThemeProvider
			attribute="class"
			defaultTheme="system"
			enableSystem
			disableTransitionOnChange
		>
			<ConvexProvider client={convex}>{children}</ConvexProvider>
			<Toaster richColors />
		</ThemeProvider>
		</SessionProvider>
	);
}
