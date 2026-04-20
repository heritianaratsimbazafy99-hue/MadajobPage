import { DashboardShell } from "@/components/dashboard/shell";
import { AdminUsersBoard } from "@/components/admin/users-board";
import { requireRole } from "@/lib/auth";
import { getAdminOrganizations, getAdminUsers } from "@/lib/jobs";

export default async function AdminUsersPage() {
  const profile = await requireRole(["admin"]);
  const [users, organizations] = await Promise.all([
    getAdminUsers(),
    getAdminOrganizations()
  ]);

  return (
    <DashboardShell
      title="Utilisateurs & droits"
      description="Administrez les comptes candidats, recruteurs et admins depuis un module dedie."
      profile={profile}
      currentPath="/app/admin/utilisateurs"
    >
      <AdminUsersBoard users={users} organizations={organizations} />
    </DashboardShell>
  );
}
