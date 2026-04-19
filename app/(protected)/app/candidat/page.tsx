import { DashboardShell } from "@/components/dashboard/shell";
import { requireRole } from "@/lib/auth";
import { formatDisplayDate, getCandidateApplications } from "@/lib/jobs";

export default async function CandidateDashboardPage() {
  const profile = await requireRole(["candidat"]);
  const applications = await getCandidateApplications(profile.id);

  return (
    <DashboardShell
      title="Votre espace candidat"
      description="Retrouvez votre profil, votre CV principal et le suivi de vos candidatures."
      profile={profile}
    >
      <section className="dashboard-grid">
        <article className="panel metric-panel">
          <span>Candidatures actives</span>
          <strong>{applications.length}</strong>
        </article>
        <article className="panel metric-panel">
          <span>Profil</span>
          <strong>{profile.full_name || "A completer"}</strong>
        </article>
      </section>

      <section className="dashboard-section">
        <div className="section-heading">
          <p className="eyebrow">Candidatures</p>
          <h2>Suivi recent</h2>
        </div>
        <div className="dashboard-list">
          {applications.map((application) => (
            <article key={application.id} className="panel list-card">
              <h3>{application.job_title}</h3>
              <p>{application.organization_name || "Organisation"}</p>
              <div className="job-card__meta">
                <span>{application.status}</span>
                <span>{formatDisplayDate(application.created_at)}</span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </DashboardShell>
  );
}
