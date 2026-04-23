import Link from "next/link";

import { JobEditForm } from "@/components/jobs/job-edit-form";
import { JobHistoryPanel } from "@/components/jobs/job-history-panel";
import { JobStatusPanel } from "@/components/jobs/job-status-panel";
import { getApplicationStatusMeta } from "@/lib/application-status";
import { formatDisplayDate } from "@/lib/format";
import type { JobMatchResult } from "@/lib/matching";
import type {
  JobAuditEvent,
  ManagedCandidateSummary,
  ManagedJob,
  Profile,
  RecruiterApplication
} from "@/lib/types";
import { DashboardShell } from "@/components/dashboard/shell";

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
  const advancedApplications = relatedApplications.filter((application) =>
    ["shortlist", "interview", "hired"].includes(application.status)
  ).length;
  const applicationsWithCv = relatedApplications.filter((application) => application.has_cv).length;

  return (
    <DashboardShell
      title={job.title}
      description="Gerez le contenu, le statut, la visibilite et l'historique de cette offre depuis la plateforme."
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
          <span>Candidatures</span>
          <strong>{job.applications_count}</strong>
          <small>profils recus sur cette offre</small>
        </article>
        <article className="panel metric-panel">
          <span>Dossiers avances</span>
          <strong>{advancedApplications}</strong>
          <small>shortlist, entretiens et profils retenus</small>
        </article>
        <article className="panel metric-panel">
          <span>Couverture CV</span>
          <strong>{applicationsWithCv}</strong>
          <small>{relatedApplications.length - applicationsWithCv} dossier(s) sans CV joint</small>
        </article>
      </section>

      <section className="dashboard-workspace">
        <div className="dashboard-column">
          <JobEditForm job={job} />

          <div className="dashboard-form">
            <div className="dashboard-form__head">
              <div>
                <p className="eyebrow">Pipeline sur l'offre</p>
                <h2>Les dossiers actifs rattaches a cette annonce</h2>
              </div>
              <span className="tag">{relatedApplications.length} dossier(s)</span>
            </div>

            <div className="dashboard-list">
              {relatedApplications.length > 0 ? (
                relatedApplications.map((application) => (
                  <article key={application.id} className="panel list-card dashboard-card">
                    <div className="dashboard-card__top">
                      <h3>{application.candidate_name}</h3>
                      <span className="tag">
                        {getApplicationStatusMeta(application.status).label}
                      </span>
                    </div>
                    <p>{application.candidate_email}</p>
                    <div className="job-card__meta">
                      <span>{application.has_cv ? "CV joint" : "CV manquant"}</span>
                      <span>Soumis le {formatDisplayDate(application.created_at)}</span>
                      <span>Mise a jour le {formatDisplayDate(application.updated_at ?? application.created_at)}</span>
                    </div>
                    {application.cover_letter ? <p>{application.cover_letter}</p> : null}
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
              {relatedApplications[0] ? (
                <Link
                  className="btn btn-ghost btn-block"
                  href={`${applicationsBasePath}/${relatedApplications[0].id}`}
                >
                  Ouvrir le dernier dossier
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
