import { ReportingWorkspace } from "@/components/reporting/reporting-workspace";
import { requireRole } from "@/lib/auth";
import {
  getAdminApplications,
  getManagedCandidates,
  getManagedJobs
} from "@/lib/jobs";

export default async function AdminReportingPage() {
  const profile = await requireRole(["admin"]);
  const [jobs, applications, candidates] = await Promise.all([
    getManagedJobs(profile, { limit: 500 }),
    getAdminApplications({ limit: 500 }),
    getManagedCandidates(profile, { limit: 1000 })
  ]);

  return (
    <ReportingWorkspace
      profile={profile}
      currentPath="/app/admin/reporting"
      title="Exports & reporting"
      description="Centralisez les exports plateforme et lisez les volumes globaux depuis un module dedie."
      jobs={jobs}
      applications={applications}
      candidates={candidates}
    />
  );
}
