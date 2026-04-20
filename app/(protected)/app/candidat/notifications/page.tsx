import { NotificationsWorkspace } from "@/components/notifications/notifications-workspace";
import { requireRole } from "@/lib/auth";
import { getNotifications } from "@/lib/notifications";

export default async function CandidateNotificationsPage() {
  const profile = await requireRole(["candidat"]);
  const notifications = await getNotifications(profile.id);

  return (
    <NotificationsWorkspace
      profile={profile}
      notifications={notifications}
      currentPath="/app/candidat/notifications"
      title="Mes notifications"
      description="Suivez les confirmations de candidature et les evolutions importantes de votre espace candidat."
    />
  );
}
