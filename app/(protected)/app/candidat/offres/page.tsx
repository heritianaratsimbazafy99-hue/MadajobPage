import { DashboardShell } from "@/components/dashboard/shell";
import { CandidateJobsBoard } from "@/components/jobs/candidate-jobs-board";
import { isFinalApplicationStatus } from "@/lib/application-status";
import { requireRole } from "@/lib/auth";
import { getCandidateApplicationSummaries, getPublicJobs } from "@/lib/jobs";

export default async function CandidateJobsPage() {
  const profile = await requireRole(["candidat"]);
  const [jobs, applications] = await Promise.all([
    getPublicJobs(),
    getCandidateApplicationSummaries(profile.id)
  ]);
  const appliedJobIds = new Set(applications.map((application) => application.job_id));
  const activeApplicationsCount = applications.filter(
    (application) => !isFinalApplicationStatus(application.status)
  ).length;

  return (
    <DashboardShell
      title="Offres disponibles"
      description="Explorez une vraie page carriere dans la plateforme, avec recherche avancee et filtres pour cibler rapidement les postes qui vous correspondent."
      profile={profile}
      currentPath="/app/candidat/offres"
    >
      <section className="dashboard-grid dashboard-grid--four">
        <article className="panel metric-panel">
          <span>Offres visibles</span>
          <strong>{jobs.length}</strong>
          <small>offres publiees accessibles depuis la plateforme</small>
        </article>
        <article className="panel metric-panel">
          <span>Offres deja postulees</span>
          <strong>{appliedJobIds.size}</strong>
          <small>opportunites sur lesquelles vous avez deja un dossier</small>
        </article>
        <article className="panel metric-panel">
          <span>Candidatures actives</span>
          <strong>{activeApplicationsCount}</strong>
          <small>suivi encore en mouvement dans votre espace</small>
        </article>
        <article className="panel metric-panel">
          <span>Offres a explorer</span>
          <strong>{Math.max(jobs.length - appliedJobIds.size, 0)}</strong>
          <small>offres sans candidature envoyee a ce jour</small>
        </article>
      </section>

      <CandidateJobsBoard jobs={jobs} applications={applications} />
    </DashboardShell>
  );
}
