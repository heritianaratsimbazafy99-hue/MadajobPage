import Link from "next/link";

import { DashboardShell } from "@/components/dashboard/shell";
import { CandidateJobsBoard } from "@/components/jobs/candidate-jobs-board";
import { MatchBreakdown } from "@/components/jobs/match-breakdown";
import { getApplicationStatusMeta } from "@/lib/application-status";
import {
  buildCandidateJobOpportunities,
  summarizeCandidateJobsWorkspace
} from "@/lib/candidate-job-insights";
import { requireRole } from "@/lib/auth";
import { formatDateTimeDisplay, formatDisplayDate } from "@/lib/format";
import { getCandidateApplicationSummaries, getCandidateWorkspace, getPublicJobs } from "@/lib/jobs";

export default async function CandidateJobsPage() {
  const profile = await requireRole(["candidat"]);
  const [jobs, applications, candidateProfile] = await Promise.all([
    getPublicJobs(),
    getCandidateApplicationSummaries(profile.id),
    getCandidateWorkspace(profile)
  ]);

  const opportunities = buildCandidateJobOpportunities(jobs, applications, candidateProfile);
  const summary = summarizeCandidateJobsWorkspace(opportunities);
  const topAvailable = summary.topAvailableOpportunity;
  const topActive = summary.topActiveOpportunity;
  const activeApplicationStatus = topActive?.application
    ? getApplicationStatusMeta(topActive.application.status)
    : null;

  return (
    <DashboardShell
      title="Offres disponibles"
      description="Explorez les offres visibles depuis la plateforme avec un cockpit plus oriente decision, matching et suivi des dossiers deja actifs."
      profile={profile}
      currentPath="/app/candidat/offres"
    >
      <section className="dashboard-grid dashboard-grid--four">
        <article className="panel metric-panel">
          <span>Offres visibles</span>
          <strong>{summary.visibleCount}</strong>
          <small>offres publiees accessibles depuis la plateforme</small>
        </article>
        <article className="panel metric-panel">
          <span>Forts matchs</span>
          <strong>{summary.strongAvailableCount}</strong>
          <small>opportunites disponibles avec fort alignement estime</small>
        </article>
        <article className="panel metric-panel">
          <span>Pretes a candidater</span>
          <strong>{summary.readyToApplyCount}</strong>
          <small>offres avec bon signal de matching et sans dossier existant</small>
        </article>
        <article className="panel metric-panel">
          <span>Dossiers actifs visibles</span>
          <strong>{summary.activeAppliedCount}</strong>
          <small>offres deja reliees a une candidature encore en mouvement</small>
        </article>
      </section>

      <section className="dashboard-form">
        <div className="dashboard-form__head">
          <div>
            <p className="eyebrow">Centre d'action</p>
            <h2>Ou concentrer votre attention maintenant</h2>
          </div>
          <span className="tag">{summary.featuredCount} offre(s) mise(s) en avant</span>
        </div>

        <div className="candidate-jobs-summary-grid">
          <article className="document-card candidate-jobs-summary-card">
            <div className="dashboard-card__top">
              <strong>Meilleure opportunite disponible</strong>
              <span className={`tag tag--${topAvailable?.match.tone ?? "muted"}`}>
                {topAvailable?.match.label ?? "Aucune"}
              </span>
            </div>
            <h3>{topAvailable?.job.title ?? "Aucune offre disponible pour le moment"}</h3>
            <p>
              {topAvailable
                ? topAvailable.match.reason
                : "De nouvelles offres apparaitront ici automatiquement des qu'elles seront publiees."}
            </p>
            {topAvailable ? (
              <MatchBreakdown match={topAvailable.match} compact showNextStep />
            ) : (
              <small>Continuez a completer votre profil pour renforcer le matching.</small>
            )}
            <div className="notification-card__actions">
              {topAvailable ? (
                <Link href={`/app/candidat/offres/${topAvailable.job.slug}`}>Voir l'offre</Link>
              ) : (
                <Link href="/app/candidat">Retour au cockpit candidat</Link>
              )}
            </div>
          </article>

          <article className="document-card candidate-jobs-summary-card">
            <div className="dashboard-card__top">
              <strong>Dossier deja actif a suivre</strong>
              <span className="tag tag--info">
                {activeApplicationStatus?.label ?? "Aucun"}
              </span>
            </div>
            <h3>{topActive?.job.title ?? "Aucun dossier actif sur ces offres"}</h3>
            <p>
              {topActive?.application?.interview_signal.next_interview_at
                ? `Prochain entretien le ${formatDateTimeDisplay(topActive.application.interview_signal.next_interview_at)}.`
                : activeApplicationStatus?.description ??
                  "Vos dossiers actifs apparaitront ici pour vous aider a arbitrer entre candidature et suivi."}
            </p>
            <small>
              {topActive?.application
                ? `Candidature envoyee le ${formatDisplayDate(topActive.application.created_at)}.`
                : "Le suivi detaille reste accessible depuis l'espace candidatures."}
            </small>
            <div className="notification-card__actions">
              {topActive?.application ? (
                <Link href={`/app/candidat/candidatures/${topActive.application.id}`}>
                  Ouvrir le dossier
                </Link>
              ) : (
                <Link href="/app/candidat/candidatures">Voir mes candidatures</Link>
              )}
            </div>
          </article>

          <article className="document-card candidate-jobs-summary-card">
            <div className="dashboard-card__top">
              <strong>Lecture du marche</strong>
              <span className="tag tag--muted">{summary.visibleCount} offres</span>
            </div>
            <h3>Gardez une recherche exploitable</h3>
            <p>
              {summary.readyToApplyCount > 0
                ? `${summary.readyToApplyCount} opportunite(s) semblent deja assez alignees pour candidater rapidement.`
                : "Le matching reste actif, mais votre profil peut encore gagner en precision pour mieux cibler les postes."}
            </p>
            <small>
              {summary.strongAvailableCount > 0
                ? `${summary.strongAvailableCount} fort(s) match(s) disponibles dans la liste actuelle.`
                : "Elargissez les filtres ou enrichissez votre profil pour faire remonter plus d'opportunites fortes."}
            </small>
            <div className="notification-card__actions">
              <Link href="/app/candidat">Completer mon profil</Link>
              <Link href="/app/candidat/candidatures">Voir mes dossiers actifs</Link>
            </div>
          </article>
        </div>
      </section>

      <CandidateJobsBoard opportunities={opportunities} />
    </DashboardShell>
  );
}
