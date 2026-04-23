import Link from "next/link";

import { DashboardInterviewSignalCard } from "@/components/dashboard/interview-signal-card";
import { DashboardShell } from "@/components/dashboard/shell";
import { JobEditForm } from "@/components/jobs/job-edit-form";
import { JobHistoryPanel } from "@/components/jobs/job-history-panel";
import { JobStatusPanel } from "@/components/jobs/job-status-panel";
import { getApplicationStatusMeta } from "@/lib/application-status";
import { formatDisplayDate } from "@/lib/format";
import { summarizeJobManagementApplications } from "@/lib/job-management-insights";
import type { JobMatchResult } from "@/lib/matching";
import type {
  JobAuditEvent,
  ManagedCandidateSummary,
  ManagedJob,
  Profile,
  RecruiterApplication
} from "@/lib/types";

type JobManagementWorkspaceProps = {
  profile: Profile;
  job: ManagedJob;
  events: JobAuditEvent[];
  relatedApplications: RecruiterApplication[];
  suggestedCandidates: Array<{
    candidate: ManagedCandidateSummary;
    match: JobMatchResult;
  }>;
  currentPath: string;
  backHref: string;
};

export function JobManagementWorkspace({
  profile,
  job,
  events,
  relatedApplications,
  suggestedCandidates,
  currentPath,
  backHref
}: JobManagementWorkspaceProps) {
  const applicationsBasePath =
    profile.role === "admin" ? "/app/admin/candidatures" : "/app/recruteur/candidatures";
  const candidatesBasePath =
    profile.role === "admin" ? "/app/admin/candidats" : "/app/recruteur/candidats";
  const summary = summarizeJobManagementApplications(relatedApplications);
  const topApplication = summary.topApplication;
  const topApplicationStatus = topApplication
    ? getApplicationStatusMeta(topApplication.status)
    : null;

  return (
    <DashboardShell
      title={job.title}
      description="Gerez le contenu, le statut, la visibilite et les signaux de pipeline de cette offre depuis la plateforme."
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
          <span>Candidatures actives</span>
          <strong>{summary.activeCount}</strong>
          <small>{job.applications_count} profil(s) recus sur cette offre</small>
        </article>
        <article className="panel metric-panel">
          <span>Entretiens a venir</span>
          <strong>{summary.upcomingInterviewCount}</strong>
          <small>{summary.pendingFeedbackCount} feedback(s) encore a saisir</small>
        </article>
        <article className="panel metric-panel">
          <span>Decisions prêtes</span>
          <strong>{summary.readyDecisionCount}</strong>
          <small>{summary.favorableFeedbackCount} feedback(s) favorables</small>
        </article>
      </section>

      <section className="dashboard-workspace">
        <div className="dashboard-column">
          <div className="dashboard-form">
            <div className="dashboard-form__head">
              <div>
                <p className="eyebrow">Centre d'action</p>
                <h2>Ce qui merite votre attention maintenant</h2>
              </div>
              <span className="tag">{relatedApplications.length} dossier(s)</span>
            </div>

            <div className="job-management-summary-grid">
              <article className="document-card job-management-summary-card">
                <div className="dashboard-card__top">
                  <strong>Dossier prioritaire</strong>
                  <span className="tag">{topApplicationStatus?.label ?? "Aucun"}</span>
                </div>
                <h3>{topApplication?.candidate_name ?? "Aucun dossier actif sur cette offre"}</h3>
                <p>
                  {topApplication?.interview_signal.pending_feedback
                    ? "Un entretien est termine sans compte-rendu. La priorite est de saisir le feedback."
                    : topApplication?.interview_signal.latest_feedback
                      ? "Un feedback existe deja. La prochaine etape est d'arbitrer et d'appliquer la decision."
                      : topApplication?.interview_signal.next_interview_at
                        ? "Un entretien est planifie. Le dossier est a preparer avant le rendez-vous."
                        : topApplicationStatus?.description ??
                          "Les prochains signaux forts de cette offre remonteront ici automatiquement."}
                </p>
                <small>
                  {topApplication
                    ? `Derniere mise a jour le ${formatDisplayDate(topApplication.updated_at ?? topApplication.created_at)}.`
                    : "Le centre d'action se nourrit des candidatures et entretiens lies a cette offre."}
                </small>
                <div className="notification-card__actions">
                  {topApplication ? (
                    <Link href={`${applicationsBasePath}/${topApplication.id}`}>
                      Ouvrir le dossier prioritaire
                    </Link>
                  ) : (
                    <Link href={backHref}>Retour a la liste des offres</Link>
                  )}
                </div>
              </article>

              <article className="document-card job-management-summary-card">
                <strong>Sante du pipeline</strong>
                <p>
                  {summary.advancedCount} dossier(s) avance(s), {summary.upcomingInterviewCount} entretien(s)
                  a venir et {summary.readyDecisionCount} decision(s) exploitables.
                </p>
                <small>
                  {summary.pendingFeedbackCount > 0
                    ? `${summary.pendingFeedbackCount} compte-rendu(s) d'entretien restent encore a saisir.`
                    : "Aucun feedback en retard sur cette offre pour le moment."}
                </small>
              </article>

              <article className="document-card job-management-summary-card">
                <strong>Qualite des dossiers</strong>
                <p>
                  {summary.applicationsWithCv} dossier(s) ont un CV joint, soit{" "}
                  {relatedApplications.length > 0
                    ? Math.round((summary.applicationsWithCv / relatedApplications.length) * 100)
                    : 0}
                  % du pipeline de cette offre.
                </p>
                <small>
                  {relatedApplications.length - summary.applicationsWithCv > 0
                    ? `${relatedApplications.length - summary.applicationsWithCv} dossier(s) restent sans CV joint.`
                    : "Tous les dossiers visibles sur cette offre disposent d'un CV joint."}
                </small>
              </article>
            </div>
          </div>

          <JobEditForm job={job} />

          <div className="dashboard-form">
            <div className="dashboard-form__head">
              <div>
                <p className="eyebrow">Pipeline sur l'offre</p>
                <h2>Les dossiers les plus actionnables rattaches a cette annonce</h2>
              </div>
              <span className="tag">{summary.prioritizedApplications.length} dossier(s)</span>
            </div>

            <div className="dashboard-list">
              {summary.prioritizedApplications.length > 0 ? (
                summary.prioritizedApplications.map((application) => (
                  <article key={application.id} className="panel list-card dashboard-card">
                    <div className="dashboard-card__top">
                      <div>
                        <h3>{application.candidate_name}</h3>
                        <p>{application.candidate_email}</p>
                      </div>
                      <div className="dashboard-card__badges">
                        <span className="tag">
                          {getApplicationStatusMeta(application.status).label}
                        </span>
                        {application.interview_signal.pending_feedback ? (
                          <span className="tag tag--danger">Feedback a saisir</span>
                        ) : null}
                        {application.interview_signal.latest_feedback ? (
                          <span className="tag tag--info">Decision exploitable</span>
                        ) : null}
                      </div>
                    </div>

                    <div className="job-card__meta">
                      <span>{application.has_cv ? "CV joint" : "CV manquant"}</span>
                      <span>Soumis le {formatDisplayDate(application.created_at)}</span>
                      <span>
                        Mise a jour le {formatDisplayDate(application.updated_at ?? application.created_at)}
                      </span>
                    </div>

                    {application.cover_letter ? <p>{application.cover_letter}</p> : null}

                    <DashboardInterviewSignalCard application={application} />

                    <div className="job-card__footer">
                      <small>{application.job_title}</small>
                      <div className="dashboard-card__badges">
                        {application.candidate_id ? (
                          <Link href={`${candidatesBasePath}/${application.candidate_id}`}>
                            Ouvrir le profil
                          </Link>
                        ) : null}
                        <Link href={`${applicationsBasePath}/${application.id}`}>
                          Ouvrir le dossier
                        </Link>
                        {application.interview_signal.latest_feedback ? (
                          <Link href={`${applicationsBasePath}/${application.id}#decision-post-entretien`}>
                            Appliquer la decision
                          </Link>
                        ) : null}
                      </div>
                    </div>
                  </article>
                ))
              ) : (
                <article className="panel list-card dashboard-card dashboard-card--empty">
                  <h3>Aucune candidature rattachee pour le moment</h3>
                  <p>Les dossiers recus sur cette offre apparaitront ici automatiquement.</p>
                </article>
              )}
            </div>
          </div>

          <div className="dashboard-form">
            <div className="dashboard-form__head">
              <div>
                <p className="eyebrow">Profils recommandes</p>
                <h2>Les candidats les plus compatibles encore non engages sur cette offre</h2>
              </div>
              <span className="tag">{suggestedCandidates.length} profil(s)</span>
            </div>

            <div className="dashboard-list">
              {suggestedCandidates.length > 0 ? (
                suggestedCandidates.map(({ candidate, match }) => (
                  <article key={candidate.id} className="panel list-card dashboard-card">
                    <div className="dashboard-card__top">
                      <div>
                        <h3>{candidate.full_name}</h3>
                        <p>{candidate.current_position || candidate.desired_position || "Profil candidat"}</p>
                      </div>
                      <div className="dashboard-card__badges">
                        <span className={`tag tag--${match.tone}`}>{match.label}</span>
                        <span className="tag tag--muted">{match.level}</span>
                      </div>
                    </div>
                    <p>{match.reason}</p>
                    <div className="job-card__meta">
                      <span>{candidate.city || "Ville non renseignee"}</span>
                      <span>{candidate.profile_completion}% profil</span>
                      <span>{candidate.has_primary_cv ? "CV principal" : "Sans CV principal"}</span>
                    </div>
                    <div className="job-card__footer">
                      <small>{match.matchedKeywords.join(", ") || "Matching actif"}</small>
                      <Link href={`${candidatesBasePath}/${candidate.id}`}>Ouvrir le profil</Link>
                    </div>
                  </article>
                ))
              ) : (
                <article className="panel list-card dashboard-card dashboard-card--empty">
                  <h3>Aucun profil recommande pour l'instant</h3>
                  <p>Le matching fera remonter ici les meilleurs candidats encore disponibles sur cette offre.</p>
                </article>
              )}
            </div>
          </div>

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
              <li>Publication : {job.published_at ? formatDisplayDate(job.published_at) : "non publiee"}</li>
            </ul>
            <div className="dashboard-action-stack">
              <Link className="btn btn-secondary btn-block" href={backHref}>
                Retour a la liste des offres
              </Link>
              {topApplication ? (
                <Link
                  className="btn btn-ghost btn-block"
                  href={`${applicationsBasePath}/${topApplication.id}`}
                >
                  Ouvrir le dossier prioritaire
                </Link>
              ) : null}
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
