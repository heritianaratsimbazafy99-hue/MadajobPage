import { notFound } from "next/navigation";

import { ApplicationDetailWorkspace } from "@/components/jobs/application-detail-workspace";
import { requireRole } from "@/lib/auth";
import { getApplicationDetail } from "@/lib/jobs";

type RecruiterApplicationDetailPageProps = {
  params: Promise<{
    applicationId: string;
  }>;
};

export default async function RecruiterApplicationDetailPage({
  params
}: RecruiterApplicationDetailPageProps) {
  const profile = await requireRole(["recruteur"]);
  const { applicationId } = await params;
  const application = await getApplicationDetail(profile, applicationId);

  if (!application) {
    notFound();
  }

  return (
    <ApplicationDetailWorkspace
      profile={profile}
      application={application}
      currentPath="/app/recruteur/candidatures"
      backHref="/app/recruteur/candidatures"
    />
  );
}
