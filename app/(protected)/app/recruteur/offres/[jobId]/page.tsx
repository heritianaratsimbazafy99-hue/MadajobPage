import { notFound } from "next/navigation";

import { JobManagementWorkspace } from "@/components/jobs/job-management-workspace";
import { requireRole } from "@/lib/auth";
import {
  getJobAuditEvents,
  getManagedCandidates,
  getManagedJobById,
  getRecruiterApplications
} from "@/lib/jobs";
import { getCompatibleUncontactedCandidateLeads } from "@/lib/job-compatible-candidate-leads";

type RecruiterJobDetailPageProps = {
  params: Promise<{
    jobId: string;
  }>;
};

export default async function RecruiterJobDetailPage({
  params
}: RecruiterJobDetailPageProps) {
  const profile = await requireRole(["recruteur"]);
  const { jobId } = await params;
  const [job, applications, candidates] = await Promise.all([
    getManagedJobById(profile, jobId),
    getRecruiterApplications(profile, { limit: 400 }),
    getManagedCandidates(profile, { limit: 240 })
  ]);

  if (!job) {
    notFound();
  }

  const events = await getJobAuditEvents(profile, jobId);
  const relatedApplications = applications.filter((application) => application.job_id === job.id);
  const compatibleCandidateLeads = getCompatibleUncontactedCandidateLeads({
    job,
    candidates,
    applications,
    limit: 8
  });

  return (
    <JobManagementWorkspace
      profile={profile}
      job={job}
      events={events}
      relatedApplications={relatedApplications}
      compatibleCandidateLeads={compatibleCandidateLeads}
      currentPath="/app/recruteur/offres"
      backHref="/app/recruteur/offres"
    />
  );
}
