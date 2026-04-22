import { DashboardShell } from "@/components/dashboard/shell";
import { ShortlistBoard } from "@/components/candidates/shortlist-board";
import { requireRole } from "@/lib/auth";
import {
  getManagedCandidates,
  getManagedJobs,
  getRecruiterApplications
} from "@/lib/jobs";

export default async function RecruiterShortlistPage() {
  const profile = await requireRole(["recruteur"]);
  const [applications, candidates, jobs] = await Promise.all([
    getRecruiterApplications(profile, { limit: 300 }),
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
      title="Shortlist candidats"
      description="Travaillez les dossiers avances, priorisez les meilleurs profils et gardez un acces direct au dossier, au profil et a l'offre."
      profile={profile}
      currentPath="/app/recruteur/shortlist"
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
          <small>profils a prioriser maintenant</small>
        </article>
        <article className="panel metric-panel">
          <span>Entretiens</span>
          <strong>{interviewCount}</strong>
          <small>dossiers en phase d'echange</small>
        </article>
        <article className="panel metric-panel">
          <span>Retenus</span>
          <strong>{hiredCount}</strong>
          <small>profils ayant franchi la derniere etape</small>
        </article>
      </section>

      <ShortlistBoard
        applications={applications}
        candidates={candidates}
        jobs={jobs}
        role="recruteur"
      />
    </DashboardShell>
  );
}
