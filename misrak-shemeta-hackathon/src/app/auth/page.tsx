"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useLocale } from "@/components/providers/locale-provider";
import { useRouter, useSearchParams } from "next/navigation";

export default function AuthPage() {
  const { t } = useLocale();
  const router = useRouter();
  const sp = useSearchParams();
  const supabase = useMemo(() => createClient(), []);
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    try {
      if (mode === "in") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } },
        });
        if (error) throw error;
      }
      const next = sp.get("next") || "/";
      router.push(next);
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Auth error");
    } finally {
      setLoading(false);
    }
  }

  async function google() {
    const origin = window.location.origin;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${origin}/auth/callback?next=/` },
    });
  }

  return (
    <Card className="w-full max-w-md space-y-6 border-brand-100 p-8 shadow-xl">
      <div className="text-center">
        <div className="text-4xl" aria-hidden>
          🌅
        </div>
        <h1 className="mt-2 font-display text-2xl font-bold text-brand-950">
          {t("auth.title")}
        </h1>
        <p className="mt-1 text-sm text-brand-700">{t("auth.subtitle")}</p>
      </div>

      {mode === "up" && (
        <div>
          <Label htmlFor="fn">{t("auth.fullName")}</Label>
          <Input
            id="fn"
            className="mt-1 rounded-xl"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>
      )}
      <div>
        <Label htmlFor="em">{t("auth.email")}</Label>
        <Input
          id="em"
          type="email"
          className="mt-1 rounded-xl"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="pw">{t("auth.password")}</Label>
        <Input
          id="pw"
          type="password"
          className="mt-1 rounded-xl"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <Button
        className="w-full rounded-2xl"
        size="lg"
        disabled={loading}
        onClick={() => void submit()}
      >
        {mode === "in" ? t("auth.signIn") : t("auth.signUp")}
      </Button>

      <Button
        type="button"
        variant="secondary"
        className="w-full rounded-2xl"
        onClick={() => void google()}
      >
        {t("auth.google")}
      </Button>

      <p className="text-center text-sm text-brand-700">
        {mode === "in" ? (
          <button
            type="button"
            className="font-semibold text-brand-600 underline"
            onClick={() => setMode("up")}
          >
            {t("auth.toggleSignUp")}
          </button>
        ) : (
          <button
            type="button"
            className="font-semibold text-brand-600 underline"
            onClick={() => setMode("in")}
          >
            {t("auth.toggleSignIn")}
          </button>
        )}
      </p>

      <Link href="/" className="block text-center text-sm text-brand-600">
        ← Home
      </Link>
    </Card>
  );
}
