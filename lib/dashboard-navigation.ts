import type { AppRole } from "@/lib/types";

export type DashboardNavItem = {
  href: string;
  label: string;
  hint: string;
};

const roleLabels: Record<AppRole, string> = {
  candidat: "Candidat",
  recruteur: "Recruteur",
  admin: "Admin"
};

const navigationByRole: Record<AppRole, DashboardNavItem[]> = {
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

const primaryActionByRole: Record<AppRole, { href: string; label: string }> = {
  candidat: { href: "/app/candidat/offres", label: "Explorer les offres" },
  recruteur: { href: "/app/recruteur/offres", label: "Gerer mes offres" },
  admin: { href: "/app/admin/offres", label: "Piloter les offres" }
};

const supportMessagesByRole: Record<AppRole, string[]> = {
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

export function getDashboardRoleLabel(role: AppRole) {
  return roleLabels[role];
}

export function getDashboardNavigation(role: AppRole) {
  return navigationByRole[role];
}

export function getDashboardPrimaryAction(role: AppRole) {
  return primaryActionByRole[role];
}

export function getDashboardSupportMessages(role: AppRole) {
  return supportMessagesByRole[role];
}
