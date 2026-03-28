"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  DEFAULT_DELIVERY_ZONE,
  DEFAULT_LANGUAGE,
  getDashboardRoute,
} from "@/lib/auth/shared";
import { DELIVERY_ZONES } from "@/lib/constants";
import type { DeliveryZone, Language, UserRole } from "@/types";
import { cn } from "@/lib/utils";

const LANGUAGES: { value: Language; label: string }[] = [
  { value: "en", label: "English" },
  { value: "am", label: "አማርኛ" },
  { value: "om", label: "Afaan Oromoo" },
];

const ACCOUNT_ROLES: { value: Exclude<UserRole, "admin">; label: string }[] = [
  { value: "buyer", label: "Buyer — shop on the marketplace" },
  { value: "seller", label: "Seller — manage a shop" },
  { value: "runner", label: "Runner — handle deliveries" },
];

const selectClassName = cn(
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
  "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
);

export default function AuthPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [deliveryZone, setDeliveryZone] =
    useState<DeliveryZone>(DEFAULT_DELIVERY_ZONE);
  const [language, setLanguage] = useState<Language>(DEFAULT_LANGUAGE);
  const [accountRole, setAccountRole] =
    useState<Exclude<UserRole, "admin">>("buyer");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const client = createClient();
    if (!client) {
      toast.error("Configure Supabase (NEXT_PUBLIC_SUPABASE_URL) to enable auth.");
      return;
    }

    if (mode === "signup") {
      if (password.length < 6) {
        toast.error("Password must be at least 6 characters.");
        return;
      }
      if (password !== confirmPassword) {
        toast.error("Passwords do not match.");
        return;
      }
      if (!fullName.trim()) {
        toast.error("Enter your full name.");
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === "signin") {
        const { data, error } = await client.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        toast.success("Signed in");
        const role =
          (data.user?.user_metadata?.role as UserRole | undefined) ?? "buyer";
        router.push(getDashboardRoute(role));
        router.refresh();
      } else {
        const { data, error } = await client.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: origin ? `${origin}/auth/callback` : undefined,
            data: {
              full_name: fullName.trim(),
              phone: phone.trim() || null,
              role: accountRole,
              delivery_zone: deliveryZone,
              language,
            },
          },
        });
        if (error) throw error;

        if (data.session?.user) {
          toast.success("Account created. You are signed in.");
          router.push(
            getDashboardRoute(
              (data.session.user.user_metadata?.role as UserRole) ?? "buyer",
            ),
          );
          router.refresh();
        } else {
          toast.success(
            "Check your email to confirm your account, then sign in.",
          );
          setMode("signin");
          setPassword("");
          setConfirmPassword("");
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Auth failed";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  async function google() {
    const client = createClient();
    if (!client) {
      toast.error("Supabase not configured.");
      return;
    }
    await client.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: origin ? `${origin}/auth/callback` : undefined,
        queryParams: { access_type: "offline", prompt: "consent" },
      },
    });
  }

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
      <div className="mb-6 text-center">
        <Link href="/" className="text-2xl font-bold text-[#1E1B4B]">
          Misrak Shemeta
        </Link>
        <p className="mt-2 text-sm text-neutral-600">
          Sign in or create an account. Your profile is stored in Supabase Auth.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {mode === "signin" ? "Sign in" : "Create your account"}
          </CardTitle>
          <CardDescription>
            {mode === "signin"
              ? "Use the email and password for your marketplace account."
              : "We save your name, role, zone, and language on your Supabase user profile."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={loading}
              onClick={() => void google()}
            >
              Continue with Google
            </Button>
            <p className="text-center text-xs text-neutral-500">
              Configure the Google provider in Supabase Authentication settings
              if this button errors.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs text-neutral-500">
            <Separator className="flex-1" />
            or email
            <Separator className="flex-1" />
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            {mode === "signup" ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full name</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    autoComplete="name"
                    required
                    placeholder="Your name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">How will you use Misrak?</Label>
                  <select
                    id="role"
                    className={selectClassName}
                    value={accountRole}
                    onChange={(e) =>
                      setAccountRole(
                        e.target.value as Exclude<UserRole, "admin">,
                      )
                    }
                  >
                    {ACCOUNT_ROLES.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-neutral-500">
                    Admin accounts are created by platform staff, not here.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone (optional)</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    autoComplete="tel"
                    placeholder="+2519…"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="zone">Delivery zone</Label>
                    <select
                      id="zone"
                      className={selectClassName}
                      value={deliveryZone}
                      onChange={(e) =>
                        setDeliveryZone(e.target.value as DeliveryZone)
                      }
                    >
                      {DELIVERY_ZONES.map((z) => (
                        <option key={z.value} value={z.value}>
                          {z.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="language">Language</Label>
                    <select
                      id="language"
                      className={selectClassName}
                      value={language}
                      onChange={(e) =>
                        setLanguage(e.target.value as Language)
                      }
                    >
                      {LANGUAGES.map((l) => (
                        <option key={l.value} value={l.value}>
                          {l.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete={
                  mode === "signin" ? "current-password" : "new-password"
                }
                minLength={6}
              />
              {mode === "signup" ? (
                <p className="text-xs text-neutral-500">At least 6 characters.</p>
              ) : null}
            </div>
            {mode === "signup" ? (
              <div className="space-y-2">
                <Label htmlFor="confirm">Confirm password</Label>
                <Input
                  id="confirm"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  minLength={6}
                />
              </div>
            ) : null}

            <Button
              type="submit"
              className="w-full bg-[#4F46E5] hover:bg-[#4338CA]"
              disabled={loading}
            >
              {loading
                ? "Please wait…"
                : mode === "signin"
                  ? "Sign in"
                  : "Create account"}
            </Button>
          </form>

          <button
            type="button"
            className="w-full text-center text-sm text-[#4F46E5] hover:underline"
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setPassword("");
              setConfirmPassword("");
            }}
          >
            {mode === "signin"
              ? "Need an account? Sign up"
              : "Already have an account? Sign in"}
          </button>
          <LinkButton href="/" variant="link" className="w-full">
            Back to shop
          </LinkButton>
        </CardContent>
      </Card>
    </main>
  );
}
