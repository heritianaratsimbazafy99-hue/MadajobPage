import { InterviewsWorkspace } from "@/components/interviews/interviews-workspace";
import { requireRole } from "@/lib/auth";
import { getAdminInterviews, getManagedJobs } from "@/lib/jobs";

export default async function AdminInterviewsPage() {
  const profile = await requireRole(["admin"]);
  const [interviews, jobs] = await Promise.all([
    getAdminInterviews({ limit: 320 }),
    getManagedJobs(profile, { limit: 320 })
  ]);

  return (
    <InterviewsWorkspace
      profile={profile}
      interviews={interviews}
      jobs={jobs}
      currentPath="/app/admin/entretiens"
      title="Entretiens"
      description="Supervisez les rendez-vous planifies sur toute la plateforme, reperez les entretiens du jour et gardez un acces direct aux dossiers critiques."
    />
  );
}
