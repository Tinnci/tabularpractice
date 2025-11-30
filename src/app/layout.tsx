import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { PwaRegister } from "@/components/PwaRegister";
import { SpeedInsights } from "@vercel/speed-insights/next";

export const metadata: Metadata = {
  title: "TabularPractice | 真题墙",
  description: "一个真题刷题系统",
  icons: {
    icon: "/favicon.ico",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "TabularPractice",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" }, // zinc-950
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // 禁止缩放，提升 PWA 体验
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <PwaRegister />
          <Navbar />
          <main className="min-h-screen bg-slate-50/50 dark:bg-background">
            {children}
            <Toaster />
            <SpeedInsights />
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
