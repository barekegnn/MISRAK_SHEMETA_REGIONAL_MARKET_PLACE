"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLocale } from "@/components/providers/locale-provider";
import { Shield, Store, Bike, ShoppingBag } from "lucide-react";
import Link from "next/link";

const ROLES = [
  {
    key: "admin" as const,
    email: "admin@misrak.demo",
    href: "/admin",
    icon: Shield,
  },
  {
    key: "seller" as const,
    email: "seller@misrak.demo",
    href: "/seller",
    icon: Store,
  },
  {
    key: "runner" as const,
    email: "runner@misrak.demo",
    href: "/runner",
    icon: Bike,
  },
  {
    key: "buyer" as const,
    email: "buyer@misrak.demo",
    href: "/",
    icon: ShoppingBag,
    query: "?openAssistant=1&preset=am",
  },
];

export default function DemoPage() {
  const { t } = useLocale();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [busy, setBusy] = useState<string | null>(null);

  async function go(role: (typeof ROLES)[number]) {
    setBusy(role.key);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: role.email,
        password: "demo1234",
      });
      if (error) throw error;
      const q = "query" in role ? role.query : "";
      router.push(`${role.href}${q}`);
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Demo sign-in failed — run seed script.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-10 py-4">
      <div className="text-center">
        <h1 className="font-display text-3xl font-bold text-brand-950 md:text-4xl">
          {t("demo.title")}
        </h1>
        <p className="mt-2 text-brand-700">{t("demo.subtitle")}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {ROLES.map((r) => {
          const Icon = r.icon;
          return (
            <Button
              key={r.key}
              variant="secondary"
              className="h-auto min-h-[120px] flex-col gap-3 rounded-3xl border-2 border-brand-100 py-6 shadow-md"
              disabled={busy !== null}
              onClick={() => void go(r)}
            >
              <Icon className="h-10 w-10 text-brand-600" />
              <span className="text-lg font-bold">{t(`demo.${r.key}`)}</span>
              {busy === r.key && <span className="text-xs">Signing in…</span>}
            </Button>
          );
        })}
      </div>

      <Card className="border-dashed border-brand-200 bg-brand-50/50 p-6 text-center text-sm text-brand-800">
        <p className="font-medium">{t("demo.diagramCaption")}</p>
        <div className="mt-4 flex justify-center gap-2 text-2xl" aria-hidden>
          🛡️ → 🏪 → 🛍️ → 🚴 → 💰
        </div>
      </Card>

      <div className="text-center">
        <Button asChild variant="outline" className="rounded-2xl">
          <Link href="/demo/flow">{t("demo.flowCta")}</Link>
        </Button>
      </div>
    </div>
  );
}
