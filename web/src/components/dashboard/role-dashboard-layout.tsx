import type { UserRole } from "@/types";
import { WorkspaceNav } from "@/components/dashboard/workspace-nav";

export function RoleDashboardLayout({
  role,
  children,
}: {
  role: UserRole;
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="mx-auto max-w-6xl px-4 pt-6">
        <WorkspaceNav role={role} />
      </div>
      {children}
    </>
  );
}
