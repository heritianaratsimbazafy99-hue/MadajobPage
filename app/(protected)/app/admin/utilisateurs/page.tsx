import Link from "next/link";

import { InviteUserForm } from "@/components/admin/invite-user-form";
import { AdminUsersBoard } from "@/components/admin/users-board";
import { DashboardShell } from "@/components/dashboard/shell";
import { requireRole } from "@/lib/auth";
import {
  getManagedUserPriorityMeta,
  summarizeManagedUsers
} from "@/lib/managed-user-insights";
import { getAdminOrganizations, getAdminUsers } from "@/lib/jobs";

export default async function AdminUsersPage() {
  const profile = await requireRole(["admin"]);
  const [users, organizations] = await Promise.all([
    getAdminUsers(),
    getAdminOrganizations()
  ]);
  const summary = summarizeManagedUsers(users);
  const topPriorityUser = summary.topPriorityUser;
  const topPriorityMeta = topPriorityUser
    ? getManagedUserPriorityMeta(topPriorityUser)
    : null;
  const internalWatchCount =
    summary.recruitersWithoutOrganizationCount +
    summary.inactiveInternalCount +
    summary.dormantInternalCount;

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
          <strong>{summary.total}</strong>
          <small>{summary.activeCount} actif(s) dans le cockpit admin</small>
        </article>
        <article className="panel metric-panel">
          <span>Onboardings internes</span>
          <strong>{summary.invitationWatchCount}</strong>
          <small>invitations recentes a suivre jusqu'au premier usage</small>
        </article>
        <article className="panel metric-panel">
          <span>Acces internes a regulariser</span>
          <strong>{internalWatchCount}</strong>
          <small>
            {summary.recruitersWithoutOrganizationCount} sans organisation,{" "}
            {summary.inactiveInternalCount} inactif(s)
          </small>
        </article>
        <article className="panel metric-panel">
          <span>Candidats a qualifier</span>
          <strong>{summary.candidatesToReviewCount}</strong>
          <small>profils incomplets ou encore sans vraie traction</small>
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
          <div className="panel dashboard-sidecard">
            <p className="eyebrow">Ou agir maintenant</p>
            <h2>
              {topPriorityUser
                ? topPriorityUser.full_name || topPriorityUser.email || "Compte prioritaire"
                : "Aucun compte prioritaire pour le moment"}
            </h2>
            <p>
              {topPriorityMeta?.description ??
                "Le cockpit utilisateurs est stable. Utilisez les filtres pour cibler un role ou une organisation."}
            </p>
            {topPriorityUser ? (
              <div className="dashboard-list">
                <article className="panel list-card dashboard-card">
                  <div className="dashboard-card__top">
                    <h3>{topPriorityMeta?.label ?? "Priorite"}</h3>
                    <span className="tag">{topPriorityUser.role}</span>
                  </div>
                  <div className="job-card__meta">
                    <span>{topPriorityUser.organization_name || "Sans organisation"}</span>
                    <span>{topPriorityUser.is_active ? "Compte actif" : "Compte inactif"}</span>
                  </div>
                  <div className="dashboard-action-stack">
                    <Link
                      className="btn btn-secondary btn-block"
                      href={`/app/admin/utilisateurs/${topPriorityUser.id}`}
                    >
                      Ouvrir la fiche prioritaire
                    </Link>
                    <Link className="btn btn-ghost btn-block" href="/app/admin/audit">
                      Croiser avec l'audit
                    </Link>
                  </div>
                </article>
              </div>
            ) : null}
          </div>

          <InviteUserForm organizations={organizations} />
        </aside>
      </section>
    </DashboardShell>
  );
}
