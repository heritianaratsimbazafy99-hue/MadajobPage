import { RecruiterSupervisionWorkspace } from "@/components/recruiter/recruiter-supervision-workspace";
import { requireRole } from "@/lib/auth";
import {
  getManagedCandidates,
  getManagedJobs,
  getRecruiterApplications,
  getRecruiterSnapshot
} from "@/lib/jobs";
import { getNotifications } from "@/lib/notifications";

export default async function RecruiterDashboardPage() {
  const profile = await requireRole(["recruteur"]);
  const [snapshot, jobs, applications, candidates, notifications] = await Promise.all([
    getRecruiterSnapshot(profile),
    getManagedJobs(profile, { limit: 120 }),
    getRecruiterApplications(profile, { limit: 120 }),
    getManagedCandidates(profile, { limit: 200 }),
    getNotifications(profile.id, { limit: 40 })
  ]);

  return (
    <RecruiterSupervisionWorkspace
      profile={profile}
      snapshot={snapshot}
      jobs={jobs}
      applications={applications}
      candidates={candidates}
      notifications={notifications}
    />
  );
}
