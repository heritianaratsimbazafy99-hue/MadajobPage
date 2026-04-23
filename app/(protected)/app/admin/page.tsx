import { AdminSupervisionWorkspace } from "@/components/admin/admin-supervision-workspace";
import { requireRole } from "@/lib/auth";
import {
  getAdminApplications,
  getAdminAuditEvents,
  getAdminSnapshot,
  getAdminUsers,
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
    users,
    organizations,
    emails,
    notifications,
    auditEvents
  ] = await Promise.all([
    getAdminSnapshot(),
    getManagedJobs(profile, { limit: 120 }),
    getAdminApplications({ limit: 120 }),
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
      users={users}
      organizations={organizations}
      emails={emails}
      notifications={notifications}
      auditEvents={auditEvents}
    />
  );
}
