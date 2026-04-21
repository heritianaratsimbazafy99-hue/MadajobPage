import { DashboardShell } from "@/components/dashboard/shell";
import { ManagedCandidatesBoard } from "@/components/candidates/managed-candidates-board";
import { requireRole } from "@/lib/auth";
import { getManagedCandidates, getManagedJobs } from "@/lib/jobs";

export default async function AdminCandidatesPage() {
  const profile = await requireRole(["admin"]);
  const [candidates, jobs] = await Promise.all([
    getManagedCandidates(profile),
    getManagedJobs(profile, { limit: 300 })
  ]);

  return (
    <DashboardShell
      title="Base candidats"
      description="Centralisez les profils candidats, triez-les plus vite et comparez-les a une offre cible pour piloter le matching."
      profile={profile}
      currentPath="/app/admin/candidats"
    >
      <ManagedCandidatesBoard
        candidates={candidates}
        jobs={jobs}
        basePath="/app/admin/candidats"
      />
    </DashboardShell>
  );
}
