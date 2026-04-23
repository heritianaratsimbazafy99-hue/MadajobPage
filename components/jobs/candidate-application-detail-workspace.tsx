import Link from "next/link";

import { getApplicationStatusMeta, isFinalApplicationStatus } from "@/lib/application-status";
import { formatDateTimeDisplay, formatDisplayDate, formatFileSize } from "@/lib/format";
import { getInterviewFormatLabel, getInterviewStatusMeta } from "@/lib/interviews";
import type {
  ApplicationInterview,
  CandidateApplicationDetail,
  CandidateApplicationHistoryEntry,
  Profile
} from "@/lib/types";
import { DashboardShell } from "@/components/dashboard/shell";

type CandidateApplicationDetailWorkspaceProps = {
  profile: Profile;
  application: CandidateApplicationDetail;
};

type TimelineEntry = CandidateApplicationHistoryEntry & {
  isInitial: boolean;
};

type JourneyEntry = {
  id: string;
  kind: "status" | "interview";
  occurredAt: string;
  title: string;
  description: string;
  note: string | null;
  meta: string[];
  tagLabel: string;
  tagTone: "info" | "success" | "danger" | "muted" | null;
  actionHref: string | null;
  actionLabel: string | null;
};

type NextStepSummary = {
  metricValue: string;
  metricHint: string;
  title: string;
  body: string;
  tagLabel: string;
  tagTone: "info" | "success" | "danger" | "muted" | null;
};

const defaultStageSteps = ["submitted", "screening", "shortlist", "interview", "hired"];
const rejectedStageSteps = ["submitted", "screening", "shortlist", "interview", "rejected"];

function buildTimeline(application: CandidateApplicationDetail) {
  const hasInitialEntry = application.status_history.some(
    (entry) => entry.from_status === null && entry.to_status === "submitted"
  );

  const entries: TimelineEntry[] = application.status_history.map((entry) => ({
    ...entry,
    isInitial: false
  }));

  if (!hasInitialEntry) {
    entries.push({
      id: `${application.id}-submitted`,
      from_status: null,
      to_status: "submitted",
      note: null,
      created_at: application.created_at,
      isInitial: true
    });
  }

  return entries.sort(
    (left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime()
  );
}

function getUpcomingInterview(interviews: ApplicationInterview[]) {
  const scheduled = interviews
    .filter((interview) => interview.status === "scheduled")
    .sort((left, right) => new Date(left.starts_at).getTime() - new Date(right.starts_at).getTime());

  return scheduled.find((interview) => new Date(interview.starts_at).getTime() >= Date.now()) ?? scheduled[0] ?? null;
}

function getLatestInterview(interviews: ApplicationInterview[]) {
  return [...interviews].sort(
    (left, right) => new Date(right.starts_at).getTime() - new Date(left.starts_at).getTime()
  )[0] ?? null;
}

function getStageSteps(status: string) {
  return status === "rejected" ? rejectedStageSteps : defaultStageSteps;
}

function getStageState(currentStatus: string, step: string) {
  const steps = getStageSteps(currentStatus);
  const currentIndex = steps.indexOf(currentStatus);
  const stepIndex = steps.indexOf(step);

  if (step === currentStatus) {
    return "current";
  }

  if (currentIndex === -1 || stepIndex === -1) {
    return "future";
  }

  return stepIndex < currentIndex ? "done" : "future";
}

function buildJourney(application: CandidateApplicationDetail, timeline: TimelineEntry[]): JourneyEntry[] {
  const statusEntries: JourneyEntry[] = timeline.map((entry) => {
    const statusMeta = getApplicationStatusMeta(entry.to_status);
    const previousStatus = entry.from_status ? getApplicationStatusMeta(entry.from_status) : null;
    const tagTone: JourneyEntry["tagTone"] = isFinalApplicationStatus(entry.to_status) ? "muted" : "info";
    const meta: string[] = [statusMeta.candidateHint];

    return {
      id: `status-${entry.id}`,
      kind: "status" as const,
      occurredAt: entry.created_at,
      title: statusMeta.label,
      description: entry.isInitial
        ? "Votre candidature a ete enregistree sur la plateforme."
        : previousStatus
          ? `Passage de ${previousStatus.label} a ${statusMeta.label}.`
          : statusMeta.description,
      note: entry.note,
      meta,
      tagLabel: "Statut",
      tagTone,
      actionHref: null,
      actionLabel: null
    };
  });

  const interviewEntries: JourneyEntry[] = application.interviews.map((interview) => {
    const interviewStatus = getInterviewStatusMeta(interview.status);
    const tagTone: JourneyEntry["tagTone"] =
      interview.status === "completed"
        ? "success"
        : interview.status === "cancelled"
          ? "danger"
          : "info";

    return {
      id: `interview-${interview.id}`,
      kind: "interview" as const,
      occurredAt: interview.starts_at,
      title: `${getInterviewFormatLabel(interview.format)} - ${interviewStatus.label}`,
      description:
        interview.status === "cancelled"
          ? `Le rendez-vous prevu le ${formatDateTimeDisplay(interview.starts_at)} a ete annule.`
          : interview.status === "completed"
            ? `Cet entretien a eu lieu le ${formatDateTimeDisplay(interview.starts_at)}.`
            : `Entretien planifie le ${formatDateTimeDisplay(interview.starts_at)}.`,
      note: interview.notes,
      meta: [interview.interviewer_name, interview.location, interview.timezone].filter(
        (value): value is string => Boolean(value)
      ),
      tagLabel: "Entretien",
      tagTone,
      actionHref: interview.status === "scheduled" ? interview.meeting_url : null,
      actionLabel: interview.status === "scheduled" && interview.meeting_url ? "Rejoindre" : null
    };
  });

  return [...statusEntries, ...interviewEntries].sort(
    (left, right) => new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime()
  );
}

function getNextStepSummary(
  application: CandidateApplicationDetail,
  upcomingInterview: ApplicationInterview | null,
  latestInterview: ApplicationInterview | null
): NextStepSummary {
  const currentStatus = getApplicationStatusMeta(application.status);

  if (application.status === "hired") {
    return {
      metricValue: "Retenue",
      metricHint: "dossier finalise positivement",
      title: "Votre candidature est retenue",
      body: "Surveillez vos messages pour la suite administrative, les documents a transmettre et les prochains echanges avec l'equipe.",
      tagLabel: "Issue positive",
      tagTone: "success"
    };
  }

  if (application.status === "rejected") {
    return {
      metricValue: "Cloturee",
      metricHint: "processus termine sur cette offre",
      title: "Le dossier est finalise",
      body: "Cette offre ne se poursuit plus, mais votre espace candidat reste disponible pour suivre d'autres opportunites.",
      tagLabel: "Processus clos",
      tagTone: "muted"
    };
  }

  if (upcomingInterview) {
    return {
      metricValue: formatDisplayDate(upcomingInterview.starts_at),
      metricHint: `${getInterviewFormatLabel(upcomingInterview.format)} planifie`,
      title: "Votre prochain entretien est deja planifie",
      body: `Rendez-vous le ${formatDateTimeDisplay(upcomingInterview.starts_at)}. Pensez a relire l'offre, verifier votre disponibilite et preparer vos exemples concrets.`,
      tagLabel: "Entretien a venir",
      tagTone: "info"
    };
  }

  if (application.status === "interview" && latestInterview) {
    return {
      metricValue: "Retour attendu",
      metricHint: "entretien realise ou en cours de validation",
      title: "Un retour est attendu apres votre entretien",
      body: "Votre dossier reste actif. Gardez votre telephone et votre email disponibles pour la suite du processus.",
      tagLabel: "Suivi en cours",
      tagTone: "info"
    };
  }

  if (application.status === "shortlist") {
    return {
      metricValue: "Shortlist",
      metricHint: "profil retenu pour la suite",
      title: "Votre dossier reste dans les profils suivis de pres",
      body: "Le recruteur peut vous recontacter pour un entretien, une precision supplementaire ou une confirmation de disponibilite.",
      tagLabel: "Dossier prioritaire",
      tagTone: "info"
    };
  }

  if (application.status === "screening") {
    return {
      metricValue: "Analyse",
      metricHint: "profil en cours d'etude",
      title: "Votre dossier est en cours d'analyse",
      body: "Aucune action urgente n'est necessaire. Le plus utile est de garder vos coordonnees et votre CV a jour pendant l'etude du dossier.",
      tagLabel: "En cours d'etude",
      tagTone: "muted"
    };
  }

  return {
    metricValue: currentStatus.label,
    metricHint: "suivi automatique du dossier",
    title: "Votre candidature est bien enregistree",
    body: "Le suivi du dossier se mettra a jour automatiquement ici au fur et a mesure des prochaines etapes.",
    tagLabel: "Depot confirme",
    tagTone: "muted"
  };
}

function getChecklistItems(
  application: CandidateApplicationDetail,
  upcomingInterview: ApplicationInterview | null
) {
  if (application.status === "hired") {
    return [
      "Surveillez votre email pour la suite administrative et les documents a transmettre.",
      "Gardez vos disponibilites a jour en cas de prise de contact rapide.",
      "Conservez une copie de votre CV et des documents deja transmis."
    ];
  }

  if (application.status === "rejected") {
    return [
      "Continuez a suivre vos autres candidatures actives depuis votre espace.",
      "Mettez a jour votre CV principal si vous ciblez de nouvelles offres.",
      "Revenez regulierement sur les offres proches de votre projet."
    ];
  }

  if (upcomingInterview) {
    return [
      "Verifiez votre connexion, votre lien de visio ou le lieu de rendez-vous au moins 15 minutes avant.",
      "Relisez l'offre et preparez 2 ou 3 exemples concrets de missions ou resultats.",
      application.has_cv
        ? "Gardez votre CV et vos notes a portee de main pendant l'entretien."
        : "Pensez a completer votre CV principal pour vos prochaines opportunites."
    ];
  }

  if (application.status === "interview" || application.status === "shortlist") {
    return [
      "Gardez votre telephone et votre email disponibles pour une prise de contact rapide.",
      "Preparez vos disponibilites pour un eventuel prochain echange.",
      "Relisez l'offre et consolidez vos exemples d'experience en lien avec le poste."
    ];
  }

  if (application.status === "screening") {
    return [
      "Aucune action urgente n'est requise pour le moment.",
      "Maintenez votre profil et votre CV a jour.",
      "Continuez a suivre les offres qui correspondent a votre cible."
    ];
  }

  return [
    "Votre dossier est bien depose et suivi automatiquement.",
    "Verifiez regulierement vos messages et vos appels.",
    "Continuez a mettre votre profil candidat a jour."
  ];
}

export function CandidateApplicationDetailWorkspace({
  profile,
  application
}: CandidateApplicationDetailWorkspaceProps) {
  const currentStatus = getApplicationStatusMeta(application.status);
  const timeline = buildTimeline(application);
  const journey = buildJourney(application, timeline);
  const upcomingInterview = getUpcomingInterview(application.interviews);
  const latestInterview = getLatestInterview(application.interviews);
  const nextStep = getNextStepSummary(application, upcomingInterview, latestInterview);
  const checklistItems = getChecklistItems(application, upcomingInterview);
  const stageSteps = getStageSteps(application.status);

  return (
    <DashboardShell
      title={application.job.title}
      description="Suivez votre candidature, son historique et le CV rattache depuis votre espace candidat."
      profile={profile}
      currentPath="/app/candidat/candidatures"
    >
      <section className="dashboard-grid dashboard-grid--four">
        <article className="panel metric-panel">
          <span>Statut</span>
          <strong>{currentStatus.label}</strong>
          <small>etat actuel de votre dossier</small>
        </article>
        <article className="panel metric-panel">
          <span>Prochain cap</span>
          <strong>{nextStep.metricValue}</strong>
          <small>{nextStep.metricHint}</small>
        </article>
        <article className="panel metric-panel">
          <span>Entretiens</span>
          <strong>{application.interviews.length}</strong>
          <small>
            {upcomingInterview
              ? `prochain le ${formatDisplayDate(upcomingInterview.starts_at)}`
              : application.interviews.length > 0
                ? "historique disponible"
                : "aucun rendez-vous planifie"}
          </small>
        </article>
        <article className="panel metric-panel">
          <span>Derniere mise a jour</span>
          <strong>{formatDisplayDate(application.updated_at)}</strong>
          <small>suivi actualise automatiquement</small>
        </article>
      </section>

      <section className="dashboard-workspace">
        <div className="dashboard-column">
          <div className="dashboard-form">
            <div className="dashboard-form__head">
              <div>
                <p className="eyebrow">Pilotage du dossier</p>
                <h2>Cap sur la suite</h2>
              </div>
              <span className="tag">{currentStatus.label}</span>
            </div>

            <p>{nextStep.body}</p>

            <div className="candidate-application-stage-strip">
              {stageSteps.map((step) => {
                const meta = getApplicationStatusMeta(step);
                const state = getStageState(application.status, step);

                return (
                  <article
                    key={step}
                    className={`candidate-application-stage candidate-application-stage--${state}`}
                  >
                    <small>{state === "done" ? "Passe" : state === "current" ? "Actuel" : "A venir"}</small>
                    <strong>{meta.label}</strong>
                    <p>{meta.candidateHint}</p>
                  </article>
                );
              })}
            </div>

            <div className="candidate-application-guidance-grid">
              <div className="document-card">
                <div className="dashboard-card__top">
                  <strong>{nextStep.title}</strong>
                  <span className={nextStep.tagTone ? `tag tag--${nextStep.tagTone}` : "tag"}>
                    {nextStep.tagLabel}
                  </span>
                </div>
                <p>{currentStatus.description}</p>
                <small>{currentStatus.candidateHint}</small>
              </div>

              <div className="document-card">
                <strong>Checklist recommandee</strong>
                <ul className="dashboard-mini-list dashboard-mini-list--compact">
                  {checklistItems.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="job-card__meta">
              <span>Soumise le {formatDisplayDate(application.created_at)}</span>
              <span>{application.job.organization_name}</span>
              <span>{application.job.contract_type}</span>
              <span>{application.job.work_mode}</span>
              <span>{application.job.sector}</span>
            </div>

            {application.cover_letter ? (
              <div className="document-card">
                <strong>Message joint a la candidature</strong>
                <p>{application.cover_letter}</p>
              </div>
            ) : (
              <p className="form-caption">
                Aucun message complementaire n'a ete joint a cette candidature.
              </p>
            )}
          </div>

          <div className="dashboard-form">
            <div className="dashboard-form__head">
              <div>
                <p className="eyebrow">Fil d'activite</p>
                <h2>Historique unifie du dossier</h2>
              </div>
              <span className="tag">{journey.length} evenement(s)</span>
            </div>

            <div className="timeline-list">
              {journey.map((entry) => {
                return (
                  <article
                    key={entry.id}
                    className="panel list-card dashboard-card timeline-card candidate-journey-card"
                  >
                    <div className="dashboard-card__top">
                      <div>
                        <small className="candidate-journey-card__type">
                          {entry.kind === "status" ? "Mise a jour statut" : "Entretien"}
                        </small>
                        <h3>{entry.title}</h3>
                      </div>
                      <span className={entry.tagTone ? `tag tag--${entry.tagTone}` : "tag"}>
                        {entry.tagLabel}
                      </span>
                    </div>

                    <p>{entry.description}</p>
                    <div className="candidate-journey-card__meta">
                      <span>{formatDateTimeDisplay(entry.occurredAt)}</span>
                      {entry.meta.map((item) => (
                        <span key={`${entry.id}-${item}`}>{item}</span>
                      ))}
                    </div>
                    {entry.note ? <p>{entry.note}</p> : null}
                    {entry.actionHref && entry.actionLabel ? (
                      <div className="notification-card__actions">
                        <Link href={entry.actionHref} target="_blank" rel="noreferrer">
                          {entry.actionLabel}
                        </Link>
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </div>

          <div className="dashboard-form">
            <div className="dashboard-form__head">
              <div>
                <p className="eyebrow">Entretiens</p>
                <h2>Planning du dossier</h2>
              </div>
              <span className="tag">{application.interviews.length} rendez-vous</span>
            </div>

            <div className="dashboard-list">
              {application.interviews.length > 0 ? (
                application.interviews.map((interview) => {
                  const interviewStatus = getInterviewStatusMeta(interview.status);

                  return (
                    <article key={interview.id} className="panel list-card dashboard-card">
                      <div className="dashboard-card__top">
                        <div>
                          <h3>{getInterviewFormatLabel(interview.format)}</h3>
                          <p>{formatDateTimeDisplay(interview.starts_at)}</p>
                        </div>
                        <span className={`tag tag--${interviewStatus.tone}`}>{interviewStatus.label}</span>
                      </div>

                      <div className="job-card__meta">
                        <span>{interview.interviewer_name}</span>
                        {interview.location ? <span>{interview.location}</span> : null}
                        <span>{interview.timezone}</span>
                      </div>

                      {interview.notes ? <p>{interview.notes}</p> : null}

                      <div className="application-signal-card">
                        <strong>
                          {interview.status === "scheduled"
                            ? "Preparation"
                            : interview.status === "completed"
                              ? "Entretien passe"
                              : "Entretien annule"}
                        </strong>
                        <p>
                          {interview.status === "scheduled"
                            ? "Conservez vos informations de connexion et preparez vos disponibilites."
                            : interview.status === "completed"
                              ? "Le dossier continue a vivre dans votre suivi candidat selon le retour de l'equipe."
                              : "Le planning a change. Surveillez votre espace pour un nouveau rendez-vous."}
                        </p>
                      </div>

                      <div className="job-card__footer">
                        <small>
                          {interview.meeting_url
                            ? "Le lien de connexion reste disponible tant que l'entretien est planifie."
                            : "Les details logistiques vous sont affiches directement dans ce suivi."}
                        </small>
                        <div className="notification-card__actions">
                          {interview.meeting_url ? (
                            <Link href={interview.meeting_url} target="_blank" rel="noreferrer">
                              Rejoindre l'entretien
                            </Link>
                          ) : null}
                        </div>
                      </div>
                    </article>
                  );
                })
              ) : (
                <article className="panel list-card dashboard-card dashboard-card--empty">
                  <h3>Aucun entretien planifie</h3>
                  <p>Si un recruteur planifie un rendez-vous, il apparaitra ici automatiquement.</p>
                </article>
              )}
            </div>
          </div>

          <div className="dashboard-form">
            <div className="dashboard-form__head">
              <div>
                <p className="eyebrow">Offre</p>
                <h2>Rappel du poste vise</h2>
              </div>
              <span className="tag">{application.job.organization_name}</span>
            </div>

            <h3>{application.job.title}</h3>
            <p>{application.job.summary}</p>

            <div className="job-card__meta">
              <span>{application.job.location}</span>
              <span>{application.job.contract_type}</span>
              <span>{application.job.work_mode}</span>
              <span>{application.job.sector}</span>
            </div>
          </div>
        </div>

        <aside className="dashboard-column dashboard-column--aside">
          <div className="panel dashboard-sidecard">
            <p className="eyebrow">Navigation</p>
            <h2>Poursuivez votre suivi depuis la plateforme.</h2>
            <div className="dashboard-action-stack">
              <Link className="btn btn-secondary btn-block" href="/app/candidat/candidatures">
                Retour a mes candidatures
              </Link>
              <Link className="btn btn-primary btn-block" href={`/app/candidat/offres/${application.job.slug}`}>
                Revoir l'offre
              </Link>
              <Link className="btn btn-ghost btn-block" href="/app/candidat">
                Retour au tableau de bord
              </Link>
            </div>
          </div>

          <div className="panel dashboard-sidecard">
            <p className="eyebrow">Repere dossier</p>
            <h2>{nextStep.title}</h2>
            <ul className="dashboard-mini-list dashboard-mini-list--compact">
              <li>Candidature deposee le {formatDisplayDate(application.created_at)}.</li>
              <li>{timeline.length} etape(s) de statut visibles dans votre historique.</li>
              <li>{application.interviews.length} entretien(s) rattache(s) a ce dossier.</li>
              <li>{currentStatus.candidateHint}</li>
            </ul>
            <div className="dashboard-action-stack">
              {upcomingInterview?.meeting_url ? (
                <Link
                  className="btn btn-primary btn-block"
                  href={upcomingInterview.meeting_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  Rejoindre le prochain entretien
                </Link>
              ) : null}
              <Link className="btn btn-secondary btn-block" href={`/app/candidat/offres/${application.job.slug}`}>
                Revoir l'offre complete
              </Link>
            </div>
          </div>

          <div className="dashboard-form">
            <div className="dashboard-form__head">
              <div>
                <p className="eyebrow">CV rattache</p>
                <h2>Document joint a votre dossier</h2>
              </div>
              <span className="tag">{application.has_cv ? "Disponible" : "A completer"}</span>
            </div>

            {application.cv_document ? (
              <div className="document-card">
                <strong>{application.cv_document.file_name}</strong>
                <div className="document-meta">
                  <span>{formatFileSize(application.cv_document.file_size)}</span>
                  <span>Ajoute le {formatDisplayDate(application.cv_document.created_at)}</span>
                </div>
                {application.cv_download_url ? (
                  <a
                    className="btn btn-primary btn-block"
                    href={application.cv_download_url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Ouvrir mon CV
                  </a>
                ) : null}
              </div>
            ) : (
              <div className="document-card">
                <strong>Aucun CV principal rattache</strong>
                <p>
                  Ce dossier a ete envoye sans CV joint. Vous pouvez ajouter un CV principal
                  depuis votre tableau de bord pour vos prochaines candidatures.
                </p>
                <Link className="btn btn-secondary btn-block" href="/app/candidat">
                  Gerer mon profil candidat
                </Link>
              </div>
            )}
          </div>

          <div className="panel dashboard-sidecard">
            <p className="eyebrow">Conseils</p>
            <h2>Gardez votre candidature active.</h2>
            <ul className="dashboard-mini-list">
              <li>Verifiez regulierement votre email et votre telephone.</li>
              <li>Maintenez votre CV principal et votre profil a jour.</li>
              <li>Continuez a explorer les offres proches de votre cible.</li>
            </ul>
          </div>
        </aside>
      </section>
    </DashboardShell>
  );
}
