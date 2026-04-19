import Link from "next/link";

import { DashboardShell } from "@/components/dashboard/shell";
import { requireRole } from "@/lib/auth";
import { formatDisplayDate, getAdminSnapshot } from "@/lib/jobs";

const adminChecklist = [
  "Superviser l'activite candidats, recruteurs et offres depuis une seule interface.",
  "Controler la coherence entre plateforme interne et site carriere public.",
  "Preparer les futures briques de moderation, droits et audit sur la meme base UX."
];

export default async function AdminDashboardPage() {
  const profile = await requireRole(["admin"]);
  const snapshot = await getAdminSnapshot();

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
                </article>
              ))}
            </div>
          </div>
        </div>

        <aside className="dashboard-column dashboard-column--aside">
          <div className="panel dashboard-sidecard">
            <p className="eyebrow">Vision admin</p>
            <h2>Le cockpit central de la plateforme.</h2>
            <ul className="dashboard-mini-list">
              {adminChecklist.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <div className="dashboard-action-stack">
              <Link className="btn btn-primary btn-block" href="/carrieres">
                Verifier le site carriere
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
