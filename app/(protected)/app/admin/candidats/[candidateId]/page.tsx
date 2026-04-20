import { notFound } from "next/navigation";

import { CandidateDetailWorkspace } from "@/components/candidates/candidate-detail-workspace";
import { requireRole } from "@/lib/auth";
import { getManagedCandidateDetail } from "@/lib/jobs";

type AdminCandidateDetailPageProps = {
  params: Promise<{
    candidateId: string;
  }>;
};

export default async function AdminCandidateDetailPage({
  params
}: AdminCandidateDetailPageProps) {
  const profile = await requireRole(["admin"]);
  const { candidateId } = await params;
  const candidate = await getManagedCandidateDetail(profile, candidateId);

  if (!candidate) {
    notFound();
  }

  return (
    <CandidateDetailWorkspace
      profile={profile}
      candidate={candidate}
      currentPath="/app/admin/candidats"
      backHref="/app/admin/candidats"
    />
  );
}
