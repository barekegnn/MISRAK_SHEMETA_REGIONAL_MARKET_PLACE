import type { LanguageCode } from "@/types";
import am from "@/locales/am.json";
import en from "@/locales/en.json";
import om from "@/locales/om.json";

export type Messages = typeof en;

const map: Record<LanguageCode, Messages> = {
  en: en as Messages,
  am: am as Messages,
  om: om as Messages,
};

export function getMessages(lang: LanguageCode): Messages {
  return map[lang] ?? map.en;
}

export function translate(messages: Messages, path: string): string {
  const parts = path.split(".");
  let cur: unknown = messages as unknown as Record<string, unknown>;
  for (const p of parts) {
    if (cur == null || typeof cur !== "object") return path;
    cur = (cur as Record<string, unknown>)[p];
  }
  return typeof cur === "string" ? cur : path;
}
