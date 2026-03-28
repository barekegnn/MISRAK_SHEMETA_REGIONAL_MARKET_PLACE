"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getAdminDashboard,
  listAdminOrders,
  listAdminShops,
  listAdminUsers,
  listPaymentLogs,
  resetDemoEnvironment,
} from "@/app/actions/admin";
import { adminUpdateOrderStatus } from "@/app/actions/orders";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatEtb } from "@/lib/utils";
import { useLocale } from "@/components/providers/locale-provider";
import { toast } from "sonner";
import { useState } from "react";

export default function AdminPage() {
  const { t } = useLocale();
  const qc = useQueryClient();
  const [resetting, setResetting] = useState(false);

  const { data: dash } = useQuery({
    queryKey: ["admin-dash"],
    queryFn: () => getAdminDashboard(),
    refetchInterval: 15_000,
  });

  const { data: users = [] } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => listAdminUsers(),
  });

  const { data: shops = [] } = useQuery({
    queryKey: ["admin-shops"],
    queryFn: () => listAdminShops(),
  });

  const { data: orders = [] } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: () => listAdminOrders(),
  });

  const { data: pays = [] } = useQuery({
    queryKey: ["admin-pays"],
    queryFn: () => listPaymentLogs(),
  });

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-bold">{t("admin.title")}</h1>
        <Button
          variant="destructive"
          className="rounded-xl"
          disabled={resetting}
          onClick={async () => {
            setResetting(true);
            try {
              await resetDemoEnvironment();
              await qc.invalidateQueries();
              toast.success("Demo reset");
            } catch (e) {
              toast.error(e instanceof Error ? e.message : "Failed");
            } finally {
              setResetting(false);
            }
          }}
        >
          {t("admin.resetDemo")}
        </Button>
      </div>

      {dash && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Buyers" value={dash.buyers} />
            <Stat label="Sellers" value={dash.sellers} />
            <Stat label="Runners" value={dash.runners} />
            <Stat label="Products" value={dash.products} />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <Card className="p-5">
              <p className="text-sm text-brand-600">Revenue (completed)</p>
              <p className="text-2xl font-bold">{formatEtb(dash.revenueCompleted)}</p>
            </Card>
            <Card className="p-5">
              <p className="text-sm text-brand-600">Escrow held</p>
              <p className="text-2xl font-bold">{formatEtb(dash.escrowHeld)}</p>
            </Card>
          </div>
          <Card className="p-5">
            <h2 className="mb-2 font-semibold">Orders by status</h2>
            <div className="flex flex-wrap gap-2">
              {Object.entries(dash.ordersByStatus).map(([k, v]) => (
                <Badge key={k} variant="secondary">
                  {k}: {v}
                </Badge>
              ))}
            </div>
          </Card>
          <Card className="p-5">
            <h2 className="mb-2 font-semibold">Activity</h2>
            <ul className="space-y-1 text-sm">
              {dash.activity.map((a) => (
                <li key={a.id + a.at} className="text-brand-700">
                  {a.label}{" "}
                  <span className="text-xs text-brand-400">
                    {new Date(a.at).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </>
      )}

      <section>
        <h2 className="mb-3 font-display text-xl font-bold">{t("admin.users")}</h2>
        <div className="overflow-x-auto rounded-xl border border-brand-100">
          <table className="w-full text-left text-sm">
            <thead className="bg-brand-50">
              <tr>
                <th className="p-2">Email</th>
                <th className="p-2">Role</th>
                <th className="p-2">Zone</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id as string} className="border-t border-brand-100">
                  <td className="p-2">{u.email}</td>
                  <td className="p-2">{u.role as string}</td>
                  <td className="p-2">{u.delivery_zone as string}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-display text-xl font-bold">{t("admin.shops")}</h2>
        <div className="overflow-x-auto rounded-xl border border-brand-100">
          <table className="w-full text-left text-sm">
            <thead className="bg-brand-50">
              <tr>
                <th className="p-2">Name</th>
                <th className="p-2">Balance</th>
                <th className="p-2">Active</th>
              </tr>
            </thead>
            <tbody>
              {shops.map((s) => (
                <tr key={s.id as string} className="border-t border-brand-100">
                  <td className="p-2">{s.name as string}</td>
                  <td className="p-2">{formatEtb(Number(s.balance))}</td>
                  <td className="p-2">{String(s.is_active)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-display text-xl font-bold">{t("admin.orders")}</h2>
        <div className="overflow-x-auto rounded-xl border border-brand-100">
          <table className="w-full text-left text-sm">
            <thead className="bg-brand-50">
              <tr>
                <th className="p-2">ID</th>
                <th className="p-2">Status</th>
                <th className="p-2">Total</th>
                <th className="p-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id as string} className="border-t border-brand-100">
                  <td className="p-2 font-mono text-xs">{(o.id as string).slice(0, 8)}</td>
                  <td className="p-2">{o.status as string}</td>
                  <td className="p-2">{formatEtb(Number(o.total))}</td>
                  <td className="p-2">
                    <select
                      className="rounded border border-brand-200 p-1 text-xs"
                      defaultValue={o.status as string}
                      onChange={async (e) => {
                        try {
                          await adminUpdateOrderStatus(
                            o.id as string,
                            e.target.value,
                            "Admin manual"
                          );
                          await qc.invalidateQueries();
                        } catch (err) {
                          toast.error(err instanceof Error ? err.message : "Err");
                        }
                      }}
                    >
                      {["PENDING", "PAID_ESCROW", "DISPATCHED", "COMPLETED", "FAILED", "LOCKED"].map(
                        (s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        )
                      )}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-display text-xl font-bold">{t("admin.payments")}</h2>
        <div className="overflow-x-auto rounded-xl border border-brand-100">
          <table className="w-full text-left text-sm">
            <thead className="bg-brand-50">
              <tr>
                <th className="p-2">When</th>
                <th className="p-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {pays.map((p) => (
                <tr key={p.id as string} className="border-t border-brand-100">
                  <td className="p-2 text-xs">
                    {new Date(p.created_at as string).toLocaleString()}
                  </td>
                  <td className="p-2">{String(p.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card className="p-4">
      <p className="text-xs text-brand-600">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </Card>
  );
}
