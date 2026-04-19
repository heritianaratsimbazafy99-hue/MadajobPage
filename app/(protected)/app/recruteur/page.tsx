import Link from "next/link";

import { DashboardShell } from "@/components/dashboard/shell";
import { JobCreateForm } from "@/components/jobs/job-create-form";
import { requireRole } from "@/lib/auth";
import { formatDisplayDate, getRecruiterSnapshot } from "@/lib/jobs";

const recruiterChecklist = [
  "Suivre vos offres actives sans repasser par le site institutionnel.",
  "Visualiser rapidement les candidatures et les volumes de pipeline.",
  "Revenir au site carriere public uniquement quand vous en avez besoin."
];

export default async function RecruiterDashboardPage() {
  const profile = await requireRole(["recruteur"]);
  const snapshot = await getRecruiterSnapshot(profile);

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
                  </article>
                ))
              ) : (
                <article className="panel list-card dashboard-card dashboard-card--empty">
                  <h3>Aucune offre pour le moment</h3>
                  <p>La structure recruteur est prete. La prochaine etape sera le vrai CRUD d&apos;offres relie a Supabase.</p>
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
              <Link className="btn btn-primary btn-block" href="/carrieres">
                Voir les offres publiques
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
