import Link from "next/link";

import { DashboardShell } from "@/components/dashboard/shell";
import { ManagedCandidatesBoard } from "@/components/candidates/managed-candidates-board";
import { requireRole } from "@/lib/auth";
import { formatDisplayDate } from "@/lib/format";
import { getManagedCandidates, getManagedJobs } from "@/lib/jobs";
import {
  getManagedCandidatePriorityMeta,
  summarizeManagedCandidates
} from "@/lib/managed-candidate-insights";

export default async function RecruiterCandidatesPage() {
  const profile = await requireRole(["recruteur"]);
  const [candidates, jobs] = await Promise.all([
    getManagedCandidates(profile),
    getManagedJobs(profile, { limit: 200 })
  ]);
  const summary = summarizeManagedCandidates(candidates);
  const topPriorityCandidate = summary.topPriorityCandidate;
  const topPriorityMeta = topPriorityCandidate
    ? getManagedCandidatePriorityMeta(topPriorityCandidate)
    : null;

  return (
    <DashboardShell
      title="Base candidats"
      description="Pilotez le vivier avec une base candidats plus actionnable, centre sur les profils prets, les dossiers a relancer et les trous de qualification."
      profile={profile}
      currentPath="/app/recruteur/candidats"
    >
      <section className="dashboard-grid dashboard-grid--four">
        <article className="panel metric-panel">
          <span>Profils visibles</span>
          <strong>{summary.total}</strong>
          <small>candidats accessibles dans votre vivier</small>
        </article>
        <article className="panel metric-panel">
          <span>Profils prets</span>
          <strong>{summary.readyCount}</strong>
          <small>avec CV principal et profil complet</small>
        </article>
        <article className="panel metric-panel">
          <span>Sans CV principal</span>
          <strong>{summary.withoutCvCount}</strong>
          <small>profils a fiabiliser avant tri rapide</small>
        </article>
        <article className="panel metric-panel">
          <span>Activite recente</span>
          <strong>{summary.recentActivityCount}</strong>
          <small>profil(s) actif(s) sur les 30 derniers jours</small>
        </article>
      </section>

      <section className="dashboard-form">
        <div className="dashboard-form__head">
          <div>
            <p className="eyebrow">Centre d'action</p>
            <h2>Ou concentrer votre sourcing maintenant</h2>
          </div>
          <span className="tag">{summary.activePipelineCount} pipeline(s) actif(s)</span>
        </div>

        <div className="managed-jobs-summary-grid">
          <article className="document-card managed-jobs-summary-card">
            <strong>Profil prioritaire</strong>
            <p>{topPriorityCandidate?.full_name ?? "Aucun profil prioritaire pour le moment"}</p>
            <small>
              {topPriorityCandidate && topPriorityMeta
                ? `${topPriorityMeta.label}. Derniere activite le ${formatDisplayDate(topPriorityCandidate.latest_application_at)}.`
                : "Le cockpit fera remonter ici le candidat qui demande l'action la plus concrete."}
            </small>
            <div className="notification-card__actions">
              {topPriorityCandidate ? (
                <Link href={`/app/recruteur/candidats/${topPriorityCandidate.id}`}>
                  Ouvrir le profil prioritaire
                </Link>
              ) : null}
            </div>
          </article>

          <article className="document-card managed-jobs-summary-card">
            <strong>Vivier exploitable</strong>
            <p>
              {summary.readyCount} profil(s) sont deja suffisamment qualifies pour etre pousses
              vers les bonnes offres sans gros travail preparatoire.
            </p>
            <small>
              {summary.multiApplicationCount} candidat(s) ont deja plusieurs dossiers et meritent un
              suivi plus fin sur la suite du pipeline.
            </small>
          </article>

          <article className="document-card managed-jobs-summary-card">
            <strong>Points de friction</strong>
            <p>
              {summary.withoutCvCount} profil(s) n'ont pas encore de CV principal et{" "}
              {summary.lowCompletionCount} restent peu completes.
            </p>
            <small>
              Utilisez les focus `CV principal a fiabiliser` et `Profils a qualifier` pour nettoyer
              rapidement le vivier.
            </small>
          </article>
        </div>
      </section>

      <ManagedCandidatesBoard
        candidates={candidates}
        jobs={jobs}
        basePath="/app/recruteur/candidats"
      />
    </DashboardShell>
  );
}
