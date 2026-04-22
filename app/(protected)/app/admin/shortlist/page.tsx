import { DashboardShell } from "@/components/dashboard/shell";
import { ShortlistBoard } from "@/components/candidates/shortlist-board";
import { requireRole } from "@/lib/auth";
import {
  getAdminApplications,
  getManagedCandidates,
  getManagedJobs
} from "@/lib/jobs";

export default async function AdminShortlistPage() {
  const profile = await requireRole(["admin"]);
  const [applications, candidates, jobs] = await Promise.all([
    getAdminApplications({ limit: 300 }),
    getManagedCandidates(profile, { limit: 300 }),
    getManagedJobs(profile, { limit: 300 })
  ]);

  const shortlistApplications = applications.filter((application) =>
    ["shortlist", "interview", "hired"].includes(application.status)
  );
  const shortlistCount = shortlistApplications.filter(
    (application) => application.status === "shortlist"
  ).length;
  const interviewCount = shortlistApplications.filter(
    (application) => application.status === "interview"
  ).length;
  const hiredCount = shortlistApplications.filter(
    (application) => application.status === "hired"
  ).length;

  return (
    <DashboardShell
      title="Shortlist plateforme"
      description="Supervisez les dossiers avances de la plateforme et pilotez les meilleurs profils sans perdre le contexte candidat-offre."
      profile={profile}
      currentPath="/app/admin/shortlist"
    >
      <section className="dashboard-grid dashboard-grid--four">
        <article className="panel metric-panel">
          <span>Dossiers avances</span>
          <strong>{shortlistApplications.length}</strong>
          <small>shortlist, entretiens et profils retenus</small>
        </article>
        <article className="panel metric-panel">
          <span>Shortlist</span>
          <strong>{shortlistCount}</strong>
          <small>profils a arbitrer cote plateforme</small>
        </article>
        <article className="panel metric-panel">
          <span>Entretiens</span>
          <strong>{interviewCount}</strong>
          <small>dossiers en phase de coordination</small>
        </article>
        <article className="panel metric-panel">
          <span>Retenus</span>
          <strong>{hiredCount}</strong>
          <small>profils finalises sur la plateforme</small>
        </article>
      </section>

      <ShortlistBoard
        applications={applications}
        candidates={candidates}
        jobs={jobs}
        role="admin"
      />
    </DashboardShell>
  );
}
