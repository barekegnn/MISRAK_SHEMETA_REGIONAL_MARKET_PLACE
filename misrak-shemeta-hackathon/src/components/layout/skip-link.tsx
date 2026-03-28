"use client";

import { useLocale } from "@/components/providers/locale-provider";

export function SkipToMain() {
  const { t } = useLocale();
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-xl focus:bg-white focus:px-4 focus:py-3 focus:font-semibold focus:text-brand-900 focus:shadow-lg focus:ring-2 focus:ring-brand-500"
    >
      {t("common.skipToContent")}
    </a>
  );
}
