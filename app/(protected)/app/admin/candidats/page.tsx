import { DashboardShell } from "@/components/dashboard/shell";
import { ManagedCandidatesBoard } from "@/components/candidates/managed-candidates-board";
import { requireRole } from "@/lib/auth";
import { getManagedCandidates } from "@/lib/jobs";

export default async function AdminCandidatesPage() {
  const profile = await requireRole(["admin"]);
  const candidates = await getManagedCandidates(profile);

  return (
    <DashboardShell
      title="Base candidats"
      description="Centralisez les profils candidats, leurs CV et leurs candidatures depuis un module dedie."
      profile={profile}
      currentPath="/app/admin/candidats"
    >
      <ManagedCandidatesBoard
        candidates={candidates}
        basePath="/app/admin/candidats"
      />
    </DashboardShell>
  );
}
