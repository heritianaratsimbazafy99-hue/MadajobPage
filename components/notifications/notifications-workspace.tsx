import { DashboardShell } from "@/components/dashboard/shell";
import { NotificationsBoard } from "@/components/notifications/notifications-board";
import { formatDisplayDate } from "@/lib/format";
import type { AppNotification, Profile } from "@/lib/types";

type NotificationsWorkspaceProps = {
  profile: Profile;
  notifications: AppNotification[];
  currentPath: string;
  title: string;
  description: string;
};

export function NotificationsWorkspace({
  profile,
  notifications,
  currentPath,
  title,
  description
}: NotificationsWorkspaceProps) {
  const unreadCount = notifications.filter((notification) => !notification.is_read).length;
  const latestNotification = notifications[0] ?? null;
  const linkedCount = notifications.filter((notification) => Boolean(notification.link_href)).length;

  return (
    <DashboardShell
      title={title}
      description={description}
      profile={profile}
      currentPath={currentPath}
    >
      <section className="dashboard-grid dashboard-grid--four">
        <article className="panel metric-panel">
          <span>Total</span>
          <strong>{notifications.length}</strong>
          <small>notifications visibles dans votre espace</small>
        </article>
        <article className="panel metric-panel">
          <span>Non lues</span>
          <strong>{unreadCount}</strong>
          <small>elements a consulter rapidement</small>
        </article>
        <article className="panel metric-panel">
          <span>Actions directes</span>
          <strong>{linkedCount}</strong>
          <small>notifications avec lien vers un ecran de travail</small>
        </article>
        <article className="panel metric-panel">
          <span>Derniere activite</span>
          <strong>
            {latestNotification ? formatDisplayDate(latestNotification.created_at) : "Aucune"}
          </strong>
          <small>{latestNotification?.title ?? "aucune notification disponible"}</small>
        </article>
      </section>

      <NotificationsBoard notifications={notifications} />
    </DashboardShell>
  );
}
