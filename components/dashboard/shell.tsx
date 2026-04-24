import Link from "next/link";
import type { ReactNode } from "react";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { UnreadNotificationsNavLink } from "@/components/notifications/unread-notifications-nav-link";
import { getNotificationsPath } from "@/lib/notification-path";
import { getUnreadNotificationsCount } from "@/lib/notifications";
import type { AppRole, Profile } from "@/lib/types";

type DashboardShellProps = {
  title: string;
  description: string;
  profile: Profile;
  currentPath: string;
  children: ReactNode;
};

type NavItem = {
  href: string;
  label: string;
  hint: string;
};

const roleLabel: Record<AppRole, string> = {
  candidat: "Candidat",
  recruteur: "Recruteur",
  admin: "Admin"
};

const navByRole: Record<AppRole, NavItem[]> = {
  candidat: [
    { href: "/app/candidat", label: "Tableau de bord", hint: "Profil, CV et candidatures" },
    { href: "/app/candidat/candidatures", label: "Mes candidatures", hint: "Filtrer et suivre vos dossiers" },
    { href: "/app/candidat/documents", label: "Documents", hint: "Centraliser CV et pieces utiles" },
    { href: "/app/candidat/alertes", label: "Alertes offres", hint: "Voir les offres compatibles" },
    { href: "/app/candidat/notifications", label: "Notifications", hint: "Suivre les evolutions importantes" },
    { href: "/app/candidat/offres", label: "Offres", hint: "Explorer les postes ouverts" }
  ],
  recruteur: [
    { href: "/app/recruteur", label: "Tableau de bord", hint: "Offres, pipeline et suivi" },
    { href: "/app/recruteur/offres", label: "Mes offres", hint: "Editer, publier et fermer vos annonces" },
    { href: "/app/recruteur/candidatures", label: "Candidatures", hint: "Traiter les dossiers recus" },
    { href: "/app/recruteur/shortlist", label: "Shortlist", hint: "Travailler les meilleurs profils" },
    { href: "/app/recruteur/entretiens", label: "Entretiens", hint: "Piloter les rendez-vous candidats" },
    { href: "/app/recruteur/candidats", label: "Candidats", hint: "Explorer votre base profils" },
    { href: "/app/recruteur/cvtheque", label: "CVtheque", hint: "Importer et matcher des CV" },
    { href: "/app/recruteur/notifications", label: "Notifications", hint: "Voir les alertes internes" },
    { href: "/app/recruteur/reporting", label: "Reporting", hint: "Exporter et suivre vos volumes" },
    { href: "/carrieres", label: "Site carriere", hint: "Voir les annonces publiques" }
  ],
  admin: [
    { href: "/app/admin", label: "Supervision", hint: "Piloter la plateforme" },
    { href: "/app/admin/offres", label: "Offres", hint: "Controler les annonces et leur historique" },
    { href: "/app/admin/candidatures", label: "Candidatures", hint: "Suivre les dossiers candidats" },
    { href: "/app/admin/shortlist", label: "Shortlist", hint: "Prioriser les dossiers avances" },
    { href: "/app/admin/entretiens", label: "Entretiens", hint: "Superviser les rendez-vous en cours" },
    { href: "/app/admin/candidats", label: "Candidats", hint: "Centraliser la base profils" },
    { href: "/app/admin/cvtheque", label: "CVtheque", hint: "Importer et matcher des CV" },
    { href: "/app/admin/organisations", label: "Organisations", hint: "Piloter les entites clientes et internes" },
    { href: "/app/admin/utilisateurs", label: "Utilisateurs", hint: "Gerer les droits et les acces" },
    { href: "/app/admin/audit", label: "Audit", hint: "Tracer les actions critiques de la plateforme" },
    { href: "/app/admin/sante", label: "Sante", hint: "Verifier RLS, emails, Storage et invitations" },
    { href: "/app/admin/notifications", label: "Notifications", hint: "Suivre les alertes plateforme" },
    { href: "/app/admin/emails", label: "Emails", hint: "Superviser la file transactionnelle" },
    { href: "/app/admin/reporting", label: "Reporting", hint: "Exporter et lire les volumes plateforme" },
    { href: "/carrieres", label: "Site carriere", hint: "Controler la vitrine publique" }
  ]
};

const actionByRole: Record<AppRole, { href: string; label: string }> = {
  candidat: { href: "/app/candidat/offres", label: "Explorer les offres" },
  recruteur: { href: "/app/recruteur/offres", label: "Gerer mes offres" },
  admin: { href: "/app/admin/offres", label: "Piloter les offres" }
};

const supportByRole: Record<AppRole, string[]> = {
  candidat: [
    "Mettre a jour votre profil pour gagner en visibilite.",
    "Suivre vos candidatures sans revenir au site vitrine.",
    "Acceder rapidement aux offres et aux prochaines etapes."
  ],
  recruteur: [
    "Piloter vos offres depuis un espace dedie.",
    "Retrouver vos candidatures et votre avancement en un seul endroit.",
    "Acceder au site carriere sans quitter la plateforme."
  ],
  admin: [
    "Superviser l'activite, les utilisateurs et les flux critiques.",
    "Suivre la sante de la plateforme sans passer par la vitrine.",
    "Centraliser le pilotage des offres et des candidatures."
  ]
};

export async function DashboardShell({
  title,
  description,
  profile,
  currentPath,
  children
}: DashboardShellProps) {
  const nav = navByRole[profile.role];
  const action = actionByRole[profile.role];
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
          <span>{item.label}</span>
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
                <small>Espace {roleLabel[profile.role].toLowerCase()}</small>
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

        <div className="panel dashboard-sidecard dashboard-sidebar__support">
          <p className="eyebrow">Pourquoi cette vue</p>
          <h2>Une interface pensee pour travailler, pas pour naviguer.</h2>
          <ul className="dashboard-mini-list">
            {supportByRole[profile.role].map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="dashboard-sidebar__actions">
          <Link className="btn btn-ghost btn-block" href="/">
            Retour au site Madajob
          </Link>
          <SignOutButton className="btn-block" />
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-toolbar">
          <div className="dashboard-toolbar__title">
            <span className="dashboard-kicker">Plateforme Madajob</span>
            <h1>{title}</h1>
            <p>{description}</p>
          </div>

          <div className="dashboard-toolbar__meta">
            <div className="dashboard-context">
              <span className="dashboard-context__label">Role</span>
              <strong>{roleLabel[profile.role]}</strong>
              <small>{profile.email || "Compte connecte"}</small>
              <small>
                {unreadNotificationsCount > 0
                  ? `${unreadNotificationsCount} notification(s) non lue(s)`
                  : "Aucune notification en attente"}
              </small>
            </div>
            <Link className="btn btn-primary" href={action.href}>
              {action.label}
            </Link>
          </div>
        </header>

        <div className="dashboard-mobile-nav">{renderNavItems("mobile")}</div>

        <div className="dashboard-content">{children}</div>
      </main>
    </div>
  );
}
