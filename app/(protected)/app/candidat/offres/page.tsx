import { DashboardShell } from "@/components/dashboard/shell";
import { CandidateJobsBoard } from "@/components/jobs/candidate-jobs-board";
import { requireRole } from "@/lib/auth";
import { getPublicJobs } from "@/lib/jobs";

export default async function CandidateJobsPage() {
  const profile = await requireRole(["candidat"]);
  const jobs = await getPublicJobs();

  return (
    <DashboardShell
      title="Offres disponibles"
      description="Explorez une vraie page carriere dans la plateforme, avec recherche avancee et filtres pour cibler rapidement les postes qui vous correspondent."
      profile={profile}
      currentPath="/app/candidat/offres"
    >
      <CandidateJobsBoard jobs={jobs} />
    </DashboardShell>
  );
}
