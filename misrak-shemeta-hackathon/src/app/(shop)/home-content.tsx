"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/providers/locale-provider";
import { StatsBanner } from "@/components/layout/stats-banner";
import type { PlatformStats } from "@/app/actions/stats";

export function HomeHero({ initial }: { initial: PlatformStats }) {
  const { t } = useLocale();
  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-3xl border border-brand-100 bg-gradient-to-br from-white via-brand-50/40 to-accent-500/10 px-6 py-12 shadow-lg shadow-brand-500/5 md:px-12 md:py-16">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-brand-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 left-10 h-48 w-48 rounded-full bg-accent-400/25 blur-3xl" />
        <div className="relative max-w-2xl space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white/80 px-3 py-1 text-xs font-semibold text-brand-800">
            <Sparkles className="h-3.5 w-3.5 text-accent-600" />
            Gemini-powered PWA
          </div>
          <h1 className="font-display text-3xl font-bold leading-tight tracking-tight text-brand-950 md:text-4xl lg:text-5xl">
            {t("home.title")}
          </h1>
          <p className="max-w-xl text-base text-brand-800/90 md:text-lg">
            {t("home.subtitle")}
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button asChild size="lg" className="rounded-2xl">
              <Link href="/products">
                {t("home.ctaBrowse")}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary" className="rounded-2xl">
              <Link href="/demo">{t("home.ctaDemo")}</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-2xl border-accent-400/60">
              <Link href="/pitch">{t("home.ctaPitch")}</Link>
            </Button>
          </div>
        </div>
      </section>

      <StatsBanner initial={initial} />
    </div>
  );
}
