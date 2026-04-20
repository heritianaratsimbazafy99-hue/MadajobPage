import Link from "next/link";

import { JobEditForm } from "@/components/jobs/job-edit-form";
import { JobHistoryPanel } from "@/components/jobs/job-history-panel";
import { JobStatusPanel } from "@/components/jobs/job-status-panel";
import { formatDisplayDate } from "@/lib/format";
import type { JobAuditEvent, ManagedJob, Profile } from "@/lib/types";
import { DashboardShell } from "@/components/dashboard/shell";

type JobManagementWorkspaceProps = {
  profile: Profile;
  job: ManagedJob;
  events: JobAuditEvent[];
  currentPath: string;
  backHref: string;
};

export function JobManagementWorkspace({
  profile,
  job,
  events,
  currentPath,
  backHref
}: JobManagementWorkspaceProps) {
  return (
    <DashboardShell
      title={job.title}
      description="Gerez le contenu, le statut, la visibilite et l'historique de cette offre depuis la plateforme."
      profile={profile}
      currentPath={currentPath}
    >
      <section className="dashboard-grid dashboard-grid--four">
        <article className="panel metric-panel">
          <span>Statut</span>
          <strong>{job.status}</strong>
          <small>etat actuel de l'annonce</small>
        </article>
        <article className="panel metric-panel">
          <span>Candidatures</span>
          <strong>{job.applications_count}</strong>
          <small>profils recus sur cette offre</small>
        </article>
        <article className="panel metric-panel">
          <span>Publication</span>
          <strong>{job.published_at ? "Oui" : "Non"}</strong>
          <small>{formatDisplayDate(job.published_at)}</small>
        </article>
        <article className="panel metric-panel">
          <span>Derniere mise a jour</span>
          <strong>{formatDisplayDate(job.updated_at)}</strong>
          <small>{job.is_featured ? "mise en avant active" : "mise en avant inactive"}</small>
        </article>
      </section>

      <section className="dashboard-workspace">
        <div className="dashboard-column">
          <JobEditForm job={job} />
          <JobHistoryPanel events={events} />
        </div>

        <aside className="dashboard-column dashboard-column--aside">
          <div className="panel dashboard-sidecard">
            <p className="eyebrow">Vue rapide</p>
            <h2>Pilotez cette offre sans revenir a la vitrine.</h2>
            <ul className="dashboard-mini-list">
              <li>Slug public : /carrieres/{job.slug}</li>
              <li>Cloture : {job.closing_at ? formatDisplayDate(job.closing_at) : "non definie"}</li>
              <li>Secteur : {job.sector || "non renseigne"}</li>
            </ul>
            <div className="dashboard-action-stack">
              <Link className="btn btn-secondary btn-block" href={backHref}>
                Retour a la liste des offres
              </Link>
              {job.status === "published" ? (
                <Link className="btn btn-ghost btn-block" href={`/carrieres/${job.slug}`}>
                  Voir la page publique
                </Link>
              ) : null}
            </div>
          </div>

          <JobStatusPanel job={job} />
        </aside>
      </section>
    </DashboardShell>
  );
}
