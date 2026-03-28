import { Suspense } from "react";
import { Header } from "@/components/layout/header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { ShopAssistant } from "@/components/assistant/shop-assistant";
import { CampusSelector } from "@/components/onboarding/campus-selector";
import { SkipToMain } from "@/components/layout/skip-link";

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SkipToMain />
      <CampusSelector />
      <Header />
      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto w-full max-w-6xl flex-1 scroll-mt-24 px-4 py-6 pb-[7.5rem] outline-none md:scroll-mt-28 md:pb-12"
      >
        {children}
      </main>
      <BottomNav />
      <Suspense fallback={null}>
        <ShopAssistant />
      </Suspense>
    </>
  );
}
