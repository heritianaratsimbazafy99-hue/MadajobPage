"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  markAllNotificationsReadAction,
  markNotificationReadAction
} from "@/app/actions/notification-actions";
import { formatDisplayDate } from "@/lib/format";
import {
  getNotificationActionLabel,
  getNotificationPriorityScore,
  getNotificationSummaryText,
  getNotificationTone,
  isApplicationNotification,
  isInterviewNotification,
  isPriorityNotification,
  type NotificationFocus,
  type NotificationSort
} from "@/lib/notification-insights";
import { getNotificationKindMeta } from "@/lib/notification-kind";
import type { AppNotification } from "@/lib/types";

type NotificationsBoardProps = {
  notifications: AppNotification[];
};

type Filters = {
  query: string;
  readState: "" | "unread" | "read";
  kind: string;
  focus: NotificationFocus;
  sort: NotificationSort;
};

const initialFilters: Filters = {
  query: "",
  readState: "",
  kind: "",
  focus: "",
  sort: "priority_desc"
};

function getUniqueKinds(notifications: AppNotification[]) {
  return Array.from(new Set(notifications.map((notification) => notification.kind))).sort((a, b) =>
    a.localeCompare(b, "fr")
  );
}

function getNotificationSortDate(notification: AppNotification) {
  return notification.read_at || notification.created_at;
}

function getPriorityLabel(score: number) {
  if (score >= 320) {
    return "A traiter vite";
  }

  if (score >= 220) {
    return "A surveiller";
  }

  return "Information";
}

export function NotificationsBoard({ notifications }: NotificationsBoardProps) {
  const router = useRouter();
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [pendingNotificationId, setPendingNotificationId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const deferredQuery = useDeferredValue(filters.query);
  const kindOptions = useMemo(() => getUniqueKinds(notifications), [notifications]);
  const unreadCount = notifications.filter((notification) => !notification.is_read).length;

  const filteredNotifications = useMemo(() => {
    const query = deferredQuery.trim().toLowerCase();

    const matchingNotifications = notifications.filter((notification) => {
      const kindMeta = getNotificationKindMeta(notification.kind);
      const matchesQuery =
        !query ||
        [notification.title, notification.body, kindMeta.label, kindMeta.description]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(query));

      const matchesReadState =
        !filters.readState ||
        (filters.readState === "unread" && !notification.is_read) ||
        (filters.readState === "read" && notification.is_read);

      const matchesKind = !filters.kind || notification.kind === filters.kind;
      const matchesFocus =
        !filters.focus ||
        (filters.focus === "priority" && isPriorityNotification(notification)) ||
        (filters.focus === "interviews" && isInterviewNotification(notification.kind)) ||
        (filters.focus === "applications" && isApplicationNotification(notification.kind)) ||
        (filters.focus === "linked" && Boolean(notification.link_href));

      return matchesQuery && matchesReadState && matchesKind && matchesFocus;
    });

    return matchingNotifications.sort((left, right) => {
      if (filters.sort === "priority_desc") {
        const leftScore = getNotificationPriorityScore(left);
        const rightScore = getNotificationPriorityScore(right);

        if (leftScore !== rightScore) {
          return rightScore - leftScore;
        }
      }

      const leftDate = new Date(getNotificationSortDate(left)).getTime();
      const rightDate = new Date(getNotificationSortDate(right)).getTime();

      return filters.sort === "oldest" ? leftDate - rightDate : rightDate - leftDate;
    });
  }, [
    deferredQuery,
    filters.focus,
    filters.kind,
    filters.readState,
    filters.sort,
    notifications
  ]);

  const notificationStats = useMemo(() => {
    let priority = 0;
    let linked = 0;
    let interviews = 0;
    let unread = 0;

    for (const notification of filteredNotifications) {
      if (!notification.is_read) {
        unread += 1;
      }

      if (isPriorityNotification(notification)) {
        priority += 1;
      }

      if (notification.link_href) {
        linked += 1;
      }

      if (isInterviewNotification(notification.kind)) {
        interviews += 1;
      }
    }

    return {
      priority,
      linked,
      interviews,
      unread
    };
  }, [filteredNotifications]);

  const activeFilterCount = [
    filters.query,
    filters.readState,
    filters.kind,
    filters.focus,
    filters.sort !== "priority_desc" ? filters.sort : ""
  ].filter(Boolean).length;

  async function handleMarkRead(notificationId: string) {
    setPendingNotificationId(notificationId);

    try {
      await markNotificationReadAction(notificationId);
      startTransition(() => {
        router.refresh();
      });
    } finally {
      setPendingNotificationId(null);
    }
  }

  async function handleMarkAllRead() {
    await markAllNotificationsReadAction();
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <div className="jobs-board">
      <section className="dashboard-form">
        <div className="dashboard-form__head">
          <div>
            <p className="eyebrow">Centre de notifications</p>
            <h2>Priorisez les evenements puis basculez vers le bon ecran</h2>
          </div>
          <span className="tag">{filteredNotifications.length} notification(s)</span>
        </div>

        <div className="form-grid">
          <label className="field field--full">
            <span>Recherche</span>
            <input
              value={filters.query}
              onChange={(event) =>
                setFilters((previous) => ({
                  ...previous,
                  query: event.target.value
                }))
              }
              placeholder="Titre, contenu, type..."
            />
          </label>

          <label className="field">
            <span>Etat</span>
            <select
              value={filters.readState}
              onChange={(event) =>
                setFilters((previous) => ({
                  ...previous,
                  readState: event.target.value as Filters["readState"]
                }))
              }
            >
              <option value="">Toutes</option>
              <option value="unread">Non lues</option>
              <option value="read">Lues</option>
            </select>
          </label>

          <label className="field">
            <span>Type</span>
            <select
              value={filters.kind}
              onChange={(event) =>
                setFilters((previous) => ({
                  ...previous,
                  kind: event.target.value
                }))
              }
            >
              <option value="">Tous les types</option>
              {kindOptions.map((kind) => (
                <option key={kind} value={kind}>
                  {getNotificationKindMeta(kind).label}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Focus</span>
            <select
              value={filters.focus}
              onChange={(event) =>
                setFilters((previous) => ({
                  ...previous,
                  focus: event.target.value as NotificationFocus
                }))
              }
            >
              <option value="">Vue globale</option>
              <option value="priority">A traiter vite</option>
              <option value="interviews">Entretiens</option>
              <option value="applications">Candidatures</option>
              <option value="linked">Avec ecran lie</option>
            </select>
          </label>

          <label className="field">
            <span>Tri</span>
            <select
              value={filters.sort}
              onChange={(event) =>
                setFilters((previous) => ({
                  ...previous,
                  sort: event.target.value as NotificationSort
                }))
              }
            >
              <option value="priority_desc">Priorite</option>
              <option value="recent">Plus recentes</option>
              <option value="oldest">Plus anciennes</option>
            </select>
          </label>
        </div>

        <div className="interviews-board__stats">
          <article className="document-card">
            <strong>{notificationStats.priority}</strong>
            <p>notification(s) prioritaires</p>
          </article>
          <article className="document-card">
            <strong>{notificationStats.unread}</strong>
            <p>non lue(s) dans la vue</p>
          </article>
          <article className="document-card">
            <strong>{notificationStats.interviews}</strong>
            <p>evenement(s) entretien</p>
          </article>
          <article className="document-card">
            <strong>{notificationStats.linked}</strong>
            <p>avec ecran d'action</p>
          </article>
        </div>

        <div className="jobs-board__actions">
          <span className="form-caption">
            {activeFilterCount > 0
              ? `${activeFilterCount} filtre(s) actif(s). Les notifications les plus urgentes remontent en tete.`
              : "Les notifications non lues, liees a des entretiens ou a des ecrans d'action sont priorisees."}
          </span>
          {unreadCount > 0 ? (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleMarkAllRead}
              disabled={isPending}
            >
              {isPending ? "Mise a jour..." : "Tout marquer comme lu"}
            </button>
          ) : null}
        </div>
      </section>

      <section className="dashboard-list">
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((notification) => {
            const kindMeta = getNotificationKindMeta(notification.kind);
            const tone = getNotificationTone(notification);
            const priorityScore = getNotificationPriorityScore(notification);

            return (
              <article
                key={notification.id}
                className={[
                  "panel list-card dashboard-card notification-card",
                  !notification.is_read ? "is-unread" : ""
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <div className="dashboard-card__top">
                  <div>
                    <h3>{notification.title}</h3>
                    <p>{kindMeta.label}</p>
                  </div>
                  <div className="dashboard-card__badges">
                    <span className={`tag tag--${tone}`}>{getPriorityLabel(priorityScore)}</span>
                    <span className="tag">{notification.is_read ? "Lue" : "Non lue"}</span>
                  </div>
                </div>

                <p>{notification.body}</p>

                <div className="job-card__meta">
                  <span>{kindMeta.description}</span>
                  <span>{formatDisplayDate(notification.created_at)}</span>
                </div>

                <div className="notification-signal-card">
                  <strong>{getNotificationActionLabel(notification)}</strong>
                  <p>{getNotificationSummaryText(notification)}</p>
                  <small>
                    {notification.read_at
                      ? `Lue le ${formatDisplayDate(notification.read_at)}`
                      : "En attente de lecture"}
                  </small>
                </div>

                <div className="job-card__footer">
                  <small>
                    {notification.link_href
                      ? "Cette notification pointe directement vers l'ecran de traitement correspondant."
                      : "Cette notification est informative et reste archivable une fois verifiee."}
                  </small>
                  <div className="notification-card__actions">
                    {notification.link_href ? (
                      <Link href={notification.link_href}>Ouvrir</Link>
                    ) : null}
                    {!notification.is_read ? (
                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => handleMarkRead(notification.id)}
                        disabled={pendingNotificationId === notification.id}
                      >
                        {pendingNotificationId === notification.id
                          ? "Mise a jour..."
                          : "Marquer comme lue"}
                      </button>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })
        ) : (
          <article className="panel jobs-empty">
            <h2>Aucune notification pour le moment</h2>
            <p>Les evenements importants de votre espace apparaitront ici automatiquement.</p>
          </article>
        )}
      </section>
    </div>
  );
}
