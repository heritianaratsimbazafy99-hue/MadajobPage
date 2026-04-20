import { NotificationsWorkspace } from "@/components/notifications/notifications-workspace";
import { requireRole } from "@/lib/auth";
import { getNotifications } from "@/lib/notifications";

export default async function RecruiterNotificationsPage() {
  const profile = await requireRole(["recruteur"]);
  const notifications = await getNotifications(profile.id);

  return (
    <NotificationsWorkspace
      profile={profile}
      notifications={notifications}
      currentPath="/app/recruteur/notifications"
      title="Notifications recruteur"
      description="Retrouvez les nouvelles candidatures et les evenements de pilotage importants de votre perimetre recruteur."
    />
  );
}
