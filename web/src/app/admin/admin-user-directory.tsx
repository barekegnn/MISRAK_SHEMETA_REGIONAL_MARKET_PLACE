"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DELIVERY_ZONES } from "@/lib/constants";
import { formatLabel } from "@/components/dashboard/dashboard-ui";
import type { DeliveryZone, User, UserRole } from "@/types";

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: "buyer", label: "Buyer" },
  { value: "seller", label: "Seller" },
  { value: "runner", label: "Runner" },
  { value: "admin", label: "Admin" },
];

type Props = {
  users: User[];
  currentAdminId: string;
};

export function AdminUserDirectory({ users, currentAdminId }: Props) {
  const router = useRouter();
  const sorted = useMemo(
    () =>
      [...users].sort((a, b) => {
        const byRole = ROLE_OPTIONS.findIndex((o) => o.value === a.role)
          - ROLE_OPTIONS.findIndex((o) => o.value === b.role);
        if (byRole !== 0) return byRole;
        return a.email.localeCompare(b.email);
      }),
    [users],
  );

  return (
    <div className="max-h-[32rem] space-y-3 overflow-y-auto pr-1">
      {sorted.map((user) => (
        <AdminUserRow
          key={user.id}
          user={user}
          currentAdminId={currentAdminId}
          onSaved={() => router.refresh()}
        />
      ))}
    </div>
  );
}

function AdminUserRow({
  user,
  currentAdminId,
  onSaved,
}: {
  user: User;
  currentAdminId: string;
  onSaved: () => void;
}) {
  const [role, setRole] = useState<UserRole>(user.role);
  const [zone, setZone] = useState<DeliveryZone | "">(user.delivery_zone ?? "");
  const [loading, setLoading] = useState(false);
  const isSelf = user.id === currentAdminId;

  useEffect(() => {
    setRole(user.role);
    setZone(user.delivery_zone ?? "");
  }, [user.id, user.role, user.delivery_zone]);

  async function handleSave() {
    setLoading(true);
    try {
      const patch: { role?: UserRole; delivery_zone?: DeliveryZone | null } = {};
      if (!isSelf && role !== user.role) {
        patch.role = role;
      }
      const zoneValue = zone === "" ? null : zone;
      if (zoneValue !== user.delivery_zone) {
        patch.delivery_zone = zoneValue;
      }

      if (!Object.keys(patch).length) {
        toast.message("No changes to save.");
        return;
      }

      if (role === "runner" && !zoneValue) {
        toast.error("Choose a delivery zone for runner accounts.");
        return;
      }

      const response = await fetch(`/api/dashboard/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const payload = (await response.json()) as { message?: string; error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to update this account.");
      }

      toast.success(payload.message ?? "Saved.");
      onSaved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-neutral-200 p-4 md:flex-row md:flex-wrap md:items-end md:justify-between">
      <div className="min-w-0 flex-1">
        <p className="font-medium text-[#1E1B4B]">{user.full_name ?? user.email}</p>
        <p className="mt-1 truncate text-sm text-neutral-600">{user.email}</p>
        {isSelf ? (
          <p className="mt-2 text-xs text-amber-800">
            Your own role cannot be changed here—use another admin account or the database if needed.
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <label className="flex flex-col gap-1 text-xs text-neutral-600">
          Role
          <select
            className="rounded-lg border border-neutral-200 bg-white px-2 py-1.5 text-sm text-neutral-900 disabled:opacity-60"
            value={role}
            disabled={isSelf}
            onChange={(e) => setRole(e.target.value as UserRole)}
          >
            {ROLE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs text-neutral-600">
          Delivery zone
          <select
            className="rounded-lg border border-neutral-200 bg-white px-2 py-1.5 text-sm text-neutral-900"
            value={zone}
            onChange={(e) => setZone((e.target.value || "") as DeliveryZone | "")}
          >
            <option value="">— None —</option>
            {DELIVERY_ZONES.map((z) => (
              <option key={z.value} value={z.value}>
                {z.label}
              </option>
            ))}
          </select>
        </label>

        <Button type="button" size="sm" onClick={() => void handleSave()} disabled={loading}>
          {loading ? "Saving…" : "Save"}
        </Button>
      </div>

      <p className="w-full text-xs text-neutral-500">
        Current: {user.role} · {formatLabel(user.delivery_zone, "No zone")}
      </p>
    </div>
  );
}
