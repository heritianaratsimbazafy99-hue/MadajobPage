import Link from "next/link";

import { DashboardShell } from "@/components/dashboard/shell";
import { JobCreateForm } from "@/components/jobs/job-create-form";
import { ManagedJobsBoard } from "@/components/jobs/managed-jobs-board";
import { summarizeManagedJobs } from "@/lib/managed-job-insights";
import { requireRole } from "@/lib/auth";
import { formatDisplayDate } from "@/lib/format";
import { getAdminOrganizations, getManagedJobs } from "@/lib/jobs";
import { getJobQualityReport } from "@/lib/job-quality";

export default async function AdminJobsPage() {
  const profile = await requireRole(["admin"]);
  const [jobs, organizationOptions] = await Promise.all([
    getManagedJobs(profile),
    getAdminOrganizations()
  ]);
  const summary = summarizeManagedJobs(jobs);
  const topPriorityJob = summary.topPriorityJob;
  const madajobPublishedCount = jobs.filter(
    (job) => job.status === "published" && (job.organization_name ?? "").toLowerCase() === "madajob"
  ).length;
  const qualityIssuesCount = jobs.filter((job) => !getJobQualityReport(job).readyForPublication).length;

  return (
    <DashboardShell
      title="Offres et diffusion"
      description="Supervisez les annonces avec une vue plus actionnable sur la diffusion, la traction et les priorites de moderation."
      profile={profile}
      currentPath="/app/admin/offres"
    >
      <section className="dashboard-grid dashboard-grid--four">
        <article className="panel metric-panel">
          <span>Offres visibles</span>
          <strong>{summary.total}</strong>
          <small>annonces dans le cockpit admin</small>
        </article>
        <article className="panel metric-panel">
          <span>Brouillons</span>
          <strong>{summary.draftCount}</strong>
          <small>offres encore a arbitrer ou publier</small>
        </article>
        <article className="panel metric-panel">
          <span>Publiees</span>
          <strong>{summary.publishedCount}</strong>
          <small>{summary.withoutApplicationsCount} sans candidature</small>
        </article>
        <article className="panel metric-panel">
          <span>Diffusion Madajob</span>
          <strong>{madajobPublishedCount}</strong>
          <small>{qualityIssuesCount} annonce(s) a renforcer avant publication</small>
        </article>
      </section>

      <section className="admin-jobs-command-grid">
        <JobCreateForm
          roleLabel="Admin"
          organizationOptions={organizationOptions}
          defaultOrganizationId={profile.organization_id}
        />

        <div className="dashboard-section">
          <section className="dashboard-form">
            <div className="dashboard-form__head">
              <div>
                <p className="eyebrow">Centre d'action</p>
                <h2>Ou arbitrer la diffusion maintenant</h2>
              </div>
              <span className="tag">{summary.activePipelineCount} pipeline(s) actif(s)</span>
            </div>

            <div className="managed-jobs-summary-grid managed-jobs-summary-grid--compact">
              <article className="document-card managed-jobs-summary-card">
                <strong>Offre prioritaire</strong>
                <p>{topPriorityJob?.title ?? "Aucune offre prioritaire pour le moment"}</p>
                <small>
                  {topPriorityJob
                    ? `Derniere mise a jour le ${formatDisplayDate(topPriorityJob.updated_at)}.`
                    : "Le cockpit admin remontera ici l'annonce qui demande un arbitrage rapide."}
                </small>
                <div className="notification-card__actions">
                  {topPriorityJob ? (
                    <Link href={`/app/admin/offres/${topPriorityJob.id}`}>Ouvrir l'offre prioritaire</Link>
                  ) : null}
                </div>
              </article>

              <article className="document-card managed-jobs-summary-card">
                <strong>Diffusion publique</strong>
                <p>{madajobPublishedCount} offre(s) Madajob publiee(s) visibles sur la page carriere.</p>
                <small>Les offres au statut publie alimentent automatiquement la vitrine institutionnelle.</small>
                <div className="notification-card__actions">
                  <Link href="/carrieres">Voir la page carriere</Link>
                </div>
              </article>

              <article className="document-card managed-jobs-summary-card">
                <strong>Diffusion a relancer</strong>
                <p>{summary.withoutApplicationsCount} annonce(s) publiee(s) sans candidature.</p>
                <small>Isolez-les avec le focus `Publiees sans candidatures` pour revoir le contenu ou la mise en avant.</small>
              </article>

              <article className="document-card managed-jobs-summary-card">
                <strong>Moderation a arbitrer</strong>
                <p>{summary.draftCount} brouillon(s) et {qualityIssuesCount} score(s) qualite a renforcer.</p>
                <small>Le score controle le titre, les competences, le salaire et la date de cloture.</small>
              </article>
            </div>
          </section>
        </div>
      </section>

      <ManagedJobsBoard jobs={jobs} basePath="/app/admin/offres" />
    </DashboardShell>
  );
}
