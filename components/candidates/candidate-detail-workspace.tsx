import Link from "next/link";

import { DashboardShell } from "@/components/dashboard/shell";
import { formatDisplayDate, formatFileSize } from "@/lib/format";
import type { CandidateDetail, Profile } from "@/lib/types";

type CandidateDetailWorkspaceProps = {
  profile: Profile;
  candidate: CandidateDetail;
  currentPath: string;
  backHref: string;
};

export function CandidateDetailWorkspace({
  profile,
  candidate,
  currentPath,
  backHref
}: CandidateDetailWorkspaceProps) {
  const applicationsBasePath =
    profile.role === "admin" ? "/app/admin/candidatures" : "/app/recruteur/candidatures";

  return (
    <DashboardShell
      title={candidate.full_name}
      description="Consultez le profil, le CV principal et toutes les candidatures rattachees a ce candidat."
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
          <span>CV</span>
          <strong>{candidate.primary_cv ? "Actif" : "Absent"}</strong>
          <small>{candidate.primary_cv?.file_name ?? "aucun document principal"}</small>
        </article>
        <article className="panel metric-panel">
          <span>Localisation</span>
          <strong>{candidate.city || "N/R"}</strong>
          <small>{candidate.country}</small>
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
                candidate.applications.map((application) => (
                  <article key={application.id} className="panel list-card dashboard-card">
                    <div className="dashboard-card__top">
                      <h3>{application.job_title}</h3>
                      <span className="tag">{application.status}</span>
                    </div>
                    <div className="job-card__meta">
                      <span>{application.organization_name}</span>
                      <span>{application.job_location}</span>
                      <span>{application.contract_type}</span>
                      <span>{application.has_cv ? "CV joint" : "CV non joint"}</span>
                    </div>
                    {application.cover_letter ? <p>{application.cover_letter}</p> : null}
                    <div className="job-card__footer">
                      <small>Soumis le {formatDisplayDate(application.created_at)}</small>
                      <Link href={`${applicationsBasePath}/${application.id}`}>Ouvrir le dossier</Link>
                    </div>
                  </article>
                ))
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
