import { DashboardShell } from "@/components/dashboard/shell";
import { InviteUserForm } from "@/components/admin/invite-user-form";
import { AdminUsersBoard } from "@/components/admin/users-board";
import { requireRole } from "@/lib/auth";
import { getAdminOrganizations, getAdminUsers } from "@/lib/jobs";

export default async function AdminUsersPage() {
  const profile = await requireRole(["admin"]);
  const [users, organizations] = await Promise.all([
    getAdminUsers(),
    getAdminOrganizations()
  ]);
  const activeCount = users.filter((user) => user.is_active).length;
  const internalCount = users.filter((user) => user.role !== "candidat").length;
  const priorityCount = users.filter(
    (user) =>
      !user.is_active ||
      (user.role === "recruteur" && !user.organization_id) ||
      (user.role === "candidat" && (user.candidate_profile_completion ?? 0) < 70)
  ).length;

  return (
    <DashboardShell
      title="Utilisateurs & droits"
      description="Administrez les comptes candidats, recruteurs et admins depuis un vrai cockpit de controle des acces."
      profile={profile}
      currentPath="/app/admin/utilisateurs"
    >
      <section className="dashboard-grid dashboard-grid--four">
        <article className="panel metric-panel">
          <span>Utilisateurs visibles</span>
          <strong>{users.length}</strong>
          <small>comptes pilotes dans l'espace admin</small>
        </article>
        <article className="panel metric-panel">
          <span>Actifs</span>
          <strong>{activeCount}</strong>
          <small>{users.length - activeCount} inactif(s)</small>
        </article>
        <article className="panel metric-panel">
          <span>Comptes internes</span>
          <strong>{internalCount}</strong>
          <small>recruteurs et admins confondus</small>
        </article>
        <article className="panel metric-panel">
          <span>A traiter</span>
          <strong>{priorityCount}</strong>
          <small>comptes a verifier ou completer</small>
        </article>
      </section>

      <section className="dashboard-workspace">
        <div className="dashboard-column">
          <AdminUsersBoard
            adminProfileId={profile.id}
            users={users}
            organizations={organizations}
          />
        </div>

        <aside className="dashboard-column dashboard-column--aside">
          <InviteUserForm organizations={organizations} />
        </aside>
      </section>
    </DashboardShell>
  );
}
