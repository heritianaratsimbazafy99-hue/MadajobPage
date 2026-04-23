import Link from "next/link";

import { DashboardShell } from "@/components/dashboard/shell";
import { ManagedJobsBoard } from "@/components/jobs/managed-jobs-board";
import { summarizeManagedJobs } from "@/lib/managed-job-insights";
import { requireRole } from "@/lib/auth";
import { formatDisplayDate } from "@/lib/format";
import { getManagedJobs } from "@/lib/jobs";

export default async function RecruiterJobsPage() {
  const profile = await requireRole(["recruteur"]);
  const jobs = await getManagedJobs(profile);
  const summary = summarizeManagedJobs(jobs);
  const topPriorityJob = summary.topPriorityJob;

  return (
    <DashboardShell
      title="Gestion des offres"
      description="Pilotez vos annonces avec un cockpit plus actionnable, centre sur la diffusion, la traction et les priorites de traitement."
      profile={profile}
      currentPath="/app/recruteur/offres"
    >
      <section className="dashboard-grid dashboard-grid--four">
        <article className="panel metric-panel">
          <span>Offres visibles</span>
          <strong>{summary.total}</strong>
          <small>annonces dans le cockpit recruteur</small>
        </article>
        <article className="panel metric-panel">
          <span>Brouillons</span>
          <strong>{summary.draftCount}</strong>
          <small>offres encore a publier ou arbitrer</small>
        </article>
        <article className="panel metric-panel">
          <span>Sans candidatures</span>
          <strong>{summary.withoutApplicationsCount}</strong>
          <small>offres diffusees qui ne convertissent pas encore</small>
        </article>
        <article className="panel metric-panel">
          <span>Cloture proche</span>
          <strong>{summary.closingSoonCount}</strong>
          <small>offres a arbitrer rapidement</small>
        </article>
      </section>

      <section className="dashboard-form">
        <div className="dashboard-form__head">
          <div>
            <p className="eyebrow">Centre d'action</p>
            <h2>Ou concentrer votre attention maintenant</h2>
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
                : "Le cockpit fera remonter ici l'annonce qui demande une action concrete."}
            </small>
            <div className="notification-card__actions">
              {topPriorityJob ? (
                <Link href={`/app/recruteur/offres/${topPriorityJob.id}`}>Ouvrir l'offre prioritaire</Link>
              ) : null}
            </div>
          </article>

          <article className="document-card managed-jobs-summary-card">
            <strong>Diffusion a surveiller</strong>
            <p>
              {summary.withoutApplicationsCount} offre(s) publiee(s) n'ont encore genere aucune
              candidature.
            </p>
            <small>
              Utilisez le focus `Publiees sans candidatures` pour isoler rapidement les annonces a
              retravailler ou relancer.
            </small>
          </article>

          <article className="document-card managed-jobs-summary-card">
            <strong>Pipeline deja actif</strong>
            <p>
              {summary.activePipelineCount} offre(s) disposent deja d'un volume de candidatures qui
              justifie un suivi detaille.
            </p>
            <small>
              La fiche offre detaillee vous permet ensuite de piloter les dossiers, entretiens et
              decisions liees.
            </small>
          </article>
        </div>
      </section>

      <ManagedJobsBoard jobs={jobs} basePath="/app/recruteur/offres" />
    </DashboardShell>
  );
}
