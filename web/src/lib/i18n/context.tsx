"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useMemo,
} from "react";
import type { Language } from "@/types";
import en from "@/locales/en.json";
import am from "@/locales/am.json";
import om from "@/locales/om.json";
import { interpolate } from "@/lib/i18n/interpolate";

const DICTS: Record<Language, Record<string, string>> = { en, am, om };

type I18nContextValue = {
  lang: Language;
  setLang: (l: Language) => void;
  t: (
    key: keyof typeof en,
    vars?: Record<string, string | number>,
  ) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => {
    if (typeof window === "undefined") return "en";

    const stored = window.localStorage.getItem("misrak_lang") as Language | null;
    return stored && (stored === "en" || stored === "am" || stored === "om")
      ? stored
      : "en";
  });

  const setLang = useCallback((l: Language) => {
    setLangState(l);
    localStorage.setItem("misrak_lang", l);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    const handleProfileLanguage = (event: Event) => {
      const nextLanguage = (event as CustomEvent<Language>).detail;
      if (nextLanguage === "en" || nextLanguage === "am" || nextLanguage === "om") {
        setLangState(nextLanguage);
      }
    };

    window.addEventListener("misrak:profile-language", handleProfileLanguage);
    return () => window.removeEventListener("misrak:profile-language", handleProfileLanguage);
  }, []);

  const t = useCallback(
    (
      key: keyof typeof en,
      vars?: Record<string, string | number>,
    ): string => {
      const raw = DICTS[lang][key] ?? DICTS.en[key] ?? String(key);
      return interpolate(raw, vars);
    },
    [lang],
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return (
    <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
