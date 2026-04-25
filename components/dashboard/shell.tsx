import Link from "next/link";
import type { ReactNode } from "react";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { UnreadNotificationsNavLink } from "@/components/notifications/unread-notifications-nav-link";
import {
  getDashboardNavigation,
  getDashboardPrimaryAction,
  getDashboardRoleLabel
} from "@/lib/dashboard-navigation";
import { getNotificationsPath } from "@/lib/notification-path";
import { getUnreadNotificationsCount } from "@/lib/notifications";
import type { Profile } from "@/lib/types";

type DashboardShellProps = {
  title: string;
  description: string;
  profile: Profile;
  currentPath: string;
  children: ReactNode;
};

export async function DashboardShell({
  title,
  description,
  profile,
  currentPath,
  children
}: DashboardShellProps) {
  const nav = getDashboardNavigation(profile.role);
  const action = getDashboardPrimaryAction(profile.role);
  const roleLabel = getDashboardRoleLabel(profile.role);
  const profileName = profile.full_name || profile.email || "Utilisateur";
  const notificationsPath = getNotificationsPath(profile.role);
  const unreadNotificationsCount = await getUnreadNotificationsCount(profile.id);

  function renderNavItems(mode: "sidebar" | "mobile") {
    return nav.map((item) => {
      const isActive = item.href === currentPath;

      if (item.href === notificationsPath) {
        if (mode === "mobile") {
          return (
            <Link
              key={item.href}
              href={item.href}
              className={["dashboard-nav__item", isActive ? "is-active" : ""].filter(Boolean).join(" ")}
            >
              <div className="dashboard-nav__title">
                <strong>{item.label}</strong>
                {unreadNotificationsCount > 0 ? (
                  <span className="dashboard-notification-badge">{unreadNotificationsCount > 99 ? "99+" : unreadNotificationsCount}</span>
                ) : null}
              </div>
              <small>{item.hint}</small>
            </Link>
          );
        }

        return (
          <UnreadNotificationsNavLink
            key={item.href}
            href={item.href}
            label={item.label}
            hint={item.hint}
            isActive={isActive}
            initialCount={unreadNotificationsCount}
          />
        );
      }

      return (
        <Link
          key={item.href}
          href={item.href}
          className={["dashboard-nav__item", isActive ? "is-active" : ""].filter(Boolean).join(" ")}
        >
          <div className="dashboard-nav__title">
            <strong>{item.label}</strong>
          </div>
          <small>{item.hint}</small>
        </Link>
      );
    });
  }

  return (
    <div className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <div className="dashboard-sidebar__primary">
          <div className="dashboard-sidebar__head">
            <Link href="/app" className="dashboard-brand">
              <span className="dashboard-brand__mark">MJ</span>
              <span className="dashboard-brand__copy">
                <strong>Madajob Platform</strong>
                <small>Espace {roleLabel.toLowerCase()}</small>
              </span>
            </Link>

            <div className="dashboard-user">
              <span className="dashboard-status">Session active</span>
              <strong>{profileName}</strong>
              <span>{profile.email || "Compte connecte"}</span>
            </div>
          </div>

          <nav className="dashboard-nav">{renderNavItems("sidebar")}</nav>
        </div>

        <div className="dashboard-sidebar__actions">
          <Link className="btn btn-ghost btn-block" href="/">
            Retour au site Madajob
          </Link>
          <SignOutButton className="btn-block" />
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-appbar">
          <div className="dashboard-appbar__identity">
            <span className="dashboard-kicker">Plateforme Madajob</span>
            <strong>{roleLabel}</strong>
          </div>

          <div className="dashboard-appbar__actions">
            <Link className="dashboard-notification-link" href={notificationsPath}>
              Notifications
              {unreadNotificationsCount > 0 ? (
                <span className="dashboard-notification-badge">{unreadNotificationsCount > 99 ? "99+" : unreadNotificationsCount}</span>
              ) : null}
            </Link>
            <Link className="btn btn-primary dashboard-primary-action" href={action.href}>
              {action.label}
            </Link>
          </div>
        </header>

        <section className="dashboard-toolbar">
          <div className="dashboard-toolbar__title">
            <h1>{title}</h1>
            <p>{description}</p>
          </div>
        </section>

        <div className="dashboard-mobile-nav">{renderNavItems("mobile")}</div>

        <div className="dashboard-content">{children}</div>
      </main>
    </div>
  );
}
