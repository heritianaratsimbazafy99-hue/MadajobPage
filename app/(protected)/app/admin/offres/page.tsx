import { DashboardShell } from "@/components/dashboard/shell";
import { ManagedJobsBoard } from "@/components/jobs/managed-jobs-board";
import { requireRole } from "@/lib/auth";
import { getManagedJobs } from "@/lib/jobs";

export default async function AdminJobsPage() {
  const profile = await requireRole(["admin"]);
  const jobs = await getManagedJobs(profile);

  return (
    <DashboardShell
      title="Offres et diffusion"
      description="Supervisez les annonces, leur statut et leur historique depuis un module dedie."
      profile={profile}
      currentPath="/app/admin/offres"
    >
      <ManagedJobsBoard jobs={jobs} basePath="/app/admin/offres" />
    </DashboardShell>
  );
}
