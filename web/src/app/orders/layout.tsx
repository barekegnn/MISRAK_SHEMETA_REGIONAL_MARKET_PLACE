import { RoleDashboardLayout } from "@/components/dashboard/role-dashboard-layout";
import { getCurrentUser } from "@/lib/auth/server";

export default async function OrdersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user || user.role !== "buyer") {
    return children;
  }

  return <RoleDashboardLayout role="buyer">{children}</RoleDashboardLayout>;
}
