"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { TopBar } from "@/components/layout/TopBar";
import { MarketplaceHeader } from "@/components/layout/MarketplaceHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { ShopAssistant } from "@/components/assistant/ShopAssistant";

const MINIMAL_CHROME_PREFIXES = ["/auth", "/pitch"];
const DASHBOARD_PREFIXES = ["/dashboard", "/admin", "/merchant", "/runner", "/account"];

export function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const minimal = MINIMAL_CHROME_PREFIXES.some((p) => pathname.startsWith(p));
  const dashboard = DASHBOARD_PREFIXES.some((p) => pathname.startsWith(p));

  if (minimal) {
    return (
      <>
        {children}
      </>
    );
  }

  if (dashboard) {
    return (
      <>
        <div className="min-h-screen bg-neutral-50 pb-6">{children}</div>
      </>
    );
  }

  return (
    <>
      <Suspense fallback={<div className="h-[74px] bg-[#1E1B4B]" />}>
        <TopBar />
      </Suspense>
      <MarketplaceHeader />
      <div className="pb-20 md:pb-6">{children}</div>
      <BottomNav />
      <ShopAssistant />
    </>
  );
}
