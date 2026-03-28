"use client";

import { useEffect } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import {
  LOCALE_STORAGE_KEY,
  useLocale,
} from "@/components/providers/locale-provider";

export function ProfileLocaleSync() {
  const { profile, loading } = useAuth();
  const { setLocale } = useLocale();

  useEffect(() => {
    if (loading || !profile?.language) return;
    try {
      const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
      if (!stored) setLocale(profile.language);
    } catch {
      /* ignore */
    }
  }, [loading, profile?.language, setLocale]);

  return null;
}
