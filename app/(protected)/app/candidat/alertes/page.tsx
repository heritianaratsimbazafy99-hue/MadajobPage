import Link from "next/link";

import { DashboardShell } from "@/components/dashboard/shell";
import { CandidateJobAlertPreferenceForm } from "@/components/jobs/candidate-job-alert-preference-form";
import { CandidateJobAlertsBoard } from "@/components/jobs/candidate-job-alerts-board";
import {
  getCandidateJobAlertPreferenceSignals,
  summarizeCandidateJobAlerts
} from "@/lib/candidate-job-alert-insights";
import { getCandidateJobAlerts } from "@/lib/candidate-job-alerts";
import { requireRole } from "@/lib/auth";
import { formatDisplayDate } from "@/lib/format";
import { getCandidateWorkspace } from "@/lib/jobs";

export default async function CandidateJobAlertsPage() {
  const profile = await requireRole(["candidat"]);
  const [alerts, candidateProfile] = await Promise.all([
    getCandidateJobAlerts(profile.id),
    getCandidateWorkspace(profile)
  ]);
  const summary = summarizeCandidateJobAlerts(alerts, candidateProfile);
  const topAlert = summary.topAlert;
  const preferenceSignals = getCandidateJobAlertPreferenceSignals(candidateProfile);

  return (
    <DashboardShell
      title="Alertes d'offres"
      description="Retrouvez les nouvelles offres compatibles avec vos preferences et gardez le controle sur l'activation des alertes."
      profile={profile}
      currentPath="/app/candidat/alertes"
    >
      <section className="dashboard-grid dashboard-grid--four">
        <article className="panel metric-panel">
          <span>Alertes recues</span>
          <strong>{summary.totalCount}</strong>
          <small>offres signalees par vos preferences candidat</small>
        </article>
        <article className="panel metric-panel">
          <span>Forts matchs</span>
          <strong>{summary.strongCount}</strong>
          <small>alertes avec un score de matching eleve</small>
        </article>
        <article className="panel metric-panel">
          <span>Recentes</span>
          <strong>{summary.recentCount}</strong>
          <small>alertes creees sur les 14 derniers jours</small>
        </article>
        <article className="panel metric-panel">
          <span>Activation</span>
          <strong>{candidateProfile.job_alerts_enabled ? "Activee" : "Pause"}</strong>
          <small>
            {summary.preferencesConfigured
              ? `${summary.preferenceSignals.length} preference(s) configuree(s)`
              : "preferences a completer"}
          </small>
        </article>
      </section>

      <section className="dashboard-form">
        <div className="dashboard-form__head">
          <div>
            <p className="eyebrow">Centre d'action</p>
            <h2>Vos alertes sont reliees a vos preferences</h2>
          </div>
          <span className={`tag tag--${candidateProfile.job_alerts_enabled ? "success" : "muted"}`}>
            {candidateProfile.job_alerts_enabled ? "Alertes actives" : "Alertes en pause"}
          </span>
        </div>

        <div className="candidate-alerts-summary-grid">
          <article className="document-card candidate-alert-signal-card">
            <div className="dashboard-card__top">
              <strong>Meilleure alerte</strong>
              <span className={`tag tag--${topAlert && topAlert.match_score >= 78 ? "success" : "info"}`}>
                {topAlert ? `Match ${topAlert.match_score}%` : "Aucune"}
              </span>
            </div>
            <h3>{topAlert?.job.title ?? "Aucune alerte compatible pour le moment"}</h3>
            <p>
              {topAlert
                ? topAlert.match_reason || topAlert.job.summary
                : "Les prochaines offres publiees qui respectent vos criteres remonteront ici automatiquement."}
            </p>
            <small>
              {topAlert
                ? `Alerte creee le ${formatDisplayDate(topAlert.created_at)}.`
                : "Completez vos preferences pour rendre les alertes plus precises."}
            </small>
            <div className="notification-card__actions">
              {topAlert ? (
                <Link href={`/app/candidat/offres/${topAlert.job.slug}`}>Ouvrir l'offre</Link>
              ) : (
                <Link href="/app/candidat#candidate-search-preferences">
                  Completer mes preferences
                </Link>
              )}
            </div>
          </article>

          <article className="document-card candidate-alert-signal-card">
            <div className="dashboard-card__top">
              <strong>Preferences utilisees</strong>
              <span className="tag tag--muted">{preferenceSignals.length} signal(s)</span>
            </div>
            {preferenceSignals.length > 0 ? (
              <div className="candidate-alert-preferences">
                {preferenceSignals.map((item) => (
                  <span key={`${item.label}-${item.value}`} className="tag tag--info">
                    {item.label} : {item.value}
                  </span>
                ))}
              </div>
            ) : (
              <p>
                Ajoutez au moins un contrat, un mode de travail ou un salaire minimum pour recevoir
                des alertes plus fiables.
              </p>
            )}
            <small>
              Les preferences filtrent les nouvelles publications sans masquer les autres offres disponibles.
            </small>
            <div className="notification-card__actions">
              <Link href="/app/candidat#candidate-search-preferences">
                Ajuster mes preferences
              </Link>
            </div>
          </article>

          <article className="document-card candidate-alert-signal-card">
            <div className="dashboard-card__top">
              <strong>Activation</strong>
              <span className={`tag tag--${candidateProfile.job_alerts_enabled ? "success" : "muted"}`}>
                {candidateProfile.job_alerts_enabled ? "Activee" : "Pause"}
              </span>
            </div>
            <p>
              {candidateProfile.job_alerts_enabled
                ? "Les nouvelles offres compatibles peuvent creer une alerte in-app dans votre espace."
                : "Aucune nouvelle alerte ne sera creee tant que ce reglage reste en pause."}
            </p>
            <CandidateJobAlertPreferenceForm enabled={candidateProfile.job_alerts_enabled} />
          </article>
        </div>
      </section>

      <CandidateJobAlertsBoard alerts={alerts} />
    </DashboardShell>
  );
}
