import { notFound } from "next/navigation";

import { JobManagementWorkspace } from "@/components/jobs/job-management-workspace";
import { requireRole } from "@/lib/auth";
import { getJobAuditEvents, getManagedJobById } from "@/lib/jobs";

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
  const job = await getManagedJobById(profile, jobId);

  if (!job) {
    notFound();
  }

  const events = await getJobAuditEvents(profile, jobId);

  return (
    <JobManagementWorkspace
      profile={profile}
      job={job}
      events={events}
      currentPath="/app/recruteur/offres"
      backHref="/app/recruteur/offres"
    />
  );
}
