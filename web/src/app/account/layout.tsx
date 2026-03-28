import { RoleDashboardLayout } from "@/components/dashboard/role-dashboard-layout";
import { getCurrentUser } from "@/lib/auth/server";

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    return children;
  }

  if (user.role === "buyer") {
    return children;
  }

  return <RoleDashboardLayout role={user.role}>{children}</RoleDashboardLayout>;
}
