import Link from "next/link";

import { DashboardShell } from "@/components/dashboard/shell";
import { ApplicationNotes } from "@/components/jobs/application-notes";
import { ApplicationStatusForm } from "@/components/jobs/application-status-form";
import { formatDisplayDate, formatFileSize } from "@/lib/format";
import type { ApplicationDetail, Profile } from "@/lib/types";

type ApplicationDetailWorkspaceProps = {
  profile: Profile;
  application: ApplicationDetail;
  currentPath: string;
  backHref: string;
};

export function ApplicationDetailWorkspace({
  profile,
  application,
  currentPath,
  backHref
}: ApplicationDetailWorkspaceProps) {
  const candidatesBasePath =
    profile.role === "admin" ? "/app/admin/candidats" : "/app/recruteur/candidats";

  return (
    <DashboardShell
      title={application.candidate.full_name}
      description="Consultez le dossier complet, le CV, l'historique et les notes internes depuis un seul ecran."
      profile={profile}
      currentPath={currentPath}
    >
      <section className="dashboard-grid dashboard-grid--four">
        <article className="panel metric-panel">
          <span>Statut</span>
          <strong>{application.status}</strong>
          <small>etat actuel du dossier</small>
        </article>
        <article className="panel metric-panel">
          <span>CV</span>
          <strong>{application.has_cv ? "Joint" : "Absent"}</strong>
          <small>{application.cv_document?.file_name ?? "aucun fichier rattache"}</small>
        </article>
        <article className="panel metric-panel">
          <span>Profil</span>
          <strong>{application.candidate.profile_completion}%</strong>
          <small>niveau de completion du profil candidat</small>
        </article>
        <article className="panel metric-panel">
          <span>Soumission</span>
          <strong>{formatDisplayDate(application.created_at)}</strong>
          <small>date d'entree dans le pipeline</small>
        </article>
      </section>

      <section className="dashboard-workspace">
        <div className="dashboard-column">
          <div className="dashboard-form">
            <div className="dashboard-form__head">
              <div>
                <p className="eyebrow">Candidat</p>
                <h2>Profil complet</h2>
              </div>
              <span className="tag">{application.candidate.current_position || "Profil candidat"}</span>
            </div>

            <div className="job-card__meta">
              {application.candidate.email ? <span>{application.candidate.email}</span> : null}
              {application.candidate.phone ? <span>{application.candidate.phone}</span> : null}
              {application.candidate.city ? <span>{application.candidate.city}</span> : null}
              <span>{application.candidate.country}</span>
            </div>

            {application.candidate.headline ? <p>{application.candidate.headline}</p> : null}
            {application.candidate.bio ? <p className="form-caption">{application.candidate.bio}</p> : null}

            <div className="form-grid">
              <div className="document-card">
                <strong>Poste vise</strong>
                <p>{application.candidate.desired_position || "Non renseigne"}</p>
              </div>
              <div className="document-card">
                <strong>Experience</strong>
                <p>
                  {application.candidate.experience_years !== null
                    ? `${application.candidate.experience_years} an(s)`
                    : "Non renseignee"}
                </p>
              </div>
            </div>

            {application.candidate.skills_text ? (
              <div className="document-card">
                <strong>Competences clefs</strong>
                <p>{application.candidate.skills_text}</p>
              </div>
            ) : null}

            {application.candidate.cv_text ? (
              <div className="document-card">
                <strong>Resume du CV</strong>
                <p>{application.candidate.cv_text}</p>
              </div>
            ) : null}
          </div>

          <div className="dashboard-form">
            <div className="dashboard-form__head">
              <div>
                <p className="eyebrow">Offre</p>
                <h2>Contexte de candidature</h2>
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
            {application.cover_letter ? (
              <div className="document-card">
                <strong>Message de candidature</strong>
                <p>{application.cover_letter}</p>
              </div>
            ) : null}
          </div>

          <div className="dashboard-form">
            <div className="dashboard-form__head">
              <div>
                <p className="eyebrow">Historique</p>
                <h2>Evolution du statut</h2>
              </div>
              <span className="tag">{application.status_history.length} etape(s)</span>
            </div>

            <div className="dashboard-list">
              {application.status_history.length > 0 ? (
                application.status_history.map((entry) => (
                  <article key={entry.id} className="panel list-card dashboard-card">
                    <div className="dashboard-card__top">
                      <h3>{entry.to_status}</h3>
                      <span className="tag">{formatDisplayDate(entry.created_at)}</span>
                    </div>
                    <p>
                      {entry.from_status
                        ? `Transition ${entry.from_status} → ${entry.to_status}`
                        : `Passage au statut ${entry.to_status}`}
                    </p>
                    {entry.note ? <p>{entry.note}</p> : null}
                    <small>
                      Par {entry.changed_by_name}
                      {entry.changed_by_email ? ` · ${entry.changed_by_email}` : ""}
                    </small>
                  </article>
                ))
              ) : (
                <article className="panel list-card dashboard-card dashboard-card--empty">
                  <h3>Aucun changement de statut pour le moment</h3>
                  <p>Le dossier apparaitra ici au fur et a mesure des actions recruteur/admin.</p>
                </article>
              )}
            </div>
          </div>
        </div>

        <aside className="dashboard-column dashboard-column--aside">
          <div className="panel dashboard-sidecard">
            <p className="eyebrow">Actions</p>
            <h2>Traitez ce dossier depuis la plateforme.</h2>
            <div className="dashboard-action-stack">
              <Link className="btn btn-secondary btn-block" href={backHref}>
                Retour a la liste
              </Link>
              <Link className="btn btn-primary btn-block" href={`${candidatesBasePath}/${application.candidate.id}`}>
                Ouvrir la fiche candidat
              </Link>
              <Link className="btn btn-ghost btn-block" href={`/carrieres/${application.job.slug}`}>
                Voir l'offre publique
              </Link>
            </div>
          </div>

          <div className="dashboard-form">
            <div className="dashboard-form__head">
              <div>
                <p className="eyebrow">CV</p>
                <h2>Document rattache a la candidature</h2>
              </div>
              <span className="tag">{application.has_cv ? "Disponible" : "Absent"}</span>
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
                    Ouvrir le CV
                  </a>
                ) : null}
              </div>
            ) : (
              <p className="form-caption">Aucun CV n'est rattache a cette candidature.</p>
            )}
          </div>

          <ApplicationStatusForm
            applicationId={application.id}
            currentStatus={application.status}
          />

          <div className="dashboard-form">
            <div className="dashboard-form__head">
              <div>
                <p className="eyebrow">Notes internes</p>
                <h2>Conserver les retours de traitement</h2>
              </div>
            </div>
            <ApplicationNotes applicationId={application.id} notes={application.notes} />
          </div>
        </aside>
      </section>
    </DashboardShell>
  );
}
