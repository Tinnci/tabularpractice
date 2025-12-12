import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { PwaRegister } from "@/components/PwaRegister";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { AutoSyncManager } from "@/components/business/Core";
import { SyncConflictModal } from "@/components/business/Settings";



import { DICT } from "@/lib/i18n";

export const metadata: Metadata = {
  title: DICT.app.title,
  description: DICT.app.description,
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
          <AutoSyncManager />
          <SyncConflictModal />
          <main className="min-h-[calc(100vh-3.5rem)] bg-gradient-to-br from-background via-muted/20 to-background overflow-x-hidden">
            {children}
            <Toaster />
            <SpeedInsights />
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
