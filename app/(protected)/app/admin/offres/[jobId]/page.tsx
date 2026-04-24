import { notFound } from "next/navigation";

import { JobManagementWorkspace } from "@/components/jobs/job-management-workspace";
import { requireRole } from "@/lib/auth";
import {
  getAdminApplications,
  getJobAuditEvents,
  getManagedCandidates,
  getManagedJobById
} from "@/lib/jobs";
import { getCompatibleUncontactedCandidateLeads } from "@/lib/job-compatible-candidate-leads";

type AdminJobDetailPageProps = {
  params: Promise<{
    jobId: string;
  }>;
};

export default async function AdminJobDetailPage({
  params
}: AdminJobDetailPageProps) {
  const profile = await requireRole(["admin"]);
  const { jobId } = await params;
  const [job, applications, candidates] = await Promise.all([
    getManagedJobById(profile, jobId),
    getAdminApplications({ limit: 600 }),
    getManagedCandidates(profile, { limit: 320 })
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
      currentPath="/app/admin/offres"
      backHref="/app/admin/offres"
    />
  );
}
