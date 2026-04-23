import { notFound } from "next/navigation";

import { JobManagementWorkspace } from "@/components/jobs/job-management-workspace";
import { requireRole } from "@/lib/auth";
import {
  getAdminApplications,
  getJobAuditEvents,
  getManagedCandidates,
  getManagedJobById
} from "@/lib/jobs";
import { getCandidateJobMatch } from "@/lib/matching";

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
  const appliedCandidateIds = new Set(
    relatedApplications
      .map((application) => application.candidate_id)
      .filter(Boolean)
  );
  const suggestedCandidates = candidates
    .filter((candidate) => !appliedCandidateIds.has(candidate.id))
    .map((candidate) => ({
      candidate,
      match: getCandidateJobMatch(candidate, job)
    }))
    .filter((entry) => entry.match.score >= 40)
    .sort((left, right) => right.match.score - left.match.score)
    .slice(0, 4);

  return (
    <JobManagementWorkspace
      profile={profile}
      job={job}
      events={events}
      relatedApplications={relatedApplications}
      suggestedCandidates={suggestedCandidates}
      currentPath="/app/admin/offres"
      backHref="/app/admin/offres"
    />
  );
}
