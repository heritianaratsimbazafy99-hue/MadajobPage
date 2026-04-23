import Link from "next/link";

import { DashboardShell } from "@/components/dashboard/shell";
import { ManagedJobsBoard } from "@/components/jobs/managed-jobs-board";
import { summarizeManagedJobs } from "@/lib/managed-job-insights";
import { requireRole } from "@/lib/auth";
import { formatDisplayDate } from "@/lib/format";
import { getManagedJobs } from "@/lib/jobs";

export default async function AdminJobsPage() {
  const profile = await requireRole(["admin"]);
  const jobs = await getManagedJobs(profile);
  const summary = summarizeManagedJobs(jobs);
  const topPriorityJob = summary.topPriorityJob;

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
          <span>Mises en avant</span>
          <strong>{summary.featuredCount}</strong>
          <small>{summary.closingSoonCount} cloture(s) proche(s)</small>
        </article>
      </section>

      <section className="dashboard-form">
        <div className="dashboard-form__head">
          <div>
            <p className="eyebrow">Centre d'action</p>
            <h2>Ou arbitrer la diffusion maintenant</h2>
          </div>
          <span className="tag">{summary.activePipelineCount} pipeline(s) actif(s)</span>
        </div>

        <div className="managed-jobs-summary-grid">
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
            <strong>Diffusion a relancer</strong>
            <p>
              {summary.withoutApplicationsCount} annonce(s) publiee(s) n'ont pas encore converti en
              candidatures.
            </p>
            <small>
              Utilisez le focus `Publiees sans candidatures` pour isoler vite les annonces a revoir,
              republier ou requalifier.
            </small>
          </article>

          <article className="document-card managed-jobs-summary-card">
            <strong>Moderation a arbitrer</strong>
            <p>
              {summary.draftCount} brouillon(s) et {summary.closingSoonCount} cloture(s) proche(s)
              demandent une decision plus rapide.
            </p>
            <small>
              La fiche detaillee offre ensuite le pilotage fin du contenu, du statut et du pipeline
              rattache.
            </small>
          </article>
        </div>
      </section>

      <ManagedJobsBoard jobs={jobs} basePath="/app/admin/offres" />
    </DashboardShell>
  );
}
