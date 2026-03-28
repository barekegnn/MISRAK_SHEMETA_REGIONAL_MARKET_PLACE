import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getDashboardRoute, mapSupabaseUser } from "@/lib/auth/shared";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next");
  const nextTarget =
    next && next.startsWith("/") && !next.startsWith("/auth") ? next : null;

  const supabase = await createServerSupabaseClient();
  if (!supabase || !code) {
    return NextResponse.redirect(new URL("/auth", url.origin));
  }

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(new URL("/auth", url.origin));
  }

  const role = data.user ? mapSupabaseUser(data.user).role : "buyer";
  return NextResponse.redirect(
    new URL(nextTarget ?? getDashboardRoute(role), url.origin),
  );
}
