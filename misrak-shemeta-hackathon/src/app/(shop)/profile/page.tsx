"use client";

import Link from "next/link";
import { useAuth } from "@/components/providers/auth-provider";
import { useLocale } from "@/components/providers/locale-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function ProfilePage() {
  const { user, profile, signOut, loading } = useAuth();
  const { t } = useLocale();

  if (loading) return <p className="text-brand-600">{t("common.loading")}</p>;

  if (!user) {
    return (
      <Card className="max-w-md p-8 text-center">
        <Button asChild className="rounded-xl">
          <Link href="/auth">{t("auth.signIn")}</Link>
        </Button>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-bold">{t("nav.profile")}</h1>
        <Button asChild variant="secondary" className="rounded-xl">
          <Link href="/dashboards">{t("nav.dashboards")}</Link>
        </Button>
      </div>
      <Card className="space-y-3 p-6">
        <p>
          <span className="text-sm text-brand-600">Email</span>
          <br />
          <span className="font-medium">{profile?.email ?? user.email}</span>
        </p>
        {profile?.full_name && (
          <p>
            <span className="text-sm text-brand-600">{t("auth.fullName")}</span>
            <br />
            {profile.full_name}
          </p>
        )}
        <p>
          <span className="text-sm text-brand-600">Role</span>
          <br />
          <span className="font-medium">{profile?.role}</span>
        </p>
        {profile?.delivery_zone && (
          <p>
            <span className="text-sm text-brand-600">Zone</span>
            <br />
            {profile.delivery_zone}
          </p>
        )}
      </Card>

      <div className="flex flex-wrap gap-2">
        {profile?.role === "seller" && (
          <Button asChild variant="secondary" className="rounded-xl">
            <Link href="/merchant">{t("merchant.title")}</Link>
          </Button>
        )}
        {profile?.role === "admin" && (
          <Button asChild variant="secondary" className="rounded-xl">
            <Link href="/admin">{t("admin.title")}</Link>
          </Button>
        )}
        {profile?.role === "runner" && (
          <Button asChild variant="secondary" className="rounded-xl">
            <Link href="/runner">{t("runner.title")}</Link>
          </Button>
        )}
      </div>

      <Button variant="outline" className="rounded-xl" onClick={() => signOut()}>
        {t("common.signOut")}
      </Button>
    </div>
  );
}
