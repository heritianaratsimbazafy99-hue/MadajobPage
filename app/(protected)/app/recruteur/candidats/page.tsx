import { DashboardShell } from "@/components/dashboard/shell";
import { ManagedCandidatesBoard } from "@/components/candidates/managed-candidates-board";
import { requireRole } from "@/lib/auth";
import { getManagedCandidates, getManagedJobs } from "@/lib/jobs";

export default async function RecruiterCandidatesPage() {
  const profile = await requireRole(["recruteur"]);
  const [candidates, jobs] = await Promise.all([
    getManagedCandidates(profile),
    getManagedJobs(profile, { limit: 200 })
  ]);

  return (
    <DashboardShell
      title="Base candidats"
      description="Triez les profils, filtrez-les par offre de reference et identifiez les meilleurs matchs candidat pour vos recrutements."
      profile={profile}
      currentPath="/app/recruteur/candidats"
    >
      <ManagedCandidatesBoard
        candidates={candidates}
        jobs={jobs}
        basePath="/app/recruteur/candidats"
      />
    </DashboardShell>
  );
}
