import { PlatformHealthWorkspace } from "@/components/admin/platform-health-workspace";
import { requireRole } from "@/lib/auth";
import { getPlatformHealthSnapshot } from "@/lib/platform-health";
import { getTransactionalEmails } from "@/lib/transactional-emails";
import { getAdminUsers } from "@/lib/jobs";

export default async function AdminPlatformHealthPage() {
  const profile = await requireRole(["admin"]);
  const [emails, users] = await Promise.all([
    getTransactionalEmails({ limit: 250 }),
    getAdminUsers()
  ]);
  const health = await getPlatformHealthSnapshot({ emails, users });

  return <PlatformHealthWorkspace profile={profile} health={health} />;
}
