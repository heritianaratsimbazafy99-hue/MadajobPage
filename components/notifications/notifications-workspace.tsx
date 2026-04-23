import { DashboardShell } from "@/components/dashboard/shell";
import { NotificationsBoard } from "@/components/notifications/notifications-board";
import { formatDisplayDate } from "@/lib/format";
import {
  getNotificationSummaryText,
  getNotificationTone,
  summarizeNotifications
} from "@/lib/notification-insights";
import { getNotificationKindMeta } from "@/lib/notification-kind";
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
  const summary = summarizeNotifications(notifications);
  const topNotification = summary.topNotification;
  const topNotificationMeta = topNotification ? getNotificationKindMeta(topNotification.kind) : null;
  const topNotificationTone = topNotification ? getNotificationTone(topNotification) : "muted";

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
          <span>Prioritaires</span>
          <strong>{summary.priorityCount}</strong>
          <small>elements a traiter ou verifier rapidement</small>
        </article>
        <article className="panel metric-panel">
          <span>Non lues</span>
          <strong>{summary.unreadCount}</strong>
          <small>elements encore en attente de lecture</small>
        </article>
        <article className="panel metric-panel">
          <span>Derniere activite</span>
          <strong>
            {summary.latestNotification ? formatDisplayDate(summary.latestNotification.created_at) : "Aucune"}
          </strong>
          <small>{summary.latestNotification?.title ?? "aucune notification disponible"}</small>
        </article>
      </section>

      <section className="dashboard-form">
        <div className="dashboard-form__head">
          <div>
            <p className="eyebrow">Centre d'action</p>
            <h2>Ce qui merite votre attention maintenant</h2>
          </div>
          <span className={`tag tag--${topNotificationTone}`}>
            {topNotificationMeta?.label ?? "Vue globale"}
          </span>
        </div>

        <div className="notifications-summary-grid">
          <article className="document-card notification-signal-card notification-signal-card--surface">
            <strong>{topNotification?.title ?? "Aucune alerte active"}</strong>
            <p>
              {topNotification
                ? getNotificationSummaryText(topNotification)
                : "Les prochains evenements importants de votre espace remonteront ici automatiquement."}
            </p>
            <small>
              {topNotification
                ? `${topNotificationMeta?.label ?? "Notification"} · ${formatDisplayDate(topNotification.created_at)}`
                : "Le centre de notifications se met a jour sans rechargement manuel."}
            </small>
          </article>

          <article className="document-card notification-signal-card notification-signal-card--surface">
            <strong>Vue d'ensemble</strong>
            <p>
              {summary.linkedCount} notification(s) renvoient vers un ecran de traitement, dont{" "}
              {summary.interviewCount} evenement(s) d'entretien et {summary.applicationCount} lie(s)
              aux candidatures.
            </p>
            <small>
              Utilisez les filtres pour basculer rapidement entre priorites, entretiens et suivi de
              candidature.
            </small>
          </article>
        </div>
      </section>

      <NotificationsBoard notifications={notifications} />
    </DashboardShell>
  );
}
