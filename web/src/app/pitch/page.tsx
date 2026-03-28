"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";
import { getMockProducts, MOCK_SHOPS } from "@/lib/mock/catalog";

const SLIDES = [
  {
    title: "Problem",
    body: "Shops are invisible online. Buyers travel hours. Payments get scammed. No trust layer in Eastern Ethiopia.",
  },
  {
    title: "Solution",
    body: "Misrak Shemeta: escrow, OTP delivery, multilingual AI assistant, and structured work for runners.",
  },
  {
    title: "Market",
    body: "3M+ people across Harar, Dire Dawa, Haramaya, Jijiga, Aweday — zero comprehensive digital marketplaces today.",
  },
  {
    title: "Tech",
    body: "Next.js PWA · Supabase · OpenAI GPT-4o · Chapa + M-Pesa demo checkout.",
  },
  {
    title: "Traction (demo)",
    body: "",
  },
  {
    title: "Ask",
    body: "Raising seed to expand trust infrastructure across every town in Eastern Ethiopia.",
  },
];

export default function PitchPage() {
  const [i, setI] = useState(0);
  const slide = SLIDES[i];
  const products = getMockProducts().length;
  const shops = MOCK_SHOPS.length;

  const next = useCallback(() => setI((x) => (x + 1) % SLIDES.length), []);
  const prev = useCallback(
    () => setI((x) => (x - 1 + SLIDES.length) % SLIDES.length),
    [],
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev]);

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-[#1E1B4B] via-[#312e81] to-[#4F46E5] text-white">
      <header className="flex items-center justify-between px-6 py-4">
        <span className="font-semibold">🌅 Misrak Shemeta</span>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={prev}>
            ◀
          </Button>
          <span className="flex items-center text-sm text-indigo-200">
            {i + 1} / {SLIDES.length}
          </span>
          <Button variant="secondary" size="sm" onClick={next}>
            ▶
          </Button>
        </div>
      </header>
      <main className="flex flex-1 flex-col items-center justify-center px-8 pb-24">
        <h1 className="text-center text-4xl font-bold md:text-5xl">{slide.title}</h1>
        {slide.title === "Traction (demo)" ? (
          <div className="mt-10 grid gap-6 text-center text-2xl font-semibold md:grid-cols-2">
            <p>{products} products live</p>
            <p>{shops} partner shops</p>
          </div>
        ) : (
          <p className="mt-8 max-w-2xl text-center text-lg text-indigo-100 md:text-xl">
            {slide.body}
          </p>
        )}
      </main>
      <footer className="px-6 py-4 text-center text-sm text-indigo-200">
        <LinkButton
          href="/"
          variant="outline"
          className="border-white/40 text-white hover:bg-white/10"
        >
          Exit app
        </LinkButton>
      </footer>
    </div>
  );
}
