"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { getPlatformStats } from "@/app/actions/stats";
import { useLocale } from "@/components/providers/locale-provider";

function useCountUp(target: number, duration = 1200) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / duration);
      setV(Math.floor(target * (0.5 - Math.cos(p * Math.PI) / 2)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return v;
}

export function StatsBanner({
  initial,
}: {
  initial: { products: number; shops: number; buyers: number };
}) {
  const { t } = useLocale();
  const [stats, setStats] = useState(initial);

  useEffect(() => {
    void getPlatformStats().then(setStats);
    const id = setInterval(() => {
      void getPlatformStats().then(setStats);
    }, 45000);
    return () => clearInterval(id);
  }, []);

  const p = useCountUp(stats.products);
  const s = useCountUp(stats.shops);
  const b = useCountUp(stats.buyers);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8 grid grid-cols-3 gap-3 rounded-2xl border border-brand-100 bg-white/80 p-4 shadow-sm backdrop-blur-sm md:gap-6 md:p-6"
    >
      <div className="text-center">
        <div className="font-display text-2xl font-bold text-gradient-brand md:text-3xl">
          {p}
        </div>
        <div className="text-xs font-medium text-brand-600 md:text-sm">
          {t("products.productsCount")}
        </div>
      </div>
      <div className="text-center border-x border-brand-100">
        <div className="font-display text-2xl font-bold text-gradient-brand md:text-3xl">
          {s}
        </div>
        <div className="text-xs font-medium text-brand-600 md:text-sm">
          {t("products.shopsCount")}
        </div>
      </div>
      <div className="text-center">
        <div className="font-display text-2xl font-bold text-gradient-brand md:text-3xl">
          {b}
        </div>
        <div className="text-xs font-medium text-brand-600 md:text-sm">
          {t("products.buyersCount")}
        </div>
      </div>
      <p className="col-span-3 text-center text-xs text-brand-500/90">
        {t("products.statsLive")}
      </p>
    </motion.div>
  );
}
