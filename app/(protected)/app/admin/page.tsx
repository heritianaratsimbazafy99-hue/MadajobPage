import { DashboardShell } from "@/components/dashboard/shell";
import { requireRole } from "@/lib/auth";
import { formatDisplayDate, getAdminSnapshot } from "@/lib/jobs";

export default async function AdminDashboardPage() {
  const profile = await requireRole(["admin"]);
  const snapshot = await getAdminSnapshot();

  return (
    <DashboardShell
      title="Supervision Madajob"
      description="Pilotez les candidats, les offres, les utilisateurs et les flux critiques depuis une vue transverse."
      profile={profile}
    >
      <section className="dashboard-grid dashboard-grid--four">
        <article className="panel metric-panel">
          <span>Candidats</span>
          <strong>{snapshot.metrics.candidates}</strong>
        </article>
        <article className="panel metric-panel">
          <span>Recruteurs</span>
          <strong>{snapshot.metrics.recruiters}</strong>
        </article>
        <article className="panel metric-panel">
          <span>Offres actives</span>
          <strong>{snapshot.metrics.activeJobs}</strong>
        </article>
        <article className="panel metric-panel">
          <span>Candidatures</span>
          <strong>{snapshot.metrics.applications}</strong>
        </article>
      </section>

      <section className="dashboard-section">
        <div className="section-heading">
          <p className="eyebrow">Pilotage</p>
          <h2>Dernieres offres visibles</h2>
        </div>
        <div className="dashboard-list">
          {snapshot.recentJobs.map((job) => (
            <article key={job.id} className="panel list-card">
              <h3>{job.title}</h3>
              <div className="job-card__meta">
                <span>{job.location}</span>
                <span>{job.contract_type}</span>
                <span>{job.status}</span>
              </div>
              <small>Publication: {formatDisplayDate(job.published_at)}</small>
            </article>
          ))}
        </div>
      </section>
    </DashboardShell>
  );
}
