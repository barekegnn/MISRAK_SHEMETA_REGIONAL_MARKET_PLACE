import { requireRole } from "@/lib/auth/server";
import { RoleDashboardLayout } from "@/components/dashboard/role-dashboard-layout";

export default async function BuyerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole(["buyer"]);
  return <RoleDashboardLayout role="buyer">{children}</RoleDashboardLayout>;
}
