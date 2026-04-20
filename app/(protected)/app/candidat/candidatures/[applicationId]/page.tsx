import { notFound } from "next/navigation";

import { CandidateApplicationDetailWorkspace } from "@/components/jobs/candidate-application-detail-workspace";
import { requireRole } from "@/lib/auth";
import { getCandidateApplicationDetail } from "@/lib/jobs";

type CandidateApplicationDetailPageProps = {
  params: Promise<{
    applicationId: string;
  }>;
};

export default async function CandidateApplicationDetailPage({
  params
}: CandidateApplicationDetailPageProps) {
  const profile = await requireRole(["candidat"]);
  const { applicationId } = await params;
  const application = await getCandidateApplicationDetail(profile, applicationId);

  if (!application) {
    notFound();
  }

  return (
    <CandidateApplicationDetailWorkspace
      profile={profile}
      application={application}
    />
  );
}
