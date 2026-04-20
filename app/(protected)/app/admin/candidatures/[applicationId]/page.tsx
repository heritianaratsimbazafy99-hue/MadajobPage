import { notFound } from "next/navigation";

import { ApplicationDetailWorkspace } from "@/components/jobs/application-detail-workspace";
import { requireRole } from "@/lib/auth";
import { getApplicationDetail } from "@/lib/jobs";

type AdminApplicationDetailPageProps = {
  params: Promise<{
    applicationId: string;
  }>;
};

export default async function AdminApplicationDetailPage({
  params
}: AdminApplicationDetailPageProps) {
  const profile = await requireRole(["admin"]);
  const { applicationId } = await params;
  const application = await getApplicationDetail(profile, applicationId);

  if (!application) {
    notFound();
  }

  return (
    <ApplicationDetailWorkspace
      profile={profile}
      application={application}
      currentPath="/app/admin/candidatures"
      backHref="/app/admin/candidatures"
    />
  );
}
