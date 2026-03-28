import { requireRole } from "@/lib/auth/server";
import { RoleDashboardLayout } from "@/components/dashboard/role-dashboard-layout";

export default async function MerchantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole(["seller"]);
  return <RoleDashboardLayout role="seller">{children}</RoleDashboardLayout>;
}
