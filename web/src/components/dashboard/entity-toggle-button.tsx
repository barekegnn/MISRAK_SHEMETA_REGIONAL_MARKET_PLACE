"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type Props = {
  endpoint: string;
  isActive: boolean;
  activeLabel: string;
  inactiveLabel: string;
};

export function EntityToggleButton({
  endpoint,
  isActive,
  activeLabel,
  inactiveLabel,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    setLoading(true);
    try {
      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });
      const payload = (await response.json()) as { message?: string; error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to update the active state.");
      }

      toast.success(payload.message ?? "Changes saved.");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to update the active state.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={() => void handleToggle()} disabled={loading}>
      {loading ? "Saving..." : isActive ? activeLabel : inactiveLabel}
    </Button>
  );
}
