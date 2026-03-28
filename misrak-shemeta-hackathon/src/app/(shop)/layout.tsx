import { Suspense } from "react";
import { Header } from "@/components/layout/header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { ShopAssistant } from "@/components/assistant/shop-assistant";
import { CampusSelector } from "@/components/onboarding/campus-selector";

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <CampusSelector />
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 pb-28 md:pb-10">
        {children}
      </main>
      <BottomNav />
      <Suspense fallback={null}>
        <ShopAssistant />
      </Suspense>
    </>
  );
}
