import type { AdminAuditEvent } from "@/lib/types";

export type AdminAuditFocusKey =
  | "sensitive"
  | "access"
  | "invitations"
  | "organizations"
  | "jobs"
  | "job_status";

export type AdminAuditEventMeta = {
  key: AdminAuditFocusKey | "steady";
  label: string;
  description: string;
  tone: "info" | "success" | "danger" | "muted";
  isSensitive: boolean;
};

export type AdminAuditSummary = {
  total: number;
  sensitiveCount: number;
  accessCount: number;
  invitationCount: number;
  organizationCount: number;
  jobCount: number;
  jobStatusCount: number;
  recentCount: number;
  uniqueActorsCount: number;
  topPriorityEvent: AdminAuditEvent | null;
};

const oneDayInMs = 86_400_000;

function getDaysSince(dateValue: string | null | undefined) {
  if (!dateValue) {
    return Number.POSITIVE_INFINITY;
  }

  return (Date.now() - new Date(dateValue).getTime()) / oneDayInMs;
}

function hasProfileRoleChange(event: AdminAuditEvent) {
  return String(event.metadata.previous_role ?? "") !== String(event.metadata.next_role ?? "");
}

function hasProfileActivationChange(event: AdminAuditEvent) {
  return String(event.metadata.previous_is_active ?? "") !== String(event.metadata.next_is_active ?? "");
}

function hasProfileOrganizationChange(event: AdminAuditEvent) {
  return (
    String(event.metadata.previous_organization_id ?? "") !==
    String(event.metadata.next_organization_id ?? "")
  );
}

function hasOrganizationStatusChange(event: AdminAuditEvent) {
  return String(event.metadata.previous_is_active ?? "") !== String(event.metadata.next_is_active ?? "");
}

function hasJobStatusTransition(event: AdminAuditEvent) {
  return String(event.metadata.from_status ?? "") !== String(event.metadata.to_status ?? "");
}

export function getAdminAuditActionLabel(action: string) {
  if (action === "job_created") {
    return "Creation d'offre";
  }

  if (action === "job_updated") {
    return "Edition d'offre";
  }

  if (action === "job_status_changed") {
    return "Statut d'offre modifie";
  }

  if (action === "profile_access_updated") {
    return "Acces utilisateur modifie";
  }

  if (action === "user_invited") {
    return "Invitation envoyee";
  }

  if (action === "organization_updated") {
    return "Organisation mise a jour";
  }

  return action.replace(/[_-]+/g, " ");
}

export function getAdminAuditEntityTypeLabel(entityType: string) {
  if (entityType === "profile") {
    return "Utilisateur";
  }

  if (entityType === "job_post") {
    return "Offre";
  }

  if (entityType === "organization") {
    return "Organisation";
  }

  return entityType;
}

export function getAdminAuditEventMeta(event: AdminAuditEvent): AdminAuditEventMeta {
  if (event.action === "profile_access_updated") {
    if (hasProfileRoleChange(event) || hasProfileActivationChange(event)) {
      return {
        key: "sensitive",
        label: "Acces sensible",
        description:
          "Le role ou l'activation d'un compte a change. Ce type d'arbitrage merite une verification rapide.",
        tone: "danger",
        isSensitive: true
      };
    }

    if (hasProfileOrganizationChange(event)) {
      return {
        key: "access",
        label: "Rattachement mis a jour",
        description:
          "Le compte a change d'organisation. Verifiez la coherence entre droits, perimetre et activite attendue.",
        tone: "info",
        isSensitive: true
      };
    }

    return {
      key: "access",
      label: "Acces ajuste",
      description: "Les droits du compte ont ete ajustes dans le cockpit admin.",
      tone: "info",
      isSensitive: false
    };
  }

  if (event.action === "user_invited") {
    const invitedRole = String(event.metadata.invited_role ?? "");

    return {
      key: invitedRole === "admin" ? "sensitive" : "invitations",
      label: invitedRole === "admin" ? "Invitation sensible" : "Invitation interne",
      description:
        invitedRole === "admin"
          ? "Un acces admin a ete prepare. Ce type d'invitation doit rester tres visible."
          : "Une invitation interne a ete declenchee et demande un suivi d'onboarding.",
      tone: invitedRole === "admin" ? "danger" : "info",
      isSensitive: invitedRole === "admin" || invitedRole === "recruteur"
    };
  }

  if (event.action === "organization_updated") {
    if (hasOrganizationStatusChange(event)) {
      return {
        key: "sensitive",
        label: "Activation organisation",
        description:
          "L'etat actif de l'organisation a change. Cela peut impacter les droits et la diffusion des offres.",
        tone: "danger",
        isSensitive: true
      };
    }

    return {
      key: "organizations",
      label: "Gouvernance organisation",
      description: "Une fiche organisation a ete ajustee dans le cockpit admin.",
      tone: "info",
      isSensitive: false
    };
  }

  if (event.action === "job_status_changed") {
    const toStatus = String(event.metadata.to_status ?? "");

    return {
      key: toStatus === "archived" || toStatus === "closed" ? "sensitive" : "job_status",
      label: "Transition offre",
      description:
        toStatus === "archived" || toStatus === "closed"
          ? "Le pipeline d'une offre a ete coupe ou archive. Cela merite un check de diffusion et de suivi candidats."
          : "Le statut d'une offre a change dans le cockpit de gestion.",
      tone: toStatus === "archived" || toStatus === "closed" ? "danger" : "success",
      isSensitive: true
    };
  }

  if (event.action === "job_created") {
    return {
      key: "jobs",
      label: "Nouvelle offre",
      description: "Une offre a ete creee et entre dans le pilotage commercial et RH.",
      tone: "success",
      isSensitive: false
    };
  }

  if (event.action === "job_updated") {
    return {
      key: "jobs",
      label: "Offre ajustee",
      description: "Une offre existante a ete modifiee dans le cockpit.",
      tone: "info",
      isSensitive: false
    };
  }

  return {
    key: "steady",
    label: "Evenement journalise",
    description: "Evenement conserve dans la timeline admin.",
    tone: "muted",
    isSensitive: false
  };
}

export function matchesAdminAuditFocus(event: AdminAuditEvent, focus: AdminAuditFocusKey) {
  if (focus === "sensitive") {
    return getAdminAuditEventMeta(event).isSensitive;
  }

  if (focus === "access") {
    return event.action === "profile_access_updated";
  }

  if (focus === "invitations") {
    return event.action === "user_invited";
  }

  if (focus === "organizations") {
    return event.action === "organization_updated";
  }

  if (focus === "jobs") {
    return ["job_created", "job_updated", "job_status_changed"].includes(event.action);
  }

  return event.action === "job_status_changed";
}

export function getAdminAuditEventSummary(event: AdminAuditEvent) {
  if (event.action === "job_status_changed") {
    return `Transition ${String(event.metadata.from_status ?? "inconnue")} -> ${String(event.metadata.to_status ?? "inconnue")}`;
  }

  if (event.action === "profile_access_updated") {
    if (hasProfileRoleChange(event)) {
      return `Role ${String(event.metadata.previous_role ?? "inconnu")} -> ${String(event.metadata.next_role ?? "inconnu")}`;
    }

    if (hasProfileActivationChange(event)) {
      return `Activation ${String(event.metadata.previous_is_active ?? "inconnue")} -> ${String(event.metadata.next_is_active ?? "inconnue")}`;
    }

    if (hasProfileOrganizationChange(event)) {
      return "Organisation de rattachement mise a jour";
    }

    return "Parametres d'acces mis a jour sur le compte.";
  }

  if (event.action === "user_invited") {
    return `Invitation de ${String(event.metadata.invited_email ?? "utilisateur")} avec le role ${String(event.metadata.invited_role ?? "inconnu")}`;
  }

  if (event.action === "organization_updated") {
    if (hasOrganizationStatusChange(event)) {
      return `Activation ${String(event.metadata.previous_is_active ?? "inconnue")} -> ${String(event.metadata.next_is_active ?? "inconnue")}`;
    }

    return `Nom ${String(event.metadata.previous_name ?? "inconnu")} -> ${String(event.metadata.next_name ?? "inconnu")}`;
  }

  if (event.action === "job_created") {
    return `Statut initial ${String(event.metadata.status ?? "draft")}`;
  }

  if (event.action === "job_updated") {
    return "Contenu de l'offre ajuste depuis le cockpit.";
  }

  return "Evenement journalise dans le cockpit admin.";
}

export function getAdminAuditEventDetailChips(event: AdminAuditEvent) {
  const chips: string[] = [];

  if (event.action === "profile_access_updated") {
    if (hasProfileRoleChange(event)) {
      chips.push(
        `Role ${String(event.metadata.previous_role ?? "inconnu")} -> ${String(event.metadata.next_role ?? "inconnu")}`
      );
    }

    if (hasProfileActivationChange(event)) {
      chips.push(
        `Activation ${String(event.metadata.previous_is_active ?? "inconnue")} -> ${String(event.metadata.next_is_active ?? "inconnue")}`
      );
    }

    if (hasProfileOrganizationChange(event)) {
      chips.push("Organisation changee");
    }
  }

  if (event.action === "user_invited") {
    chips.push(`Role ${String(event.metadata.invited_role ?? "inconnu")}`);

    if (event.metadata.invited_email) {
      chips.push(String(event.metadata.invited_email));
    }
  }

  if (event.action === "organization_updated") {
    if (hasOrganizationStatusChange(event)) {
      chips.push("Etat actif modifie");
    }

    if (String(event.metadata.previous_kind ?? "") !== String(event.metadata.next_kind ?? "")) {
      chips.push(
        `Type ${String(event.metadata.previous_kind ?? "inconnu")} -> ${String(event.metadata.next_kind ?? "inconnu")}`
      );
    }
  }

  if (event.action === "job_status_changed" && hasJobStatusTransition(event)) {
    chips.push(
      `Statut ${String(event.metadata.from_status ?? "inconnu")} -> ${String(event.metadata.to_status ?? "inconnu")}`
    );
  }

  if (event.action === "job_created") {
    chips.push(`Statut ${String(event.metadata.status ?? "draft")}`);
  }

  return chips.slice(0, 3);
}

export function getAdminAuditEventPriorityScore(event: AdminAuditEvent) {
  const meta = getAdminAuditEventMeta(event);
  let score = 0;

  if (meta.isSensitive) {
    score += 260;
  }

  if (event.action === "profile_access_updated") {
    score += 180;

    if (hasProfileRoleChange(event)) {
      score += 120;
    }

    if (hasProfileActivationChange(event)) {
      score += 110;
    }

    if (hasProfileOrganizationChange(event)) {
      score += 60;
    }
  }

  if (event.action === "user_invited") {
    score += 140;

    if (String(event.metadata.invited_role ?? "") === "admin") {
      score += 160;
    } else if (String(event.metadata.invited_role ?? "") === "recruteur") {
      score += 80;
    }
  }

  if (event.action === "organization_updated") {
    score += 120;

    if (hasOrganizationStatusChange(event)) {
      score += 120;
    }
  }

  if (event.action === "job_status_changed") {
    score += 110;

    const toStatus = String(event.metadata.to_status ?? "");
    if (toStatus === "archived" || toStatus === "closed") {
      score += 120;
    } else if (toStatus === "published") {
      score += 70;
    }
  }

  if (event.action === "job_created") {
    score += 70;
  }

  if (event.action === "job_updated") {
    score += 50;
  }

  const daysSince = getDaysSince(event.created_at);

  if (daysSince <= 1) {
    score += 40;
  } else if (daysSince <= 7) {
    score += 20;
  }

  return score;
}

export function summarizeAdminAuditEvents(events: AdminAuditEvent[]): AdminAuditSummary {
  const prioritizedEvents = [...events].sort((left, right) => {
    const leftScore = getAdminAuditEventPriorityScore(left);
    const rightScore = getAdminAuditEventPriorityScore(right);

    if (leftScore !== rightScore) {
      return rightScore - leftScore;
    }

    return new Date(right.created_at).getTime() - new Date(left.created_at).getTime();
  });

  return {
    total: events.length,
    sensitiveCount: events.filter((event) => getAdminAuditEventMeta(event).isSensitive).length,
    accessCount: events.filter((event) => event.action === "profile_access_updated").length,
    invitationCount: events.filter((event) => event.action === "user_invited").length,
    organizationCount: events.filter((event) => event.action === "organization_updated").length,
    jobCount: events.filter((event) =>
      ["job_created", "job_updated", "job_status_changed"].includes(event.action)
    ).length,
    jobStatusCount: events.filter((event) => event.action === "job_status_changed").length,
    recentCount: events.filter((event) => getDaysSince(event.created_at) <= 7).length,
    uniqueActorsCount: new Set(events.map((event) => event.actor_name)).size,
    topPriorityEvent: prioritizedEvents[0] ?? null
  };
}
