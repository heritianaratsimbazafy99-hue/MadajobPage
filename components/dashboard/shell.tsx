import Link from "next/link";
import type { ReactNode } from "react";

import { SignOutButton } from "@/components/auth/sign-out-button";
import type { AppRole, Profile } from "@/lib/types";

type DashboardShellProps = {
  title: string;
  description: string;
  profile: Profile;
  children: ReactNode;
};

const navByRole: Record<AppRole, Array<{ href: string; label: string }>> = {
  candidat: [
    { href: "/app/candidat", label: "Vue d'ensemble" },
    { href: "/carrieres", label: "Offres" }
  ],
  recruteur: [
    { href: "/app/recruteur", label: "Vue d'ensemble" },
    { href: "/carrieres", label: "Offres publiques" }
  ],
  admin: [
    { href: "/app/admin", label: "Supervision" },
    { href: "/carrieres", label: "Site carriere" }
  ]
};

export function DashboardShell({
  title,
  description,
  profile,
  children
}: DashboardShellProps) {
  const nav = navByRole[profile.role];

  return (
    <div className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <Link href="/" className="dashboard-brand">
          Madajob
        </Link>
        <p className="dashboard-user">
          <strong>{profile.full_name || profile.email || "Utilisateur"}</strong>
          <span>{profile.role}</span>
        </p>
        <nav className="dashboard-nav">
          {nav.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
        <SignOutButton />
      </aside>

      <main className="dashboard-main">
        <div className="dashboard-hero">
          <p className="eyebrow">Tableau de bord</p>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        {children}
      </main>
    </div>
  );
}
