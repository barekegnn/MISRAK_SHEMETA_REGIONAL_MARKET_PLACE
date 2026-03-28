import { requireRole } from "@/lib/auth/server";

export default async function BuyerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole(["buyer"]);
  return children;
}
