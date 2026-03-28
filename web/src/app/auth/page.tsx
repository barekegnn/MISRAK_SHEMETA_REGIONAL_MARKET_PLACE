"use client";

import { useEffect, useState } from "react";
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
import { useI18n } from "@/lib/i18n/context";
import { translateDeliveryZone } from "@/lib/i18n/labels";
import type en from "@/locales/en.json";

function formatAuthError(
  err: unknown,
  siteOrigin: string,
  t: (
    key: keyof typeof en,
    vars?: Record<string, string | number>,
  ) => string,
): string {
  if (err && typeof err === "object" && "message" in err) {
    const message = String((err as { message: unknown }).message);
    if (/redirect|redirect_uri|redirect url/i.test(message)) {
      return t("auth_redirectHint", {
        message,
        origin: siteOrigin || "(your site)",
      });
    }
    return message;
  }
  return t("auth_toast_authFailed");
}

const selectClassName = cn(
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
  "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
);

export default function AuthPage() {
  const router = useRouter();
  const { t, lang, setLang } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [deliveryZone, setDeliveryZone] =
    useState<DeliveryZone>(DEFAULT_DELIVERY_ZONE);
  const [language, setLanguage] = useState<Language>(lang);
  const [accountRole, setAccountRole] =
    useState<Exclude<UserRole, "admin">>("buyer");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLanguage(lang);
  }, [lang]);

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const client = createClient();
    if (!client) {
      toast.error(t("auth_toast_supabase"));
      return;
    }

    if (mode === "signup") {
      if (password.length < 6) {
        toast.error(t("auth_toast_passwordShort"));
        return;
      }
      if (password !== confirmPassword) {
        toast.error(t("auth_toast_passwordMismatch"));
        return;
      }
      if (!fullName.trim()) {
        toast.error(t("auth_toast_fullName"));
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
        toast.success(t("auth_toast_signedIn"));
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
              ...(phone.trim() ? { phone: phone.trim() } : {}),
              role: accountRole,
              delivery_zone: deliveryZone,
              language,
            },
          },
        });
        if (error) throw error;

        if (data.session?.user) {
          toast.success(t("auth_toast_created"));
          setLang(language);
          router.push(
            getDashboardRoute(
              (data.session.user.user_metadata?.role as UserRole) ?? "buyer",
            ),
          );
          router.refresh();
        } else {
          toast.success(t("auth_toast_confirmEmail"));
          setMode("signin");
          setPassword("");
          setConfirmPassword("");
        }
      }
    } catch (err: unknown) {
      toast.error(formatAuthError(err, origin, t));
    } finally {
      setLoading(false);
    }
  }

  async function google() {
    const client = createClient();
    if (!client) {
      toast.error(t("auth_toast_supabaseShort"));
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
          {t("brand")}
        </Link>
        <p className="mt-2 text-sm text-neutral-600">{t("auth_tagline")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {mode === "signin" ? t("auth_signInTitle") : t("auth_createAccount")}
          </CardTitle>
          <CardDescription>
            {mode === "signin"
              ? t("auth_desc_signin")
              : t("auth_desc_signup")}
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
              {t("auth_google")}
            </Button>
            <p className="text-center text-xs text-neutral-500">
              {t("auth_google_hint")}
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs text-neutral-500">
            <Separator className="flex-1" />
            {t("auth_orEmail")}
            <Separator className="flex-1" />
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            {mode === "signup" ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="fullName">{t("auth_fullName")}</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    autoComplete="name"
                    required
                    placeholder={t("auth_fullName")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">{t("auth_howUse")}</Label>
                  <select
                    id="role"
                    className={selectClassName}
                    value={accountRole}
                    onChange={(e) =>
                      setAccountRole(e.target.value as Exclude<UserRole, "admin">)
                    }
                  >
                    <option value="buyer">{t("auth_role_buyer")}</option>
                    <option value="seller">{t("auth_role_seller")}</option>
                    <option value="runner">{t("auth_role_runner")}</option>
                  </select>
                  <p className="text-xs text-neutral-500">{t("auth_admin_note")}</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">{t("auth_phoneOptional")}</Label>
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
                    <Label htmlFor="zone">{t("auth_deliveryZone")}</Label>
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
                          {translateDeliveryZone(z.value, t)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="language">{t("auth_language")}</Label>
                    <select
                      id="language"
                      className={selectClassName}
                      value={language}
                      onChange={(e) => {
                        const next = e.target.value as Language;
                        setLanguage(next);
                        setLang(next);
                      }}
                    >
                      <option value="en">{t("auth_lang_en")}</option>
                      <option value="am">{t("auth_lang_am")}</option>
                      <option value="om">{t("auth_lang_om")}</option>
                    </select>
                  </div>
                </div>
              </>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="email">{t("auth_email")}</Label>
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
              <Label htmlFor="password">{t("auth_password")}</Label>
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
                <p className="text-xs text-neutral-500">{t("auth_passwordHint")}</p>
              ) : null}
            </div>
            {mode === "signup" ? (
              <div className="space-y-2">
                <Label htmlFor="confirm">{t("auth_confirmPassword")}</Label>
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
                ? t("auth_submitWait")
                : mode === "signin"
                  ? t("auth_signInTitle")
                  : t("auth_createAccountBtn")}
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
            {mode === "signin" ? t("auth_toggle_signup") : t("auth_toggle_signin")}
          </button>
          <LinkButton href="/" variant="link" className="w-full">
            {t("auth_backShop")}
          </LinkButton>
        </CardContent>
      </Card>
    </main>
  );
}
