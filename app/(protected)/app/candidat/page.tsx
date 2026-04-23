import Link from "next/link";

import { DashboardShell } from "@/components/dashboard/shell";
import { CandidateCvAnalysisPanel } from "@/components/profile/candidate-cv-analysis-panel";
import { CandidateCvUpload } from "@/components/profile/candidate-cv-upload";
import { CandidateProfileForm } from "@/components/profile/candidate-profile-form";
import {
  getApplicationStatusMeta,
  isFinalApplicationStatus
} from "@/lib/application-status";
import { getCandidateCvAnalysis } from "@/lib/candidate-cv-analysis";
import { getCandidateProfileInsights } from "@/lib/candidate-profile";
import { requireRole } from "@/lib/auth";
import { formatDateTimeDisplay, formatDisplayDate } from "@/lib/format";
import {
  getInterviewFormatLabel,
  getInterviewStatusMeta
} from "@/lib/interviews";
import {
  getCandidateApplicationSummaries,
  getCandidateInterviews,
  getCandidateWorkspace
} from "@/lib/jobs";
import type {
  CandidateApplicationSummary,
  CandidateInterviewScheduleItem
} from "@/lib/types";

function isAdvancedCandidateStatus(status: string) {
  return status === "shortlist" || status === "interview";
}

function getCandidateApplicationPriorityScore(application: CandidateApplicationSummary) {
  let score = 0;

  if (application.interview_signal.next_interview_at) {
    score += 280;

    const daysUntilInterview =
      (new Date(application.interview_signal.next_interview_at).getTime() - Date.now()) / 86_400_000;

    if (daysUntilInterview <= 1) {
      score += 90;
    } else if (daysUntilInterview <= 3) {
      score += 45;
    }
  }

  if (application.status === "interview") {
    score += 180;
  }

  if (application.status === "shortlist") {
    score += 120;
  }

  if (application.status === "screening") {
    score += 70;
  }

  if (application.interview_signal.interviews_count > 0) {
    score += 50;
  }

  if (!application.has_cv && !isFinalApplicationStatus(application.status)) {
    score += 35;
  }

  if (isFinalApplicationStatus(application.status)) {
    score -= 120;
  }

  return score;
}

function sortCandidateApplicationsByPriority(applications: CandidateApplicationSummary[]) {
  return [...applications].sort((left, right) => {
    const leftScore = getCandidateApplicationPriorityScore(left);
    const rightScore = getCandidateApplicationPriorityScore(right);

    if (leftScore !== rightScore) {
      return rightScore - leftScore;
    }

    return new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime();
  });
}

function buildPrioritySummary(application: CandidateApplicationSummary) {
  if (application.interview_signal.next_interview_at) {
    return {
      title: "Entretien a venir",
      body: `Prochain rendez-vous le ${formatDateTimeDisplay(application.interview_signal.next_interview_at)}.`,
      tone: "info"
    } as const;
  }

  if (application.status === "interview") {
    return {
      title: "Retour entretien attendu",
      body: "Le dossier est dans une phase avancee. Restez joignable et gardez vos disponibilites claires.",
      tone: "info"
    } as const;
  }

  if (application.status === "shortlist") {
    return {
      title: "Profil retenu",
      body: "Votre dossier fait partie des candidatures suivies de pres pour la suite du recrutement.",
      tone: "success"
    } as const;
  }

  if (!application.has_cv) {
    return {
      title: "CV a renforcer",
      body: "Ajoutez ou mettez a jour votre CV principal pour mieux soutenir vos prochaines candidatures.",
      tone: "danger"
    } as const;
  }

  if (application.interview_signal.interviews_count > 0) {
    return {
      title: "Historique disponible",
      body: `${application.interview_signal.interviews_count} entretien(s) deja rattache(s) a ce dossier.`,
      tone: "muted"
    } as const;
  }

  return {
    title: "Suivi actif",
    body: "Le dossier continue d'etre suivi automatiquement dans votre espace candidat.",
    tone: "muted"
  } as const;
}

function buildFocusCard(
  nextInterview: CandidateInterviewScheduleItem | null,
  topApplication: CandidateApplicationSummary | null
) {
  if (nextInterview) {
    return {
      eyebrow: "Priorite immediate",
      title: "Preparez votre prochain entretien",
      body: `Rendez-vous le ${formatDateTimeDisplay(nextInterview.starts_at)} pour ${nextInterview.job_title}.`,
      hint: nextInterview.notes || "Retrouvez tous les details logistiques dans le dossier candidat.",
      primaryHref: `/app/candidat/candidatures/${nextInterview.application_id}`,
      primaryLabel: "Ouvrir le dossier",
      secondaryHref: nextInterview.meeting_url,
      secondaryLabel: nextInterview.meeting_url ? "Rejoindre l'entretien" : null,
      tagLabel: getInterviewFormatLabel(nextInterview.format),
      tagTone: "info"
    } as const;
  }

  if (topApplication) {
    const status = getApplicationStatusMeta(topApplication.status);

    return {
      eyebrow: "Priorite immediate",
      title: topApplication.job_title,
      body: status.description,
      hint: status.candidateHint,
      primaryHref: `/app/candidat/candidatures/${topApplication.id}`,
      primaryLabel: "Ouvrir le dossier",
      secondaryHref: `/app/candidat/offres/${topApplication.job_slug}`,
      secondaryLabel: "Revoir l'offre",
      tagLabel: status.label,
      tagTone: "muted"
    } as const;
  }

  return {
    eyebrow: "Priorite immediate",
    title: "Activez votre recherche",
    body: "Aucune candidature n'est encore en cours. Commencez par explorer les offres correspondant a votre cible.",
    hint: "Votre cockpit candidat se remplira automatiquement des que vous commencerez a postuler.",
    primaryHref: "/app/candidat/offres",
    primaryLabel: "Explorer les offres",
    secondaryHref: "/espace/candidat",
    secondaryLabel: "Voir le parcours candidat",
    tagLabel: "Demarrage",
    tagTone: "muted"
  } as const;
}

export default async function CandidateDashboardPage() {
  const profile = await requireRole(["candidat"]);
  const [applications, candidateProfile, interviews] = await Promise.all([
    getCandidateApplicationSummaries(profile.id),
    getCandidateWorkspace(profile),
    getCandidateInterviews(profile.id, { limit: 8 })
  ]);

  const profileInsights = getCandidateProfileInsights(candidateProfile);
  const cvAnalysis = getCandidateCvAnalysis({
    ...candidateProfile,
    documentsCount: candidateProfile.recent_documents.length
  });
  const prioritizedApplications = sortCandidateApplicationsByPriority(applications);
  const topPriorityApplications = prioritizedApplications.slice(0, 4);
  const latestApplication = prioritizedApplications[0] ?? null;
  const activeApplications = applications.filter(
    (application) => !isFinalApplicationStatus(application.status)
  );
  const finalApplications = applications.filter((application) =>
    isFinalApplicationStatus(application.status)
  );
  const advancedApplications = applications.filter((application) =>
    isAdvancedCandidateStatus(application.status)
  );
  const applicationsWithInterviews = applications.filter(
    (application) => application.interview_signal.interviews_count > 0
  );
  const applicationsMissingCv = activeApplications.filter((application) => !application.has_cv);
  const priorityApplicationsCount = applications.filter(
    (application) =>
      !isFinalApplicationStatus(application.status) &&
      (Boolean(application.interview_signal.next_interview_at) ||
        isAdvancedCandidateStatus(application.status) ||
        !application.has_cv)
  ).length;
  const upcomingInterviews = interviews
    .filter((interview) => interview.status === "scheduled")
    .sort((left, right) => new Date(left.starts_at).getTime() - new Date(right.starts_at).getTime());
  const nextInterview =
    upcomingInterviews.find((interview) => new Date(interview.starts_at).getTime() >= Date.now()) ??
    upcomingInterviews[0] ??
    null;
  const focusCard = buildFocusCard(nextInterview, latestApplication);
  const latestApplicationStatus = latestApplication
    ? getApplicationStatusMeta(latestApplication.status)
    : null;
  const applicationMap = new Map(applications.map((application) => [application.id, application]));

  return (
    <DashboardShell
      title="Votre espace candidat"
      description="Pilotez vos candidatures, vos entretiens et la preparation de votre dossier depuis un cockpit candidat plus actionnable."
      profile={profile}
      currentPath="/app/candidat"
    >
      <section className="dashboard-grid dashboard-grid--four">
        <article className="panel metric-panel">
          <span>Candidatures actives</span>
          <strong>{activeApplications.length}</strong>
          <small>
            {applications.length > 0
              ? `${applications.length} dossier(s) visible(s) dans votre suivi`
              : "aucune candidature en cours"}
          </small>
        </article>
        <article className="panel metric-panel">
          <span>Dossiers prioritaires</span>
          <strong>{priorityApplicationsCount}</strong>
          <small>
            {priorityApplicationsCount > 0
              ? "entretiens, dossiers avances ou CV a renforcer"
              : "aucun point bloquant immediat"}
          </small>
        </article>
        <article className="panel metric-panel">
          <span>Profil</span>
          <strong>{profileInsights.completion}%</strong>
          <small>
            {profileInsights.completedCount}/{profileInsights.totalCount} rubriques prioritaires
          </small>
        </article>
        <article className="panel metric-panel">
          <span>Prochain entretien</span>
          <strong>{nextInterview ? formatDisplayDate(nextInterview.starts_at) : "Aucun"}</strong>
          <small>
            {nextInterview
              ? `${nextInterview.job_title} · ${getInterviewFormatLabel(nextInterview.format)}`
              : latestApplication
                ? `${latestApplicationStatus?.label ?? "Suivi actif"} · ${formatDisplayDate(latestApplication.created_at)}`
                : "postulez a une offre pour demarrer"}
          </small>
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
              <span className="tag">{priorityApplicationsCount} priorite(s)</span>
            </div>

            <div className="candidate-dashboard-action-grid">
              <article className="document-card candidate-dashboard-action-card">
                <div className="dashboard-card__top">
                  <strong>{focusCard.eyebrow}</strong>
                  <span className={`tag tag--${focusCard.tagTone}`}>{focusCard.tagLabel}</span>
                </div>
                <h3>{focusCard.title}</h3>
                <p>{focusCard.body}</p>
                <small>{focusCard.hint}</small>
                <div className="notification-card__actions">
                  <Link href={focusCard.primaryHref}>{focusCard.primaryLabel}</Link>
                  {focusCard.secondaryHref && focusCard.secondaryLabel ? (
                    <Link
                      href={focusCard.secondaryHref}
                      target={focusCard.secondaryHref.startsWith("http") ? "_blank" : undefined}
                      rel={focusCard.secondaryHref.startsWith("http") ? "noreferrer" : undefined}
                    >
                      {focusCard.secondaryLabel}
                    </Link>
                  ) : null}
                </div>
              </article>

              <article className="document-card candidate-dashboard-action-card">
                <div className="dashboard-card__top">
                  <strong>Profil candidat</strong>
                  <span className="tag tag--success">{profileInsights.completion}% complet</span>
                </div>
                <h3>{profileInsights.readinessLabel}</h3>
                <p>{profileInsights.readinessDescription}</p>
                <small>
                  {profileInsights.missingItems.length > 0
                    ? `${profileInsights.missingItems.length} rubrique(s) restent prioritaires.`
                    : "Toutes les rubriques prioritaires sont deja renseignees."}
                </small>
                <div className="notification-card__actions">
                  <Link href="#profil-candidat">Completer mon profil</Link>
                  <Link href="#cv-principal">Mettre a jour mon CV</Link>
                </div>
              </article>

              <article className="document-card candidate-dashboard-action-card">
                <div className="dashboard-card__top">
                  <strong>Couverture du pipeline</strong>
                  <span className="tag tag--muted">{applications.length} dossier(s)</span>
                </div>
                <h3>
                  {advancedApplications.length > 0
                    ? `${advancedApplications.length} dossier(s) en phase avancee`
                    : "Pipeline encore leger"}
                </h3>
                <p>
                  {applicationsWithInterviews.length > 0
                    ? `${applicationsWithInterviews.length} dossier(s) ont deja au moins un entretien.`
                    : "Aucun historique d'entretien pour le moment."}
                </p>
                <small>
                  {applicationsMissingCv.length > 0
                    ? `${applicationsMissingCv.length} dossier(s) actifs sans CV joint.`
                    : "Tous les dossiers actifs disposent deja d'un CV joint ou d'un profil exploitable."}
                </small>
                <div className="notification-card__actions">
                  <Link href="/app/candidat/candidatures">Ouvrir mes candidatures</Link>
                  <Link href="/app/candidat/documents">Voir mes documents</Link>
                </div>
              </article>
            </div>

            <div className="candidate-dashboard-summary-strip">
              <article className="document-card candidate-dashboard-summary-item">
                <strong>{activeApplications.length}</strong>
                <p>dossier(s) encore actifs</p>
              </article>
              <article className="document-card candidate-dashboard-summary-item">
                <strong>{advancedApplications.length}</strong>
                <p>shortlist ou entretiens</p>
              </article>
              <article className="document-card candidate-dashboard-summary-item">
                <strong>{upcomingInterviews.length}</strong>
                <p>entretien(s) planifie(s)</p>
              </article>
              <article className="document-card candidate-dashboard-summary-item">
                <strong>{finalApplications.length}</strong>
                <p>dossier(s) finalise(s)</p>
              </article>
            </div>
          </div>

          <CandidateCvAnalysisPanel
            analysis={cvAnalysis}
            eyebrow="Lecture dossier"
            title="Analyse simple du CV et du profil"
          />

          <div className="dashboard-section">
            <div className="dashboard-section__head">
              <div>
                <p className="eyebrow">Dossiers prioritaires</p>
                <h2>Commencez par les candidatures qui bougent</h2>
              </div>
              <Link className="text-link" href="/app/candidat/candidatures">
                Voir tout mon suivi
              </Link>
            </div>

            <div className="dashboard-list">
              {topPriorityApplications.length > 0 ? (
                topPriorityApplications.map((application) => {
                  const status = getApplicationStatusMeta(application.status);
                  const prioritySummary = buildPrioritySummary(application);
                  const latestInterviewStatus = application.interview_signal.latest_interview_status
                    ? getInterviewStatusMeta(application.interview_signal.latest_interview_status)
                    : null;

                  return (
                    <article key={application.id} className="panel list-card dashboard-card">
                      <div className="dashboard-card__top">
                        <div>
                          <h3>{application.job_title}</h3>
                          <p>{application.organization_name || "Organisation"}</p>
                        </div>
                        <div className="dashboard-card__badges">
                          <span className="tag">{status.label}</span>
                          {application.interview_signal.next_interview_format ? (
                            <span className="tag tag--info">
                              {getInterviewFormatLabel(application.interview_signal.next_interview_format)}
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <p>
                        {application.interview_signal.next_interview_at
                          ? `Prochain entretien le ${formatDateTimeDisplay(application.interview_signal.next_interview_at)}.`
                          : status.description}
                      </p>

                      <div className="job-card__meta">
                        <span>Soumise le {formatDisplayDate(application.created_at)}</span>
                        <span>{application.job_location || "Localisation a confirmer"}</span>
                        <span>{application.contract_type}</span>
                        <span>{application.work_mode}</span>
                      </div>

                      <div className="application-signal-card">
                        <strong>{prioritySummary.title}</strong>
                        <p>{prioritySummary.body}</p>
                        <small>
                          {application.has_cv
                            ? "CV principal ou document joint deja present sur ce dossier."
                            : "Ajoutez un CV principal a jour pour mieux soutenir vos prochains dossiers."}
                        </small>
                        <div className="job-card__meta">
                          <span>{application.interview_signal.interviews_count} entretien(s)</span>
                          {latestInterviewStatus ? (
                            <span>{latestInterviewStatus.label}</span>
                          ) : (
                            <span>Aucun entretien pour le moment</span>
                          )}
                        </div>
                      </div>

                      <div className="job-card__footer">
                        <small>{status.candidateHint}</small>
                        <div className="notification-card__actions">
                          <Link href={`/app/candidat/candidatures/${application.id}`}>
                            Ouvrir le dossier
                          </Link>
                          <Link href={`/app/candidat/offres/${application.job_slug}`}>
                            Revoir l'offre
                          </Link>
                          {application.interview_signal.next_interview_meeting_url ? (
                            <Link
                              href={application.interview_signal.next_interview_meeting_url}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Rejoindre
                            </Link>
                          ) : null}
                        </div>
                      </div>
                    </article>
                  );
                })
              ) : (
                <article className="panel list-card dashboard-card dashboard-card--empty">
                  <h3>Aucune priorite immediate</h3>
                  <p>Vos prochaines actions apparaitront ici a mesure que vos candidatures avanceront.</p>
                </article>
              )}
            </div>
          </div>

          <div className="dashboard-section">
            <div className="dashboard-section__head">
              <div>
                <p className="eyebrow">Entretiens</p>
                <h2>Rendez-vous a venir</h2>
              </div>
              <Link className="text-link" href="/app/candidat/candidatures">
                Ouvrir mon suivi candidat
              </Link>
            </div>

            <div className="dashboard-list">
              {upcomingInterviews.length > 0 ? (
                upcomingInterviews.slice(0, 3).map((interview) => {
                  const interviewStatus = getInterviewStatusMeta(interview.status);
                  const application = applicationMap.get(interview.application_id) ?? null;
                  const applicationStatus = application
                    ? getApplicationStatusMeta(application.status)
                    : null;

                  return (
                    <article key={interview.id} className="panel list-card dashboard-card">
                      <div className="dashboard-card__top">
                        <div>
                          <h3>{interview.job_title}</h3>
                          <p>{interview.organization_name}</p>
                        </div>
                        <div className="dashboard-card__badges">
                          <span className={`tag tag--${interviewStatus.tone}`}>{interviewStatus.label}</span>
                          <span className="tag tag--info">{getInterviewFormatLabel(interview.format)}</span>
                        </div>
                      </div>

                      <p>Entretien planifie le {formatDateTimeDisplay(interview.starts_at)}.</p>

                      <div className="job-card__meta">
                        {interview.location ? <span>{interview.location}</span> : null}
                        <span>{interview.timezone}</span>
                        {applicationStatus ? <span>{applicationStatus.label}</span> : null}
                      </div>

                      <div className="application-signal-card">
                        <strong>Preparation recommandee</strong>
                        <p>
                          {interview.notes || "Relisez l'offre, preparez vos exemples concrets et verifiez votre acces au rendez-vous."}
                        </p>
                        <small>
                          {applicationStatus?.candidateHint ??
                            "Retrouvez tous les details du rendez-vous dans votre dossier candidat."}
                        </small>
                      </div>

                      <div className="job-card__footer">
                        <small>Le dossier complet reste accessible avant et apres le rendez-vous.</small>
                        <div className="notification-card__actions">
                          <Link href={`/app/candidat/candidatures/${interview.application_id}`}>
                            Ouvrir le dossier
                          </Link>
                          {interview.meeting_url ? (
                            <Link href={interview.meeting_url} target="_blank" rel="noreferrer">
                              Rejoindre
                            </Link>
                          ) : null}
                        </div>
                      </div>
                    </article>
                  );
                })
              ) : (
                <article className="panel list-card dashboard-card dashboard-card--empty">
                  <h3>Aucun entretien planifie pour le moment</h3>
                  <p>Lorsqu'un recruteur planifiera un rendez-vous, il apparaitra ici automatiquement.</p>
                </article>
              )}
            </div>
          </div>
        </div>

        <aside className="dashboard-column dashboard-column--aside">
          <div className="panel dashboard-sidecard">
            <p className="eyebrow">Plan d'action</p>
            <h2>{profileInsights.readinessLabel}</h2>
            <p className="form-caption">{profileInsights.readinessDescription}</p>
            <ul className="dashboard-mini-list">
              {profileInsights.nextActions.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <div className="dashboard-action-stack">
              <Link className="btn btn-primary btn-block" href="#profil-candidat">
                Completer mon profil
              </Link>
              <Link className="btn btn-secondary btn-block" href="#cv-principal">
                Mettre a jour mon CV
              </Link>
              <Link className="btn btn-secondary btn-block" href="/app/candidat/documents">
                Ouvrir mes documents
              </Link>
              <Link className="btn btn-secondary btn-block" href="/app/candidat/candidatures">
                Voir mes candidatures
              </Link>
            </div>
          </div>

          <div id="cv-principal">
            <CandidateCvUpload
              currentDocument={candidateProfile.primary_cv}
              recentDocuments={candidateProfile.recent_documents}
            />
          </div>

          <div id="profil-candidat">
            <CandidateProfileForm profile={candidateProfile} />
          </div>
        </aside>
      </section>
    </DashboardShell>
  );
}
