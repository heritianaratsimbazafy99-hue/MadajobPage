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

export default async function AdminCandidatesPage() {
  const profile = await requireRole(["admin"]);
  const [candidates, jobs] = await Promise.all([
    getManagedCandidates(profile),
    getManagedJobs(profile, { limit: 300 })
  ]);
  const summary = summarizeManagedCandidates(candidates);
  const topPriorityCandidate = summary.topPriorityCandidate;
  const topPriorityMeta = topPriorityCandidate
    ? getManagedCandidatePriorityMeta(topPriorityCandidate)
    : null;

  return (
    <DashboardShell
      title="Base candidats"
      description="Supervisez la qualite du vivier, les profils prets a activer et les dossiers qui demandent une qualification ou un arbitrage plus rapide."
      profile={profile}
      currentPath="/app/admin/candidats"
    >
      <section className="dashboard-grid dashboard-grid--four">
        <article className="panel metric-panel">
          <span>Profils visibles</span>
          <strong>{summary.total}</strong>
          <small>candidats supervises dans le cockpit admin</small>
        </article>
        <article className="panel metric-panel">
          <span>Profils prets</span>
          <strong>{summary.readyCount}</strong>
          <small>vivier exploitable rapidement</small>
        </article>
        <article className="panel metric-panel">
          <span>Sans CV principal</span>
          <strong>{summary.withoutCvCount}</strong>
          <small>profils a fiabiliser</small>
        </article>
        <article className="panel metric-panel">
          <span>Multi-dossiers</span>
          <strong>{summary.multiApplicationCount}</strong>
          <small>candidat(s) avec plusieurs candidatures</small>
        </article>
      </section>

      <section className="dashboard-form">
        <div className="dashboard-form__head">
          <div>
            <p className="eyebrow">Centre d'action</p>
            <h2>Ou arbitrer la base candidats maintenant</h2>
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
                : "Le cockpit admin fera remonter ici le profil qui merite l'arbitrage le plus concret."}
            </small>
            <div className="notification-card__actions">
              {topPriorityCandidate ? (
                <Link href={`/app/admin/candidats/${topPriorityCandidate.id}`}>
                  Ouvrir le profil prioritaire
                </Link>
              ) : null}
            </div>
          </article>

          <article className="document-card managed-jobs-summary-card">
            <strong>Vivier a activer</strong>
            <p>
              {summary.readyCount} profil(s) sont deja mobilisables rapidement et{" "}
              {summary.recentActivityCount} ont montre une activite recente.
            </p>
            <small>
              La liste detaillee permet ensuite de croiser ce vivier avec une offre cible et de
              prioriser les meilleurs matchs.
            </small>
          </article>

          <article className="document-card managed-jobs-summary-card">
            <strong>Qualification a securiser</strong>
            <p>
              {summary.withoutCvCount} profil(s) restent sans CV principal et{" "}
              {summary.lowCompletionCount} manquent encore de structure.
            </p>
            <small>
              Utilisez les focus `CV principal a fiabiliser` et `Profils a qualifier` pour isoler
              vite les cas a nettoyer ou accompagner.
            </small>
          </article>
        </div>
      </section>

      <ManagedCandidatesBoard
        candidates={candidates}
        jobs={jobs}
        basePath="/app/admin/candidats"
      />
    </DashboardShell>
  );
}
