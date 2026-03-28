"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { LayoutGrid, Package, Shield, Store, Truck } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { useLocale } from "@/components/providers/locale-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import type { UserRole } from "@/types";

const ROLE_HREFS: Record<UserRole, { href: string; labelKey: string }> = {
  buyer: { href: "/", labelKey: "dashboards.shopHome" },
  seller: { href: "/merchant", labelKey: "dashboards.merchant" },
  runner: { href: "/runner", labelKey: "dashboards.runner" },
  admin: { href: "/admin", labelKey: "dashboards.admin" },
};

export function DashboardsClient() {
  const { t } = useLocale();
  const { user, profile, loading } = useAuth();
  const sp = useSearchParams();

  useEffect(() => {
    if (sp.get("forbidden") === "1") {
      toast.error(t("dashboards.forbiddenToast"));
    }
  }, [sp, t]);

  if (loading) {
    return <p className="text-center text-brand-600">{t("common.loading")}</p>;
  }

  if (!user) {
    return (
      <Card className="mx-auto max-w-md p-8 text-center space-y-4">
        <LayoutGrid className="mx-auto h-12 w-12 text-brand-500" />
        <p className="text-brand-800">{t("dashboards.signInPrompt")}</p>
        <Button asChild className="rounded-xl">
          <Link href="/auth?next=/dashboards">{t("auth.signIn")}</Link>
        </Button>
      </Card>
    );
  }

  const role = profile?.role as UserRole | undefined;

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold text-brand-950">
          {t("dashboards.title")}
        </h1>
        <p className="mt-1 text-brand-700">{t("dashboards.subtitle")}</p>
        <p className="mt-2 text-sm text-brand-600">
          {t("dashboards.signedInAs")}: <span className="font-medium">{profile?.email ?? user.email}</span>{" "}
          · {t("dashboards.roleLabel")}: <span className="font-medium">{role ?? "—"}</span>
        </p>
      </div>

      <ul className="grid gap-4 sm:grid-cols-2">
        <DashboardTile
          href={ROLE_HREFS.buyer.href}
          title={t("dashboards.shopHome")}
          desc={t("dashboards.shopHomeDesc")}
          icon={<Package className="h-8 w-8 text-brand-600" />}
        />
        {role === "seller" && (
          <DashboardTile
            href={ROLE_HREFS.seller.href}
            title={t("dashboards.merchant")}
            desc={t("dashboards.merchantDesc")}
            icon={<Store className="h-8 w-8 text-accent-600" />}
          />
        )}
        {role === "runner" && (
          <DashboardTile
            href={ROLE_HREFS.runner.href}
            title={t("dashboards.runner")}
            desc={t("dashboards.runnerDesc")}
            icon={<Truck className="h-8 w-8 text-emerald-600" />}
          />
        )}
        {role === "admin" && (
          <DashboardTile
            href={ROLE_HREFS.admin.href}
            title={t("dashboards.admin")}
            desc={t("dashboards.adminDesc")}
            icon={<Shield className="h-8 w-8 text-violet-600" />}
          />
        )}
      </ul>

      {role === "buyer" && (
        <p className="text-center text-sm text-brand-600">{t("dashboards.buyerOnlyHint")}</p>
      )}

      <div className="flex justify-center">
        <Button variant="outline" asChild className="rounded-xl">
          <Link href="/profile">{t("nav.profile")}</Link>
        </Button>
      </div>
    </div>
  );
}

function DashboardTile({
  href,
  title,
  desc,
  icon,
}: {
  href: string;
  title: string;
  desc: string;
  icon: ReactNode;
}) {
  return (
    <li>
      <Link href={href} className="block h-full">
        <Card className="flex h-full flex-col gap-3 p-5 transition-shadow hover:shadow-md">
          {icon}
          <div>
            <h2 className="font-semibold text-brand-950">{title}</h2>
            <p className="mt-1 text-sm text-brand-600">{desc}</p>
          </div>
        </Card>
      </Link>
    </li>
  );
}
