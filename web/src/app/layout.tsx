import type { Metadata, Viewport } from "next";
import { Inter, Noto_Sans_Ethiopic } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { AppChrome } from "@/components/layout/AppChrome";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const notoEthiopic = Noto_Sans_Ethiopic({
  subsets: ["ethiopic"],
  variable: "--font-noto-ethiopic",
  weight: ["400", "600"],
});

export const metadata: Metadata = {
  title: "Misrak Shemeta — Eastern Ethiopia Marketplace",
  description:
    "Trust-first PWA marketplace with escrow, multilingual AI assistant, and regional delivery.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "Misrak Shemeta",
  },
};

export const viewport: Viewport = {
  themeColor: "#4F46E5",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`h-full ${inter.variable} ${notoEthiopic.variable}`} suppressHydrationWarning>
      <body className="min-h-full bg-neutral-50 font-sans antialiased">
        <Providers>
          <AppChrome>{children}</AppChrome>
        </Providers>
      </body>
    </html>
  );
}
