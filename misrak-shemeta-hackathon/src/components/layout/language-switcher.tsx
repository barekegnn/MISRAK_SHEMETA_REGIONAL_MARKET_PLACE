"use client";

import { updateBuyerProfile } from "@/app/actions/profile";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/providers/auth-provider";
import { useLocale } from "@/components/providers/locale-provider";
import type { LanguageCode } from "@/types";
import { cn } from "@/lib/utils";

const opts: { code: LanguageCode; label: string }[] = [
  { code: "en", label: "🇬🇧 EN" },
  { code: "am", label: "አማ" },
  { code: "om", label: "OM" },
];

export function LanguageSwitcher({ className }: { className?: string }) {
  const { user } = useAuth();
  const { locale, setLocale } = useLocale();
  return (
    <div className={cn("inline-flex rounded-xl border border-brand-200 bg-white/90 p-1 shadow-sm", className)}>
      {opts.map((o) => (
        <Button
          key={o.code}
          type="button"
          variant={locale === o.code ? "default" : "ghost"}
          size="sm"
          className="h-8 rounded-lg px-2.5 text-xs"
          onClick={() => {
            setLocale(o.code);
            if (user) void updateBuyerProfile({ language: o.code });
          }}
        >
          {o.label}
        </Button>
      ))}
    </div>
  );
}
