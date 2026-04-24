import Link from "next/link";

import { CandidateCvAnalysisPanel } from "@/components/profile/candidate-cv-analysis-panel";
import { getCandidateCvAnalysis } from "@/lib/candidate-cv-analysis";
import { getApplicationStatusMeta } from "@/lib/application-status";
import { MatchBreakdown } from "@/components/jobs/match-breakdown";
import { DashboardShell } from "@/components/dashboard/shell";
import { formatDateTimeDisplay, formatDisplayDate, formatFileSize } from "@/lib/format";
import {
  getInterviewFormatLabel,
  getInterviewNextActionLabel,
  getInterviewProposedDecisionMeta,
  getInterviewRecommendationMeta,
  getInterviewStatusMeta
} from "@/lib/interviews";
import type { JobMatchResult, MatchableJob } from "@/lib/matching";
import type { CandidateDetail, Profile } from "@/lib/types";

type CandidateDetailWorkspaceProps = {
  profile: Profile;
  candidate: CandidateDetail;
  suggestedJobMatches: Array<{
    job: MatchableJob;
    match: JobMatchResult;
  }>;
  currentPath: string;
  backHref: string;
};

function formatDesiredSalary(candidate: CandidateDetail) {
  if (!candidate.desired_salary_min) {
    return "Non renseignee";
  }

  return `A partir de ${new Intl.NumberFormat("fr-FR").format(candidate.desired_salary_min)} ${candidate.desired_salary_currency}/mois`;
}

export function CandidateDetailWorkspace({
  profile,
  candidate,
  suggestedJobMatches,
  currentPath,
  backHref
}: CandidateDetailWorkspaceProps) {
  const applicationsBasePath =
    profile.role === "admin" ? "/app/admin/candidatures" : "/app/recruteur/candidatures";
  const offersBasePath = profile.role === "admin" ? "/app/admin/offres" : "/app/recruteur/offres";
  const nextInterview = candidate.next_interview;
  const latestFeedback = candidate.latest_feedback;
  const latestFeedbackRecommendation = latestFeedback
    ? getInterviewRecommendationMeta(latestFeedback.recommendation)
    : null;
  const latestFeedbackDecision = latestFeedback
    ? getInterviewProposedDecisionMeta(latestFeedback.proposed_decision)
    : null;
  const cvAnalysis = getCandidateCvAnalysis(candidate);

  return (
    <DashboardShell
      title={candidate.full_name}
      description="Consultez le profil, les dossiers, les entretiens et les signaux de traitement depuis une seule fiche candidat."
      profile={profile}
      currentPath={currentPath}
    >
      <section className="dashboard-grid dashboard-grid--four">
        <article className="panel metric-panel">
          <span>Profil</span>
          <strong>{candidate.profile_completion}%</strong>
          <small>niveau de completion du profil</small>
        </article>
        <article className="panel metric-panel">
          <span>Candidatures</span>
          <strong>{candidate.applications.length}</strong>
          <small>dossiers rattaches a ce candidat</small>
        </article>
        <article className="panel metric-panel">
          <span>Pipeline actif</span>
          <strong>{candidate.pipeline_summary.active}</strong>
          <small>{candidate.pipeline_summary.final} dossier(s) finalise(s)</small>
        </article>
        <article className="panel metric-panel">
          <span>Prochain entretien</span>
          <strong>{nextInterview ? formatDisplayDate(nextInterview.starts_at) : "Aucun"}</strong>
          <small>
            {nextInterview
              ? `${nextInterview.job_title} · ${getInterviewFormatLabel(nextInterview.format)}`
              : "aucun rendez-vous planifie"}
          </small>
        </article>
      </section>

      <section className="dashboard-workspace">
        <div className="dashboard-column">
          <div className="dashboard-form">
            <div className="dashboard-form__head">
              <div>
                <p className="eyebrow">Profil candidat</p>
                <h2>Vue transverse du candidat</h2>
              </div>
              <span className="tag">{candidate.current_position || "Profil Madajob"}</span>
            </div>

            <div className="job-card__meta">
              {candidate.email ? <span>{candidate.email}</span> : null}
              {candidate.phone ? <span>{candidate.phone}</span> : null}
              {candidate.city ? <span>{candidate.city}</span> : null}
              <span>{candidate.country}</span>
            </div>

            {candidate.headline ? <p>{candidate.headline}</p> : null}
            {candidate.bio ? <p className="form-caption">{candidate.bio}</p> : null}

            <div className="form-grid">
              <div className="document-card">
                <strong>Poste actuel</strong>
                <p>{candidate.current_position || "Non renseigne"}</p>
              </div>
              <div className="document-card">
                <strong>Poste recherche</strong>
                <p>{candidate.desired_position || "Non renseigne"}</p>
              </div>
            </div>

            <div className="form-grid">
              <div className="document-card">
                <strong>Experience</strong>
                <p>
                  {candidate.experience_years !== null
                    ? `${candidate.experience_years} an(s)`
                    : "Non renseignee"}
                </p>
              </div>
              <div className="document-card">
                <strong>Ville</strong>
                <p>{candidate.city || "Non renseignee"}</p>
              </div>
            </div>

            <div className="form-grid">
              <div className="document-card">
                <strong>Contrat souhaite</strong>
                <p>{candidate.desired_contract_type || "Non renseigne"}</p>
              </div>
              <div className="document-card">
                <strong>Mode souhaite</strong>
                <p>{candidate.desired_work_mode || "Non renseigne"}</p>
              </div>
              <div className="document-card">
                <strong>Remuneration souhaitee</strong>
                <p>{formatDesiredSalary(candidate)}</p>
              </div>
            </div>

            {candidate.skills_text ? (
              <div className="document-card">
                <strong>Competences clefs</strong>
                <p>{candidate.skills_text}</p>
              </div>
            ) : null}

            {candidate.cv_text ? (
              <div className="document-card">
                <strong>Resume CV</strong>
                <p>{candidate.cv_text}</p>
              </div>
            ) : null}
          </div>

          <CandidateCvAnalysisPanel
            analysis={cvAnalysis}
            eyebrow="Lecture dossier"
            title="Analyse simple du CV et du positionnement"
          />

          <div className="dashboard-form">
            <div className="dashboard-form__head">
              <div>
                <p className="eyebrow">Pipeline</p>
                <h2>Etat consolide des dossiers</h2>
              </div>
              <span className="tag">{candidate.pipeline_summary.active} actif(s)</span>
            </div>

            <div className="form-grid">
              <div className="document-card">
                <strong>Soumises</strong>
                <p>{candidate.pipeline_summary.submitted}</p>
              </div>
              <div className="document-card">
                <strong>En etude</strong>
                <p>{candidate.pipeline_summary.screening}</p>
              </div>
              <div className="document-card">
                <strong>Shortlist</strong>
                <p>{candidate.pipeline_summary.shortlist}</p>
              </div>
              <div className="document-card">
                <strong>Entretiens</strong>
                <p>{candidate.pipeline_summary.interview}</p>
              </div>
              <div className="document-card">
                <strong>Retenues</strong>
                <p>{candidate.pipeline_summary.hired}</p>
              </div>
              <div className="document-card">
                <strong>Non retenues</strong>
                <p>{candidate.pipeline_summary.rejected}</p>
              </div>
            </div>
          </div>

          <div className="dashboard-form">
            <div className="dashboard-form__head">
              <div>
                <p className="eyebrow">Candidatures</p>
                <h2>Historique des dossiers</h2>
              </div>
              <span className="tag">{candidate.applications.length} dossier(s)</span>
            </div>

            <div className="dashboard-list">
              {candidate.applications.length > 0 ? (
                candidate.applications.map((application) => {
                  const statusMeta = getApplicationStatusMeta(application.status);

                  return (
                    <article key={application.id} className="panel list-card dashboard-card">
                      <div className="dashboard-card__top">
                        <div>
                          <h3>{application.job_title}</h3>
                          <p>{statusMeta.description}</p>
                        </div>
                        <span className="tag">{statusMeta.label}</span>
                      </div>
                      <div className="job-card__meta">
                        <span>{application.organization_name}</span>
                        <span>{application.job_location}</span>
                        <span>{application.contract_type}</span>
                        <span>{application.has_cv ? "CV joint" : "CV non joint"}</span>
                      </div>
                      {application.cover_letter ? <p>{application.cover_letter}</p> : null}
                      <div className="job-card__footer">
                        <small>
                          Soumis le {formatDisplayDate(application.created_at)}
                          {application.notes_count > 0 ? ` · ${application.notes_count} note(s)` : ""}
                        </small>
                        <Link href={`${applicationsBasePath}/${application.id}`}>Ouvrir le dossier</Link>
                      </div>
                    </article>
                  );
                })
              ) : (
                <article className="panel list-card dashboard-card dashboard-card--empty">
                  <h3>Aucune candidature disponible</h3>
                  <p>Ce candidat n'a pas encore de dossier visible dans votre perimetre.</p>
                </article>
              )}
            </div>
          </div>

          <div className="dashboard-form">
            <div className="dashboard-form__head">
              <div>
                <p className="eyebrow">Entretiens</p>
                <h2>Derniers echanges et feedbacks</h2>
              </div>
              <span className="tag">{candidate.recent_interviews.length} entretien(s)</span>
            </div>

            <div className="dashboard-list">
              {candidate.recent_interviews.length > 0 ? (
                candidate.recent_interviews.map((interview) => {
                  const interviewStatus = getInterviewStatusMeta(interview.status);
                  const recommendation = interview.feedback
                    ? getInterviewRecommendationMeta(interview.feedback.recommendation)
                    : null;
                  const proposedDecision = interview.feedback
                    ? getInterviewProposedDecisionMeta(interview.feedback.proposed_decision)
                    : null;

                  return (
                    <article key={interview.id} className="panel list-card dashboard-card">
                      <div className="dashboard-card__top">
                        <div>
                          <h3>{interview.job_title}</h3>
                          <p>{formatDateTimeDisplay(interview.starts_at)}</p>
                        </div>
                        <div className="dashboard-card__badges">
                          <span className={`tag tag--${interviewStatus.tone}`}>{interviewStatus.label}</span>
                          {recommendation ? (
                            <span className={`tag tag--${recommendation.tone}`}>{recommendation.label}</span>
                          ) : null}
                        </div>
                      </div>

                      <div className="job-card__meta">
                        <span>{interview.organization_name}</span>
                        <span>{getInterviewFormatLabel(interview.format)}</span>
                        <span>{interview.interviewer_name}</span>
                      </div>

                      {interview.feedback ? (
                        <>
                          <p>{interview.feedback.summary}</p>
                          <small>
                            {proposedDecision?.label ?? "Decision"} ·{" "}
                            {getInterviewNextActionLabel(interview.feedback.next_action)}
                          </small>
                        </>
                      ) : interview.status === "completed" ? (
                        <p className="form-caption">Entretien termine sans compte-rendu saisi pour l'instant.</p>
                      ) : (
                        <p className="form-caption">Entretien planifie ou encore en cours de traitement.</p>
                      )}

                      <div className="job-card__footer">
                        <small>{getApplicationStatusMeta(interview.application_status).label}</small>
                        <Link href={`${applicationsBasePath}/${interview.application_id}`}>
                          Ouvrir le dossier
                        </Link>
                      </div>
                    </article>
                  );
                })
              ) : (
                <article className="panel list-card dashboard-card dashboard-card--empty">
                  <h3>Aucun entretien rattache</h3>
                  <p>Les echanges planifies sur les dossiers de ce candidat apparaitront ici.</p>
                </article>
              )}
            </div>
          </div>

          <div className="dashboard-form">
            <div className="dashboard-form__head">
              <div>
                <p className="eyebrow">Matching</p>
                <h2>Offres les plus compatibles avec ce profil</h2>
              </div>
              <span className="tag">{suggestedJobMatches.length} suggestion(s)</span>
            </div>

            <div className="dashboard-list">
              {suggestedJobMatches.length > 0 ? (
                suggestedJobMatches.map(({ job, match }) => (
                  <article key={job.id} className="panel list-card dashboard-card">
                    <div className="dashboard-card__top">
                      <div>
                        <h3>{job.title}</h3>
                        <p>{job.organization_name || "Madajob"}</p>
                      </div>
                      <div className="dashboard-card__badges">
                        <span className={`tag tag--${match.tone}`}>{match.label}</span>
                        <span className="tag tag--muted">{match.level}</span>
                      </div>
                    </div>
                    <p>{match.reason}</p>
                    <MatchBreakdown match={match} compact />
                    <div className="job-card__meta">
                      <span>{job.location}</span>
                      <span>{job.contract_type}</span>
                      <span>{job.work_mode}</span>
                      <span>{job.sector}</span>
                    </div>
                    <div className="job-card__footer">
                      <small>{match.nextStep}</small>
                      <Link href={`${offersBasePath}/${job.id}`}>Ouvrir l'offre</Link>
                    </div>
                  </article>
                ))
              ) : (
                <article className="panel list-card dashboard-card dashboard-card--empty">
                  <h3>Pas encore de matching exploitable</h3>
                  <p>Completez davantage le profil candidat pour faire remonter des offres plus precises.</p>
                </article>
              )}
            </div>
          </div>

          <div className="dashboard-form">
            <div className="dashboard-form__head">
              <div>
                <p className="eyebrow">Notes recentes</p>
                <h2>Retours consolides sur ce candidat</h2>
              </div>
              <span className="tag">{candidate.recent_notes.length} note(s)</span>
            </div>

            <div className="dashboard-list">
              {candidate.recent_notes.length > 0 ? (
                candidate.recent_notes.map((note) => (
                  <article key={note.id} className="panel list-card dashboard-card">
                    <div className="dashboard-card__top">
                      <h3>{note.author_name}</h3>
                      <span className="tag">{formatDisplayDate(note.created_at)}</span>
                    </div>
                    <p>{note.body}</p>
                    <small>Dossier : {note.application_id}</small>
                  </article>
                ))
              ) : (
                <article className="panel list-card dashboard-card dashboard-card--empty">
                  <h3>Aucune note recente</h3>
                  <p>Les notes internes ajoutees sur les dossiers de ce candidat remonteront ici.</p>
                </article>
              )}
            </div>
          </div>
        </div>

        <aside className="dashboard-column dashboard-column--aside">
          <div className="panel dashboard-sidecard">
            <p className="eyebrow">Navigation</p>
            <h2>Travaillez ce profil sans quitter la plateforme.</h2>
            <div className="dashboard-action-stack">
              <Link className="btn btn-secondary btn-block" href={backHref}>
                Retour a la base candidats
              </Link>
              {candidate.applications[0] ? (
                <Link
                  className="btn btn-ghost btn-block"
                  href={`${applicationsBasePath}/${candidate.applications[0].id}`}
                >
                  Ouvrir le dernier dossier
                </Link>
              ) : null}
            </div>
          </div>

          <div className="dashboard-form">
            <div className="dashboard-form__head">
              <div>
                <p className="eyebrow">Signal RH</p>
                <h2>Lecture rapide du profil</h2>
              </div>
            </div>

            <div className="dashboard-list">
              <article className="document-card">
                <strong>Prochain entretien</strong>
                <p>
                  {nextInterview
                    ? `${formatDateTimeDisplay(nextInterview.starts_at)} · ${nextInterview.job_title}`
                    : "Aucun entretien planifie."}
                </p>
              </article>

              <article className="document-card">
                <strong>Derniere recommandation</strong>
                <p>
                  {latestFeedback
                    ? `${latestFeedbackRecommendation?.label ?? "Feedback"} · ${latestFeedbackDecision?.label ?? "Decision"}`
                    : "Aucun feedback d'entretien consolide."}
                </p>
                {latestFeedback ? (
                  <small>{getInterviewNextActionLabel(latestFeedback.next_action)}</small>
                ) : null}
              </article>
            </div>
          </div>

          <div className="dashboard-form">
            <div className="dashboard-form__head">
              <div>
                <p className="eyebrow">CV principal</p>
                <h2>Document de reference du candidat</h2>
              </div>
              <span className="tag">{candidate.primary_cv ? "Disponible" : "Absent"}</span>
            </div>

            {candidate.primary_cv ? (
              <div className="document-card">
                <strong>{candidate.primary_cv.file_name}</strong>
                <div className="document-meta">
                  <span>{formatFileSize(candidate.primary_cv.file_size)}</span>
                  <span>Ajoute le {formatDisplayDate(candidate.primary_cv.created_at)}</span>
                </div>
                {candidate.primary_cv_download_url ? (
                  <a
                    className="btn btn-primary btn-block"
                    href={candidate.primary_cv_download_url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Ouvrir le CV principal
                  </a>
                ) : null}
              </div>
            ) : (
              <p className="form-caption">Aucun CV principal n'est disponible sur ce profil.</p>
            )}
          </div>
        </aside>
      </section>
    </DashboardShell>
  );
}
