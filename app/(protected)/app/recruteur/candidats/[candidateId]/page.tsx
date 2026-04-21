import { notFound } from "next/navigation";

import { CandidateDetailWorkspace } from "@/components/candidates/candidate-detail-workspace";
import { requireRole } from "@/lib/auth";
import { getManagedCandidateDetail, getManagedJobs } from "@/lib/jobs";
import { rankJobsForCandidate } from "@/lib/matching";

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
  const [candidate, jobs] = await Promise.all([
    getManagedCandidateDetail(profile, candidateId),
    getManagedJobs(profile, { limit: 120 })
  ]);

  if (!candidate) {
    notFound();
  }

  const suggestedJobMatches = rankJobsForCandidate(candidate, jobs)
    .filter((entry) => entry.match.score >= 40)
    .slice(0, 3);

  return (
    <CandidateDetailWorkspace
      profile={profile}
      candidate={candidate}
      suggestedJobMatches={suggestedJobMatches}
      currentPath="/app/recruteur/candidats"
      backHref="/app/recruteur/candidats"
    />
  );
}
