import { AdminSupervisionWorkspace } from "@/components/admin/admin-supervision-workspace";
import { requireRole } from "@/lib/auth";
import {
  getAdminApplications,
  getAdminAuditEvents,
  getAdminSnapshot,
  getAdminUsers,
  getAdminOrganizations,
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
    organizationOptions,
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
    getAdminOrganizations(),
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
      organizationOptions={organizationOptions}
      emails={emails}
      notifications={notifications}
      auditEvents={auditEvents}
    />
  );
}
