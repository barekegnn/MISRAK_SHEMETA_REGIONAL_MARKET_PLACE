"use client";

import { useI18n } from "@/lib/i18n/context";

export function StatsBanner({
  stats,
}: {
  stats: { products: number; shops: number; buyers: number };
}) {
  const { t } = useI18n();

  return (
    <div className="border-y border-indigo-100 bg-indigo-50/80">
      <div className="mx-auto flex max-w-[1440px] flex-wrap justify-center gap-6 px-4 py-3 text-sm md:justify-between md:px-6">
        <div className="text-center md:text-left">
          <span className="font-semibold text-[#4F46E5]">{stats.products}</span>{" "}
          <span className="text-neutral-600">{t("statsProducts")}</span>
        </div>
        <div className="text-center md:text-left">
          <span className="font-semibold text-[#4F46E5]">{stats.shops}</span>{" "}
          <span className="text-neutral-600">{t("statsShops")}</span>
        </div>
        <div className="text-center md:text-left">
          <span className="font-semibold text-[#4F46E5]">{stats.buyers}</span>{" "}
          <span className="text-neutral-600">{t("statsBuyers")}</span>
        </div>
      </div>
    </div>
  );
}
