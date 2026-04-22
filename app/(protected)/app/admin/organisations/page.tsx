import { OrganizationsBoard } from "@/components/admin/organizations-board";
import { DashboardShell } from "@/components/dashboard/shell";
import { requireRole } from "@/lib/auth";
import { getManagedOrganizations } from "@/lib/jobs";

export default async function AdminOrganizationsPage() {
  const profile = await requireRole(["admin"]);
  const organizations = await getManagedOrganizations();

  const activeCount = organizations.filter((organization) => organization.is_active).length;
  const membersCount = organizations.reduce(
    (sum, organization) => sum + organization.members_count,
    0
  );
  const jobsCount = organizations.reduce(
    (sum, organization) => sum + organization.active_jobs_count,
    0
  );
  const applicationsCount = organizations.reduce(
    (sum, organization) => sum + organization.applications_count,
    0
  );
  const priorityCount = organizations.filter(
    (organization) =>
      !organization.is_active ||
      organization.recruiters_count === 0 ||
      organization.active_jobs_count === 0
  ).length;

  return (
    <DashboardShell
      title="Organisations"
      description="Pilotez les entites clientes et internes, leur activite et leur capacite recrutement depuis un module dedie."
      profile={profile}
      currentPath="/app/admin/organisations"
    >
      <section className="dashboard-grid dashboard-grid--four">
        <article className="panel metric-panel">
          <span>Organisations</span>
          <strong>{organizations.length}</strong>
          <small>{activeCount} active(s)</small>
        </article>
        <article className="panel metric-panel">
          <span>Membres</span>
          <strong>{membersCount}</strong>
          <small>comptes rattaches a une organisation</small>
        </article>
        <article className="panel metric-panel">
          <span>Offres actives</span>
          <strong>{jobsCount}</strong>
          <small>annonces actuellement publiees</small>
        </article>
        <article className="panel metric-panel">
          <span>A surveiller</span>
          <strong>{priorityCount}</strong>
          <small>{applicationsCount} candidature(s) consolidee(s)</small>
        </article>
      </section>

      <OrganizationsBoard organizations={organizations} />
    </DashboardShell>
  );
}
