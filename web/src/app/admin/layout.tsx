import { requireRole } from "@/lib/auth/server";
import { RoleDashboardLayout } from "@/components/dashboard/role-dashboard-layout";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole(["admin"]);
  return <RoleDashboardLayout role="admin">{children}</RoleDashboardLayout>;
}
