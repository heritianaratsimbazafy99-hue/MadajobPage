import { AdminSupervisionWorkspace } from "@/components/admin/admin-supervision-workspace";
import { requireRole } from "@/lib/auth";
import {
  getAdminApplications,
  getAdminAuditEvents,
  getAdminSnapshot,
  getAdminUsers,
  getManagedCandidates,
  getManagedJobs,
  getManagedOrganizations
} from "@/lib/jobs";
import { getNotifications } from "@/lib/notifications";
import { getTransactionalEmails } from "@/lib/transactional-emails";

export default async function AdminDashboardPage() {
  const profile = await requireRole(["admin"]);
  const [
    snapshot,
    jobs,
    applications,
    candidates,
    users,
    organizations,
    emails,
    notifications,
    auditEvents
  ] = await Promise.all([
    getAdminSnapshot(),
    getManagedJobs(profile, { limit: 120 }),
    getAdminApplications({ limit: 120 }),
    getManagedCandidates(profile, { limit: 200 }),
    getAdminUsers(),
    getManagedOrganizations(),
    getTransactionalEmails({ limit: 80 }),
    getNotifications(profile.id, { limit: 40 }),
    getAdminAuditEvents({ limit: 18 })
  ]);

  return (
    <AdminSupervisionWorkspace
      profile={profile}
      snapshot={snapshot}
      jobs={jobs}
      applications={applications}
      candidates={candidates}
      users={users}
      organizations={organizations}
      emails={emails}
      notifications={notifications}
      auditEvents={auditEvents}
    />
  );
}
