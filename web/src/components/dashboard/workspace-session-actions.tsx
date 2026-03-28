"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";
import { useAuth } from "@/lib/auth/context";
import { useI18n } from "@/lib/i18n/context";

export function WorkspaceSessionActions() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { t } = useI18n();

  async function onSignOut() {
    await signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <LinkButton href="/account" size="sm" variant="outline">
        {t("nav_accountSettings")}
      </LinkButton>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="border-red-200 text-red-700 hover:bg-red-50"
        onClick={() => void onSignOut()}
      >
        {t("signOut")}
      </Button>
    </div>
  );
}
