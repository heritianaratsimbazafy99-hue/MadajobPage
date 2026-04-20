import { notFound } from "next/navigation";

import { CandidateDetailWorkspace } from "@/components/candidates/candidate-detail-workspace";
import { requireRole } from "@/lib/auth";
import { getManagedCandidateDetail } from "@/lib/jobs";

type RecruiterCandidateDetailPageProps = {
  params: Promise<{
    candidateId: string;
  }>;
};

export default async function RecruiterCandidateDetailPage({
  params
}: RecruiterCandidateDetailPageProps) {
  const profile = await requireRole(["recruteur"]);
  const { candidateId } = await params;
  const candidate = await getManagedCandidateDetail(profile, candidateId);

  if (!candidate) {
    notFound();
  }

  return (
    <CandidateDetailWorkspace
      profile={profile}
      candidate={candidate}
      currentPath="/app/recruteur/candidats"
      backHref="/app/recruteur/candidats"
    />
  );
}
