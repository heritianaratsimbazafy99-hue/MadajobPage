import { DashboardShell } from "@/components/dashboard/shell";
import { requireRole } from "@/lib/auth";
import { formatDisplayDate, getRecruiterSnapshot } from "@/lib/jobs";

export default async function RecruiterDashboardPage() {
  const profile = await requireRole(["recruteur"]);
  const snapshot = await getRecruiterSnapshot(profile);

  return (
    <DashboardShell
      title="Votre espace recruteur"
      description="Gerez vos offres, visualisez votre pipeline et accedez a vos candidatures."
      profile={profile}
    >
      <section className="dashboard-grid">
        <article className="panel metric-panel">
          <span>Offres actives</span>
          <strong>{snapshot.metrics.activeJobs}</strong>
        </article>
        <article className="panel metric-panel">
          <span>Candidatures</span>
          <strong>{snapshot.metrics.applications}</strong>
        </article>
        <article className="panel metric-panel">
          <span>Pipeline</span>
          <strong>{snapshot.metrics.pipeline}</strong>
        </article>
      </section>

      <section className="dashboard-section">
        <div className="section-heading">
          <p className="eyebrow">Offres</p>
          <h2>Vos annonces recentes</h2>
        </div>
        <div className="dashboard-list">
          {snapshot.jobs.map((job) => (
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
