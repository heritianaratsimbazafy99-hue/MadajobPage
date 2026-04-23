import Link from "next/link";

import { OrganizationsBoard } from "@/components/admin/organizations-board";
import { DashboardShell } from "@/components/dashboard/shell";
import { requireRole } from "@/lib/auth";
import { formatDisplayDate } from "@/lib/format";
import { getManagedOrganizations } from "@/lib/jobs";
import {
  getManagedOrganizationPriorityMeta,
  summarizeManagedOrganizations
} from "@/lib/managed-organization-insights";

export default async function AdminOrganizationsPage() {
  const profile = await requireRole(["admin"]);
  const organizations = await getManagedOrganizations();
  const summary = summarizeManagedOrganizations(organizations);

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
  const priorityCount =
    summary.total -
    organizations.filter(
      (organization) =>
        getManagedOrganizationPriorityMeta(organization).key === "healthy"
    ).length;
  const topPriorityOrganization = summary.topPriorityOrganization;
  const topPriorityMeta = topPriorityOrganization
    ? getManagedOrganizationPriorityMeta(topPriorityOrganization)
    : null;

  return (
    <DashboardShell
      title="Organisations"
      description="Pilotez les entites clientes et internes avec une vue plus actionnable sur la couverture recruteur, la diffusion et les pipelines a arbitrer."
      profile={profile}
      currentPath="/app/admin/organisations"
    >
      <section className="dashboard-grid dashboard-grid--four">
        <article className="panel metric-panel">
          <span>Organisations</span>
          <strong>{organizations.length}</strong>
          <small>{summary.activeCount} active(s)</small>
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

      <section className="dashboard-form">
        <div className="dashboard-form__head">
          <div>
            <p className="eyebrow">Centre d'action</p>
            <h2>Ou arbitrer vos organisations maintenant</h2>
          </div>
          <span className="tag">{summary.advancedPipelineCount} pipeline(s) avance(s)</span>
        </div>

        <div className="managed-jobs-summary-grid">
          <article className="document-card managed-jobs-summary-card">
            <strong>Organisation prioritaire</strong>
            <p>{topPriorityOrganization?.name ?? "Aucune organisation prioritaire pour le moment"}</p>
            <small>
              {topPriorityOrganization && topPriorityMeta
                ? `${topPriorityMeta.label}. Dernier signal le ${formatDisplayDate(topPriorityOrganization.latest_application_at ?? topPriorityOrganization.latest_job_at)}.`
                : "Le cockpit admin remontera ici l'entite qui demande l'action la plus concrete."}
            </small>
            <div className="notification-card__actions">
              {topPriorityOrganization ? (
                <Link href={`/app/admin/organisations/${topPriorityOrganization.id}`}>
                  Ouvrir l'organisation prioritaire
                </Link>
              ) : null}
            </div>
          </article>

          <article className="document-card managed-jobs-summary-card">
            <strong>Couverture a securiser</strong>
            <p>
              {summary.withoutRecruitersCount} organisation(s) sont sans recruteur et{" "}
              {summary.withoutJobsCount} sans offre active.
            </p>
            <small>
              Utilisez les focus `Sans recruteur` et `Sans offre active` pour isoler vite les
              entites a remettre en ordre.
            </small>
          </article>

          <article className="document-card managed-jobs-summary-card">
            <strong>Cadence a surveiller</strong>
            <p>
              {summary.dormantCount} organisation(s) sont dormantes et{" "}
              {summary.advancedPipelineCount} portent deja un pipeline avance.
            </p>
            <small>
              L'objectif est d'identifier vite ce qui doit etre relance, modere ou arbitre dans la
              fiche detaillee.
            </small>
          </article>
        </div>
      </section>

      <OrganizationsBoard organizations={organizations} />
    </DashboardShell>
  );
}
