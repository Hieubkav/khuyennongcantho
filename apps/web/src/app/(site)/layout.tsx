import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../../index.css";
import Providers from "@/components/providers";
import Header from "@/components/header";

export const metadata: Metadata = {
  title: "Khuyến nông Cần Thơ",
  description: "Trang thông tin Khuyến nông Cần Thơ",
  keywords: ["khuyến nông", "cần thơ", "nông nghiệp"],
  openGraph: {
    title: "Khuyến nông Cần Thơ",
    description: "Trang thông tin Khuyến nông Cần Thơ",
  },
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
      <Providers>
                <div className="min-h-svh">
          <Header />
          {children}
        </div>
      </Providers>
    </div>
  );
}

