import { DashboardShell } from "@/components/dashboard/shell";
import { ManagedCandidatesBoard } from "@/components/candidates/managed-candidates-board";
import { requireRole } from "@/lib/auth";
import { getManagedCandidates } from "@/lib/jobs";

export default async function RecruiterCandidatesPage() {
  const profile = await requireRole(["recruteur"]);
  const candidates = await getManagedCandidates(profile);

  return (
    <DashboardShell
      title="Base candidats"
      description="Retrouvez les profils lies a vos offres, leurs CV et leurs candidatures recentes."
      profile={profile}
      currentPath="/app/recruteur/candidats"
    >
      <ManagedCandidatesBoard
        candidates={candidates}
        basePath="/app/recruteur/candidats"
      />
    </DashboardShell>
  );
}
