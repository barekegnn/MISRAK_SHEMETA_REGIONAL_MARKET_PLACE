import type { LanguageCode } from "@/types";

/** Requirement 6 / 7 — language from user message */
export function detectLanguageFromText(text: string): LanguageCode {
  if (/[\u1200-\u137F]/.test(text)) return "am";
  if (
    /\b(meeqa|barnoota|gabaa|bitaa|argadha|jira|danda|oomisha|maqaa)\b/i.test(
      text
    )
  )
    return "om";
  return "en";
}

export function languageLabel(code: LanguageCode): string {
  switch (code) {
    case "am":
      return "Amharic";
    case "om":
      return "Afaan Oromo";
    default:
      return "English";
  }
}
