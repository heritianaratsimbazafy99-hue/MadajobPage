import { ReportingWorkspace } from "@/components/reporting/reporting-workspace";
import { requireRole } from "@/lib/auth";
import {
  getManagedCandidates,
  getManagedJobs,
  getRecruiterApplications
} from "@/lib/jobs";

export default async function RecruiterReportingPage() {
  const profile = await requireRole(["recruteur"]);
  const [jobs, applications, candidates] = await Promise.all([
    getManagedJobs(profile, { limit: 500 }),
    getRecruiterApplications(profile, { limit: 500 }),
    getManagedCandidates(profile, { limit: 500 })
  ]);

  return (
    <ReportingWorkspace
      profile={profile}
      currentPath="/app/recruteur/reporting"
      title="Exports & reporting"
      description="Suivez vos volumes et exportez vos offres, candidatures et candidats depuis votre perimetre recruteur."
      jobs={jobs}
      applications={applications}
      candidates={candidates}
    />
  );
}
