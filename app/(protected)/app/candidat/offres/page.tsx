import { DashboardShell } from "@/components/dashboard/shell";
import { CandidateJobsBoard } from "@/components/jobs/candidate-jobs-board";
import { isFinalApplicationStatus } from "@/lib/application-status";
import { requireRole } from "@/lib/auth";
import { getCandidateApplicationSummaries, getCandidateWorkspace, getPublicJobs } from "@/lib/jobs";
import { rankJobsForCandidate } from "@/lib/matching";

export default async function CandidateJobsPage() {
  const profile = await requireRole(["candidat"]);
  const [jobs, applications, candidateProfile] = await Promise.all([
    getPublicJobs(),
    getCandidateApplicationSummaries(profile.id),
    getCandidateWorkspace(profile)
  ]);
  const appliedJobIds = new Set(applications.map((application) => application.job_id));
  const activeApplicationsCount = applications.filter(
    (application) => !isFinalApplicationStatus(application.status)
  ).length;
  const rankedJobs = rankJobsForCandidate(candidateProfile, jobs);
  const strongMatchesCount = rankedJobs.filter((entry) => entry.match.score >= 78).length;

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
          <span>Forts matchs</span>
          <strong>{strongMatchesCount}</strong>
          <small>offres avec forte compatibilite calculee depuis votre profil</small>
        </article>
      </section>

      <CandidateJobsBoard
        jobs={jobs}
        applications={applications}
        candidateProfile={candidateProfile}
      />
    </DashboardShell>
  );
}
