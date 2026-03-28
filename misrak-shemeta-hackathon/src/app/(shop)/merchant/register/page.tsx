"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { registerShop } from "@/app/actions/shops";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useLocale } from "@/components/providers/locale-provider";

export default function RegisterShopPage() {
  const { t } = useLocale();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setLoading(true);
    try {
      await registerShop({
        name: String(fd.get("name") || ""),
        city: fd.get("city") === "Dire_Dawa" ? "Dire_Dawa" : "Harar",
        phone: String(fd.get("phone") || ""),
        description: String(fd.get("desc") || "") || undefined,
      });
      router.push("/merchant");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="mx-auto max-w-lg space-y-4 p-6">
      <h1 className="font-display text-2xl font-bold">{t("merchant.register")}</h1>
      <form className="space-y-4" onSubmit={(e) => void onSubmit(e)}>
        <div>
          <Label htmlFor="name">Shop name</Label>
          <Input id="name" name="name" required className="mt-1 rounded-xl" />
        </div>
        <div>
          <Label htmlFor="city">City</Label>
          <select
            id="city"
            name="city"
            className="mt-1 w-full rounded-xl border border-brand-200 p-2"
          >
            <option value="Harar">Harar</option>
            <option value="Dire_Dawa">Dire Dawa</option>
          </select>
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" name="phone" required className="mt-1 rounded-xl" />
        </div>
        <div>
          <Label htmlFor="desc">Description</Label>
          <Textarea id="desc" name="desc" className="mt-1 rounded-xl" rows={4} />
        </div>
        <Button type="submit" className="rounded-2xl" disabled={loading}>
          {loading ? "…" : t("onboarding.save")}
        </Button>
      </form>
    </Card>
  );
}
