import { requireRole } from "@/lib/auth/server";
import { RoleDashboardLayout } from "@/components/dashboard/role-dashboard-layout";

export default async function RunnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole(["runner"]);
  return <RoleDashboardLayout role="runner">{children}</RoleDashboardLayout>;
}
