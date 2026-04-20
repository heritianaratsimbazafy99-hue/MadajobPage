import { DashboardShell } from "@/components/dashboard/shell";
import { ManagedApplicationsBoard } from "@/components/jobs/managed-applications-board";
import { requireRole } from "@/lib/auth";
import { getAdminApplications } from "@/lib/jobs";

export default async function AdminApplicationsPage() {
  const profile = await requireRole(["admin"]);
  const applications = await getAdminApplications();

  return (
    <DashboardShell
      title="Candidatures plateforme"
      description="Centralisez les dossiers candidats et accedez a leur fiche detaillee."
      profile={profile}
      currentPath="/app/admin/candidatures"
    >
      <ManagedApplicationsBoard
        applications={applications}
        basePath="/app/admin/candidatures"
      />
    </DashboardShell>
  );
}
