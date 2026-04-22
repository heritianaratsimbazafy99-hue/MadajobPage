import Link from "next/link";

import { DashboardShell } from "@/components/dashboard/shell";
import { ApplicationNotes } from "@/components/jobs/application-notes";
import { ApplicationStatusForm } from "@/components/jobs/application-status-form";
import { JobCreateForm } from "@/components/jobs/job-create-form";
import { requireRole } from "@/lib/auth";
import { formatDisplayDate } from "@/lib/format";
import {
  getInternalNotesByApplicationIds,
  getRecruiterApplications,
  getRecruiterSnapshot
} from "@/lib/jobs";

const recruiterChecklist = [
  "Suivre vos offres actives sans repasser par le site institutionnel.",
  "Visualiser rapidement les candidatures et les volumes de pipeline.",
  "Revenir au site carriere public uniquement quand vous en avez besoin."
];

export default async function RecruiterDashboardPage() {
  const profile = await requireRole(["recruteur"]);
  const snapshot = await getRecruiterSnapshot(profile);
  const applications = await getRecruiterApplications(profile);
  const notesByApplicationId = await getInternalNotesByApplicationIds(
    profile,
    applications.map((application) => application.id)
  );

  return (
    <DashboardShell
      title="Votre espace recruteur"
      description="Gerez vos offres, visualisez votre pipeline et accedez a vos candidatures depuis une interface de pilotage dediee."
      profile={profile}
      currentPath="/app/recruteur"
    >
      <section className="dashboard-grid dashboard-grid--four">
        <article className="panel metric-panel">
          <span>Offres actives</span>
          <strong>{snapshot.metrics.activeJobs}</strong>
          <small>annonces actuellement visibles</small>
        </article>
        <article className="panel metric-panel">
          <span>Candidatures</span>
          <strong>{snapshot.metrics.applications}</strong>
          <small>profils recus sur vos offres</small>
        </article>
        <article className="panel metric-panel">
          <span>Pipeline</span>
          <strong>{snapshot.metrics.pipeline}</strong>
          <small>dossiers en cours de traitement</small>
        </article>
        <article className="panel metric-panel">
          <span>Acces</span>
          <strong>{profile.email ? "Actif" : "Configure"}</strong>
          <small>espace recruteur personalise</small>
        </article>
      </section>

      <section className="dashboard-workspace">
        <div className="dashboard-column">
          <div className="dashboard-section">
            <div className="dashboard-section__head">
              <div>
                <p className="eyebrow">Offres</p>
                <h2>Vos annonces recentes</h2>
              </div>
              <Link className="text-link" href="/carrieres">
                Ouvrir le site carriere
              </Link>
            </div>

            <div className="dashboard-list">
              {snapshot.jobs.length > 0 ? (
                snapshot.jobs.map((job) => (
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
                      <Link className="btn btn-ghost btn-block" href={`/app/recruteur/offres/${job.id}`}>
                        Gerer cette offre
                      </Link>
                    </div>
                  </article>
                ))
              ) : (
                <article className="panel list-card dashboard-card dashboard-card--empty">
                  <h3>Aucune offre pour le moment</h3>
                  <p>Creez votre premiere offre depuis le panneau de droite, puis gerez-la dans le module dedie.</p>
                </article>
              )}
            </div>
          </div>

          <div className="dashboard-section">
            <div className="dashboard-section__head">
              <div>
                <p className="eyebrow">Candidatures</p>
                <h2>Pipeline recent</h2>
              </div>
            </div>

            <div className="dashboard-list">
              {applications.length > 0 ? (
                applications.map((application) => (
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
                      <Link className="btn btn-ghost btn-block" href={`/app/recruteur/candidatures/${application.id}`}>
                        Ouvrir le dossier complet
                      </Link>
                    </div>
                    <ApplicationNotes
                      applicationId={application.id}
                      notes={notesByApplicationId.get(application.id) ?? []}
                    />
                  </article>
                ))
              ) : (
                <article className="panel list-card dashboard-card dashboard-card--empty">
                  <h3>Aucune candidature recue pour le moment</h3>
                  <p>Les candidatures envoyees depuis le site carriere apparaitront ici pour votre suivi.</p>
                </article>
              )}
            </div>
          </div>
        </div>

        <aside className="dashboard-column dashboard-column--aside">
          <JobCreateForm roleLabel="Recruteur" />

          <div className="panel dashboard-sidecard">
            <p className="eyebrow">Pilotage</p>
            <h2>Un espace pense pour les operations recrutement.</h2>
            <ul className="dashboard-mini-list">
              {recruiterChecklist.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <div className="dashboard-action-stack">
              <Link className="btn btn-primary btn-block" href="/app/recruteur/offres">
                Gerer toutes mes offres
              </Link>
              <Link className="btn btn-secondary btn-block" href="/app/recruteur/candidatures">
                Ouvrir toutes les candidatures
              </Link>
              <Link className="btn btn-secondary btn-block" href="/app/recruteur/shortlist">
                Ouvrir la shortlist
              </Link>
              <Link className="btn btn-secondary btn-block" href="/app/recruteur/candidats">
                Ouvrir la base candidats
              </Link>
              <Link className="btn btn-secondary btn-block" href="/app/recruteur/reporting">
                Ouvrir les exports & reporting
              </Link>
              <Link className="btn btn-secondary btn-block" href="/entreprise">
                Retour a l&apos;offre entreprise
              </Link>
            </div>
          </div>
        </aside>
      </section>
    </DashboardShell>
  );
}
