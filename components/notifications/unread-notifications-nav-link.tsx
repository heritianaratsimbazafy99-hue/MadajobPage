"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type UnreadNotificationsNavLinkProps = {
  href: string;
  label: string;
  hint: string;
  isActive: boolean;
  initialCount: number;
};

const POLL_INTERVAL_MS = 90_000;

function formatUnreadCount(count: number) {
  if (count > 99) {
    return "99+";
  }

  return String(count);
}

export function UnreadNotificationsNavLink({
  href,
  label,
  hint,
  isActive,
  initialCount
}: UnreadNotificationsNavLinkProps) {
  const [unreadCount, setUnreadCount] = useState(initialCount);

  useEffect(() => {
    let isCancelled = false;

    async function refreshUnreadCount() {
      try {
        const response = await fetch("/api/notifications/unread-count", {
          method: "GET",
          cache: "no-store"
        });

        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as { unreadCount?: number };

        if (!isCancelled && typeof data.unreadCount === "number") {
          setUnreadCount(data.unreadCount);
        }
      } catch {
        // Silent failure: the server-rendered initial count remains visible.
      }
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        void refreshUnreadCount();
      }
    }

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void refreshUnreadCount();
      }
    }, POLL_INTERVAL_MS);

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      isCancelled = true;
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return (
    <Link
      href={href}
      className={["dashboard-nav__item", isActive ? "is-active" : ""].filter(Boolean).join(" ")}
    >
      <div className="dashboard-nav__title">
        <strong>{label}</strong>
        {unreadCount > 0 ? (
          <span className="dashboard-notification-badge">{formatUnreadCount(unreadCount)}</span>
        ) : null}
      </div>
      <small>{hint}</small>
    </Link>
  );
}
