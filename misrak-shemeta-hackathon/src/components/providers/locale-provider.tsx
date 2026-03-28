"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { LanguageCode } from "@/types";
import { getMessages, translate, type Messages } from "@/lib/i18n/messages";

type Ctx = {
  locale: LanguageCode;
  messages: Messages;
  setLocale: (l: LanguageCode) => void;
  t: (path: string) => string;
};

const C = createContext<Ctx | undefined>(undefined);

const STORAGE_KEY = "misrak-lang";

export function LocaleProvider({
  children,
  initialLocale,
}: {
  children: React.ReactNode;
  initialLocale?: LanguageCode;
}) {
  const [locale, setLocaleState] = useState<LanguageCode>(
    initialLocale ?? "en"
  );

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as LanguageCode | null;
    if (stored === "en" || stored === "am" || stored === "om")
      setLocaleState(stored);
  }, []);

  const setLocale = useCallback((l: LanguageCode) => {
    setLocaleState(l);
    localStorage.setItem(STORAGE_KEY, l);
    if (typeof document !== "undefined")
      document.documentElement.lang = l === "am" || l === "om" ? l : "en";
  }, []);

  const messages = useMemo(() => getMessages(locale), [locale]);

  const t = useCallback(
    (path: string) => translate(messages, path),
    [messages]
  );

  const value = useMemo(
    () => ({ locale, messages, setLocale, t }),
    [locale, messages, setLocale, t]
  );

  return <C.Provider value={value}>{children}</C.Provider>;
}

export function useLocale() {
  const ctx = useContext(C);
  if (!ctx) throw new Error("useLocale must be inside LocaleProvider");
  return ctx;
}

export { STORAGE_KEY as LOCALE_STORAGE_KEY };
