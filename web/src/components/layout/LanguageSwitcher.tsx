"use client";

import { useI18n } from "@/lib/i18n/context";
import type { Language } from "@/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const FLAGS: Record<Language, string> = {
  en: "🇬🇧 EN",
  am: "አማ",
  om: "OM",
};

type Props = { variant?: "onDark" | "onLight" };

export function LanguageSwitcher({ variant = "onLight" }: Props) {
  const { lang, setLang } = useI18n();
  const cycle: Language[] = ["en", "am", "om"];

  const isDark = variant === "onDark";

  return (
    <div
      className={cn(
        "flex items-center gap-0.5 rounded-md p-0.5",
        isDark
          ? "border border-white/20 bg-white/5"
          : "border border-neutral-200 bg-neutral-50",
      )}
    >
      {cycle.map((l) => (
        <Button
          key={l}
          type="button"
          variant="ghost"
          size="sm"
          className={cn(
            "h-8 min-w-[2.75rem] px-2 text-xs",
            lang === l
              ? isDark
                ? "bg-white text-neutral-900"
                : "bg-primary text-primary-foreground"
              : isDark
                ? "text-white hover:bg-white/10"
                : "text-neutral-700 hover:bg-neutral-200/80",
          )}
          onClick={() => setLang(l)}
        >
          {FLAGS[l]}
        </Button>
      ))}
    </div>
  );
}
