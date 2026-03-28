"use client";

import { createClient } from "@/lib/supabase/client";
import type { UserRow } from "@/types";
import type { User } from "@supabase/supabase-js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type AuthCtx = {
  user: User | null;
  profile: UserRow | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => createClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserRow | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(
    async (uid: string) => {
      const { data } = await supabase
        .from("users")
        .select("*")
        .eq("id", uid)
        .single();
      setProfile(data as UserRow | null);
    },
    [supabase]
  );

  const refreshProfile = useCallback(async () => {
    if (!user?.id) {
      setProfile(null);
      return;
    }
    await loadProfile(user.id);
  }, [user?.id, loadProfile]);

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      const { data } = await supabase.auth.getUser();
      if (cancelled) return;
      const u = data.user;
      setUser(u ?? null);
      if (u?.id) await loadProfile(u.id);
      setLoading(false);
    };
    void init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_evt, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u?.id) await loadProfile(u.id);
      else setProfile(null);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [supabase, loadProfile]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }, [supabase]);

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      refreshProfile,
      signOut,
    }),
    [user, profile, loading, refreshProfile, signOut]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
