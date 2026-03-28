"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useLocale } from "@/components/providers/locale-provider";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PitchPage() {
  const { t, messages } = useLocale();
  const slides = messages.pitch.slides;
  const [i, setI] = useState(0);

  const next = useCallback(() => setI((x) => Math.min(x + 1, slides.length - 1)), [slides.length]);
  const prev = useCallback(() => setI((x) => Math.max(x - 1, 0)), []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight" || e.key === " ") next();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "Escape") document.body.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev]);

  const s = slides[i];

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-16">
        <AnimatePresence mode="wait">
          <motion.div
            key={i}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            className="max-w-3xl text-center"
          >
            <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-accent-400">
              {i + 1} / {slides.length}
            </p>
            <h1 className="font-display text-4xl font-bold leading-tight md:text-5xl">
              {s.title}
            </h1>
            <p className="mt-8 text-lg leading-relaxed text-indigo-100/90 md:text-xl">
              {s.body}
            </p>
          </motion.div>
        </AnimatePresence>
        <div className="mt-12 flex gap-4">
          <Button
            type="button"
            variant="secondary"
            size="lg"
            className="rounded-2xl"
            onClick={prev}
            disabled={i === 0}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            type="button"
            size="lg"
            className="rounded-2xl bg-accent-500 text-brand-950 hover:bg-accent-400"
            onClick={next}
            disabled={i === slides.length - 1}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
        <p className="mt-8 text-xs text-indigo-300/80">{t("pitch.hint")}</p>
        <Link href="/" className="mt-6 text-sm text-accent-300 underline">
          ← App home
        </Link>
      </div>
    </div>
  );
}
