import { DashboardShell } from "@/components/dashboard/shell";
import { ManagedJobsBoard } from "@/components/jobs/managed-jobs-board";
import { requireRole } from "@/lib/auth";
import { getManagedJobs } from "@/lib/jobs";

export default async function RecruiterJobsPage() {
  const profile = await requireRole(["recruteur"]);
  const jobs = await getManagedJobs(profile);

  return (
    <DashboardShell
      title="Gestion des offres"
      description="Retrouvez toutes vos annonces, ouvrez leur fiche detaillee et pilotez leur cycle de vie."
      profile={profile}
      currentPath="/app/recruteur/offres"
    >
      <ManagedJobsBoard jobs={jobs} basePath="/app/recruteur/offres" />
    </DashboardShell>
  );
}
