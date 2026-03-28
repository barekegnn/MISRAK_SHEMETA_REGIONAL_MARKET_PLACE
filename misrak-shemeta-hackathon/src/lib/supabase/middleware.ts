import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import {
  isPublicPath,
  requiredRole,
  requiresAuth,
} from "@/lib/auth/route-guards";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.build-with-real-env-local",
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  const { pathname, search } = request.nextUrl;

  if (!isPublicPath(pathname)) {
    const roleNeeded = requiredRole(pathname);
    const needLogin = requiresAuth(pathname) || !!roleNeeded;

    if (needLogin && !user) {
      const next = encodeURIComponent(`${pathname}${search || ""}`);
      const url = request.nextUrl.clone();
      url.pathname = "/auth";
      url.search = `?next=${next}`;
      return NextResponse.redirect(url);
    }

    if (roleNeeded && user) {
      const { data: row } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      const myRole = row?.role as string | undefined;
      if (myRole !== roleNeeded) {
        const url = request.nextUrl.clone();
        url.pathname = "/dashboards";
        url.search = "?forbidden=1";
        return NextResponse.redirect(url);
      }
    }
  }

  return supabaseResponse;
}
