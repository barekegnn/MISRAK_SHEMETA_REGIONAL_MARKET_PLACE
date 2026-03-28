import type { Metadata, Viewport } from "next";
import { DM_Sans, Fraunces, Noto_Sans_Ethiopic } from "next/font/google";
import { Toaster } from "sonner";
import { AuthProvider } from "@/components/providers/auth-provider";
import { LocaleProvider } from "@/components/providers/locale-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { ProfileLocaleSync } from "@/components/providers/profile-locale-sync";
import { DemoBanner } from "@/components/layout/demo-banner";
import { PwaRegister } from "@/components/pwa-register";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
});

const notoEthiopic = Noto_Sans_Ethiopic({
  subsets: ["latin", "ethiopic"],
  variable: "--font-noto-ethiopic",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Misrak Shemeta — Eastern Ethiopia Marketplace",
  description:
    "Trust layer for buyers, sellers, and runners — AI assistant, M-PESA, escrow.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "Misrak Shemeta",
    statusBarStyle: "default",
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#4F46E5",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

/** Avoid prerender without Supabase env (CI / local build) */
export const dynamic = "force-dynamic";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body
        className={`${dmSans.variable} ${fraunces.variable} ${notoEthiopic.variable} flex min-h-full flex-col antialiased`}
      >
        <QueryProvider>
          <AuthProvider>
            <LocaleProvider>
              <ProfileLocaleSync />
              <DemoBanner />
              {children}
              <Toaster richColors position="top-center" />
            </LocaleProvider>
          </AuthProvider>
        </QueryProvider>
        <PwaRegister />
      </body>
    </html>
  );
}
