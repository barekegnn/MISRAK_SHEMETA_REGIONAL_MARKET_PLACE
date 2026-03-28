import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import type { User, UserRole } from "@/types";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getDashboardRoute, mapSupabaseUser } from "@/lib/auth/shared";

export const getCurrentUser = cache(async (): Promise<User | null> => {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user ? mapSupabaseUser(user) : null;
});

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth");
  return user;
}

export async function requireRole(roles: UserRole[]) {
  const user = await requireUser();
  if (!roles.includes(user.role)) {
    redirect(getDashboardRoute(user.role));
  }
  return user;
}
