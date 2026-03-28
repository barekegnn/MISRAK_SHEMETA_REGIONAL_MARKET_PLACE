import { Suspense } from "react";
import { DashboardsClient } from "./dashboards-client";

export default function DashboardsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-brand-600">Loading…</div>}>
      <DashboardsClient />
    </Suspense>
  );
}
