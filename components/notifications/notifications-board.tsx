"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  markAllNotificationsReadAction,
  markNotificationReadAction
} from "@/app/actions/notification-actions";
import { formatDisplayDate } from "@/lib/format";
import { getNotificationKindMeta } from "@/lib/notification-kind";
import type { AppNotification } from "@/lib/types";

type NotificationsBoardProps = {
  notifications: AppNotification[];
};

type Filters = {
  query: string;
  readState: "" | "unread" | "read";
  kind: string;
};

const initialFilters: Filters = {
  query: "",
  readState: "",
  kind: ""
};

function getUniqueKinds(notifications: AppNotification[]) {
  return Array.from(new Set(notifications.map((notification) => notification.kind))).sort((a, b) =>
    a.localeCompare(b, "fr")
  );
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

    return notifications.filter((notification) => {
      const kindMeta = getNotificationKindMeta(notification.kind);
      const matchesQuery =
        !query ||
        [notification.title, notification.body, kindMeta.label]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(query));

      const matchesReadState =
        !filters.readState ||
        (filters.readState === "unread" && !notification.is_read) ||
        (filters.readState === "read" && notification.is_read);

      const matchesKind = !filters.kind || notification.kind === filters.kind;

      return matchesQuery && matchesReadState && matchesKind;
    });
  }, [deferredQuery, filters.kind, filters.readState, notifications]);

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
            <h2>Retrouvez les evenements importants de votre espace</h2>
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
        </div>

        <div className="jobs-board__actions">
          <span className="form-caption">{unreadCount} notification(s) non lue(s)</span>
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
                  <span className="tag">
                    {notification.is_read ? "Lue" : "Non lue"}
                  </span>
                </div>

                <p>{notification.body}</p>

                <div className="job-card__meta">
                  <span>{kindMeta.description}</span>
                  <span>{formatDisplayDate(notification.created_at)}</span>
                </div>

                <div className="job-card__footer">
                  <small>
                    {notification.read_at
                      ? `Lue le ${formatDisplayDate(notification.read_at)}`
                      : "En attente de lecture"}
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
