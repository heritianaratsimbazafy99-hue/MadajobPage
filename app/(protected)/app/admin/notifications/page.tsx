import { NotificationsWorkspace } from "@/components/notifications/notifications-workspace";
import { requireRole } from "@/lib/auth";
import { getNotifications } from "@/lib/notifications";

export default async function AdminNotificationsPage() {
  const profile = await requireRole(["admin"]);
  const notifications = await getNotifications(profile.id);

  return (
    <NotificationsWorkspace
      profile={profile}
      notifications={notifications}
      currentPath="/app/admin/notifications"
      title="Notifications admin"
      description="Centralisez les evenements critiques de la plateforme et les actions internes a surveiller."
    />
  );
}
