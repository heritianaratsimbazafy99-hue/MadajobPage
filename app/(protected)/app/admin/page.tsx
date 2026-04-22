import Link from "next/link";

import { DashboardShell } from "@/components/dashboard/shell";
import { ApplicationNotes } from "@/components/jobs/application-notes";
import { ApplicationStatusForm } from "@/components/jobs/application-status-form";
import { JobCreateForm } from "@/components/jobs/job-create-form";
import { requireRole } from "@/lib/auth";
import { formatDisplayDate } from "@/lib/format";
import {
  getAdminApplications,
  getInternalNotesByApplicationIds,
  getAdminSnapshot
} from "@/lib/jobs";

const adminChecklist = [
  "Superviser l'activite candidats, recruteurs et offres depuis une seule interface.",
  "Controler la coherence entre plateforme interne et site carriere public.",
  "Preparer les futures briques de moderation, droits et audit sur la meme base UX."
];

export default async function AdminDashboardPage() {
  const profile = await requireRole(["admin"]);
  const snapshot = await getAdminSnapshot();
  const applications = await getAdminApplications();
  const notesByApplicationId = await getInternalNotesByApplicationIds(
    profile,
    applications.map((application) => application.id)
  );

  return (
    <DashboardShell
      title="Supervision Madajob"
      description="Pilotez les candidats, les offres, les utilisateurs et les flux critiques depuis une vraie interface de plateforme."
      profile={profile}
      currentPath="/app/admin"
    >
      <section className="dashboard-grid dashboard-grid--four">
        <article className="panel metric-panel">
          <span>Candidats</span>
          <strong>{snapshot.metrics.candidates}</strong>
          <small>profils suivis dans l'ecosysteme</small>
        </article>
        <article className="panel metric-panel">
          <span>Recruteurs</span>
          <strong>{snapshot.metrics.recruiters}</strong>
          <small>comptes recruteur actifs</small>
        </article>
        <article className="panel metric-panel">
          <span>Offres actives</span>
          <strong>{snapshot.metrics.activeJobs}</strong>
          <small>annonces actuellement publiees</small>
        </article>
        <article className="panel metric-panel">
          <span>Candidatures</span>
          <strong>{snapshot.metrics.applications}</strong>
          <small>flux global recu par la plateforme</small>
        </article>
      </section>

      <section className="dashboard-workspace">
        <div className="dashboard-column">
          <div className="dashboard-section">
            <div className="dashboard-section__head">
              <div>
                <p className="eyebrow">Pilotage</p>
                <h2>Dernieres offres visibles</h2>
              </div>
              <Link className="text-link" href="/carrieres">
                Consulter la vitrine carriere
              </Link>
            </div>

            <div className="dashboard-list">
              {snapshot.recentJobs.map((job) => (
                <article key={job.id} className="panel list-card dashboard-card">
                  <div className="dashboard-card__top">
                    <h3>{job.title}</h3>
                    <span className="tag">{job.status}</span>
                  </div>
                  <div className="job-card__meta">
                    <span>{job.location}</span>
                    <span>{job.contract_type}</span>
                    <span>{job.work_mode}</span>
                  </div>
                  <small>Publication : {formatDisplayDate(job.published_at)}</small>
                  <div className="dashboard-action-stack">
                    <Link className="btn btn-ghost btn-block" href={`/app/admin/offres/${job.id}`}>
                      Gerer cette offre
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="dashboard-section">
            <div className="dashboard-section__head">
              <div>
                <p className="eyebrow">Candidatures</p>
                <h2>Activite recente</h2>
              </div>
            </div>

            <div className="dashboard-list">
              {applications.map((application) => (
                <article key={application.id} className="panel list-card dashboard-card">
                  <div className="dashboard-card__top">
                    <h3>{application.candidate_name}</h3>
                    <span className="tag">{application.status}</span>
                  </div>
                  <p>
                    {application.job_title} · {application.job_location}
                  </p>
                  <small>{application.candidate_email}</small>
                  {application.cover_letter ? <p>{application.cover_letter}</p> : null}
                  <div className="job-card__meta">
                    <span>{application.has_cv ? "CV joint" : "CV non joint"}</span>
                    <span>Soumis le {formatDisplayDate(application.created_at)}</span>
                  </div>
                  <ApplicationStatusForm
                    applicationId={application.id}
                    currentStatus={application.status}
                  />
                  <div className="dashboard-action-stack">
                    <Link className="btn btn-ghost btn-block" href={`/app/admin/candidatures/${application.id}`}>
                      Ouvrir le dossier complet
                    </Link>
                  </div>
                  <ApplicationNotes
                    applicationId={application.id}
                    notes={notesByApplicationId.get(application.id) ?? []}
                  />
                </article>
              ))}
            </div>
          </div>
        </div>

        <aside className="dashboard-column dashboard-column--aside">
          <JobCreateForm roleLabel="Admin" />

          <div className="panel dashboard-sidecard">
            <p className="eyebrow">Vision admin</p>
            <h2>Le cockpit central de la plateforme.</h2>
            <ul className="dashboard-mini-list">
              {adminChecklist.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <div className="dashboard-action-stack">
              <Link className="btn btn-primary btn-block" href="/app/admin/offres">
                Piloter toutes les offres
              </Link>
              <Link className="btn btn-secondary btn-block" href="/app/admin/candidatures">
                Ouvrir toutes les candidatures
              </Link>
              <Link className="btn btn-secondary btn-block" href="/app/admin/shortlist">
                Ouvrir la shortlist
              </Link>
              <Link className="btn btn-secondary btn-block" href="/app/admin/candidats">
                Ouvrir la base candidats
              </Link>
              <Link className="btn btn-secondary btn-block" href="/app/admin/organisations">
                Ouvrir les organisations
              </Link>
              <Link className="btn btn-secondary btn-block" href="/app/admin/utilisateurs">
                Gerer les utilisateurs
              </Link>
              <Link className="btn btn-secondary btn-block" href="/app/admin/emails">
                Suivre les emails transactionnels
              </Link>
              <Link className="btn btn-secondary btn-block" href="/app/admin/reporting">
                Ouvrir les exports & reporting
              </Link>
              <Link className="btn btn-secondary btn-block" href="/">
                Retour a la vitrine institutionnelle
              </Link>
            </div>
          </div>
        </aside>
      </section>
    </DashboardShell>
  );
}
