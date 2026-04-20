import { DashboardShell } from "@/components/dashboard/shell";
import { ManagedApplicationsBoard } from "@/components/jobs/managed-applications-board";
import { requireRole } from "@/lib/auth";
import { getRecruiterApplications } from "@/lib/jobs";

export default async function RecruiterApplicationsPage() {
  const profile = await requireRole(["recruteur"]);
  const applications = await getRecruiterApplications(profile);

  return (
    <DashboardShell
      title="Candidatures recues"
      description="Parcourez les dossiers candidats, filtrez-les et ouvrez leur fiche detaillee."
      profile={profile}
      currentPath="/app/recruteur/candidatures"
    >
      <ManagedApplicationsBoard
        applications={applications}
        basePath="/app/recruteur/candidatures"
      />
    </DashboardShell>
  );
}
