import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TabularPractice | 考研真题墙",
  description: "基于大数据的考研数学真题刷题系统",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className={inter.className} suppressHydrationWarning>
        <Navbar />
        <main className="min-h-screen bg-slate-50/50">
          {children}
          <Toaster />
        </main>
      </body>
    </html>
  );
}
