import { InterviewsWorkspace } from "@/components/interviews/interviews-workspace";
import { requireRole } from "@/lib/auth";
import { getManagedJobs, getRecruiterInterviews } from "@/lib/jobs";

export default async function RecruiterInterviewsPage() {
  const profile = await requireRole(["recruteur"]);
  const [interviews, jobs] = await Promise.all([
    getRecruiterInterviews(profile, { limit: 240 }),
    getManagedJobs(profile, { limit: 240 })
  ]);

  return (
    <InterviewsWorkspace
      profile={profile}
      interviews={interviews}
      jobs={jobs}
      currentPath="/app/recruteur/entretiens"
      title="Entretiens"
      description="Centralisez les rendez-vous planifies, gardez le lien avec chaque dossier et suivez les entretiens a venir sans sortir du pipeline."
    />
  );
}
