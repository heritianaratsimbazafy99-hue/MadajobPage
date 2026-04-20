import { notFound } from "next/navigation";

import { JobManagementWorkspace } from "@/components/jobs/job-management-workspace";
import { requireRole } from "@/lib/auth";
import { getJobAuditEvents, getManagedJobById } from "@/lib/jobs";

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
      currentPath="/app/admin/offres"
      backHref="/app/admin/offres"
    />
  );
}
