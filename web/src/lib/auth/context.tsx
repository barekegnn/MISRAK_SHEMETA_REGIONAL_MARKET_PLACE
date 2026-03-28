"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useEffect,
} from "react";
import type { DeliveryZone, Language, User } from "@/types";
import { createClient } from "@/lib/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import {
  DEFAULT_DELIVERY_ZONE,
  DEFAULT_LANGUAGE,
  mapSupabaseUser,
} from "@/lib/auth/shared";

type AuthState = {
  user: User | null;
  supabaseUser: SupabaseUser | null;
  deliveryZone: DeliveryZone;
  profileLanguage: Language;
  refresh: () => Promise<void>;
  setDeliveryZone: (z: DeliveryZone) => void;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [deliveryZone, setDeliveryZoneState] = useState<DeliveryZone>(() => {
    if (typeof window === "undefined") return DEFAULT_DELIVERY_ZONE;

    try {
      const stored = window.localStorage.getItem("misrak_delivery_zone") as
        | DeliveryZone
        | null;
      return stored ?? DEFAULT_DELIVERY_ZONE;
    } catch {
      return DEFAULT_DELIVERY_ZONE;
    }
  });
  const [profileLanguage, setProfileLanguage] =
    useState<Language>(DEFAULT_LANGUAGE);

  const applyUserMetadata = useCallback((user: SupabaseUser | null) => {
    if (user?.user_metadata?.delivery_zone) {
      const nextZone = user.user_metadata.delivery_zone as DeliveryZone;
      setDeliveryZoneState(nextZone);
      try {
        window.localStorage.setItem("misrak_delivery_zone", nextZone);
      } catch {
        /* ignore */
      }
    }

    if (user?.user_metadata?.language) {
      const nextLanguage = user.user_metadata.language as Language;
      setProfileLanguage(nextLanguage);
      try {
        window.localStorage.setItem("misrak_lang", nextLanguage);
        window.dispatchEvent(
          new CustomEvent("misrak:profile-language", { detail: nextLanguage }),
        );
      } catch {
        /* ignore */
      }
    }
  }, []);

  const refresh = useCallback(async () => {
    const client = createClient();
    if (!client) {
      setSupabaseUser(null);
      return;
    }
    const { data } = await client.auth.getUser();
    setSupabaseUser(data.user);
    applyUserMetadata(data.user);
  }, [applyUserMetadata]);

  useEffect(() => {
    const client = createClient();
    if (!client) return;
    let active = true;

    void client.auth.getUser().then(({ data }) => {
      if (!active) return;
      setSupabaseUser(data.user);
      applyUserMetadata(data.user);
    });

    const { data: sub } = client.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setSupabaseUser(session?.user ?? null);
      applyUserMetadata(session?.user ?? null);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [applyUserMetadata]);

  const setDeliveryZone = useCallback((z: DeliveryZone) => {
    setDeliveryZoneState(z);
    try {
      localStorage.setItem("misrak_delivery_zone", z);
    } catch {
      /* ignore */
    }
  }, []);

  const signOut = useCallback(async () => {
    const client = createClient();
    if (client) await client.auth.signOut();
    setSupabaseUser(null);
  }, []);

  const user = useMemo(
    () => (supabaseUser ? mapSupabaseUser(supabaseUser) : null),
    [supabaseUser],
  );

  const value = useMemo(
    () => ({
      user,
      supabaseUser,
      deliveryZone: user?.delivery_zone ?? deliveryZone,
      profileLanguage: user?.language ?? profileLanguage,
      refresh,
      setDeliveryZone,
      signOut,
    }),
    [
      user,
      supabaseUser,
      deliveryZone,
      profileLanguage,
      refresh,
      setDeliveryZone,
      signOut,
    ],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
