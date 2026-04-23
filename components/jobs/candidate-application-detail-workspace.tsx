import Link from "next/link";

import { getApplicationStatusMeta } from "@/lib/application-status";
import { formatDateTimeDisplay, formatDisplayDate, formatFileSize } from "@/lib/format";
import { getInterviewFormatLabel, getInterviewStatusMeta } from "@/lib/interviews";
import type { CandidateApplicationDetail, CandidateApplicationHistoryEntry, Profile } from "@/lib/types";
import { DashboardShell } from "@/components/dashboard/shell";

type CandidateApplicationDetailWorkspaceProps = {
  profile: Profile;
  application: CandidateApplicationDetail;
};

type TimelineEntry = CandidateApplicationHistoryEntry & {
  isInitial: boolean;
};

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

  return entries;
}

export function CandidateApplicationDetailWorkspace({
  profile,
  application
}: CandidateApplicationDetailWorkspaceProps) {
  const currentStatus = getApplicationStatusMeta(application.status);
  const timeline = buildTimeline(application);

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
          <span>Organisation</span>
          <strong>{application.job.organization_name}</strong>
          <small>{application.job.location || "localisation a confirmer"}</small>
        </article>
        <article className="panel metric-panel">
          <span>CV joint</span>
          <strong>{application.has_cv ? "Disponible" : "Absent"}</strong>
          <small>{application.cv_document?.file_name ?? "aucun CV rattache"}</small>
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
                <p className="eyebrow">Suivi candidat</p>
                <h2>Ou en est votre candidature ?</h2>
              </div>
              <span className="tag">{currentStatus.label}</span>
            </div>

            <p>{currentStatus.description}</p>

            <div className="document-card">
              <strong>Prochaine vigilance</strong>
              <p>{currentStatus.candidateHint}</p>
            </div>

            <div className="job-card__meta">
              <span>Soumise le {formatDisplayDate(application.created_at)}</span>
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
                <p className="eyebrow">Historique</p>
                <h2>Evolution du dossier</h2>
              </div>
              <span className="tag">{timeline.length} etape(s)</span>
            </div>

            <div className="timeline-list">
              {timeline.map((entry) => {
                const statusMeta = getApplicationStatusMeta(entry.to_status);
                const previousStatus = entry.from_status
                  ? getApplicationStatusMeta(entry.from_status)
                  : null;

                return (
                  <article key={entry.id} className="panel list-card dashboard-card timeline-card">
                    <div className="dashboard-card__top">
                      <h3>{statusMeta.label}</h3>
                      <span className="tag">{formatDisplayDate(entry.created_at)}</span>
                    </div>

                    <p>
                      {entry.isInitial
                        ? "Votre candidature a ete deposee sur la plateforme."
                        : previousStatus
                          ? `Passage de ${previousStatus.label} a ${statusMeta.label}.`
                          : statusMeta.description}
                    </p>

                    {entry.note ? <p>{entry.note}</p> : null}

                    <small>
                      {entry.isInitial
                        ? "Le dossier est maintenant accessible dans votre suivi candidat."
                        : statusMeta.candidateHint}
                    </small>
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
