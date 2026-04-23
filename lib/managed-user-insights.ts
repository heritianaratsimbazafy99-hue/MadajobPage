import type { ManagedUserSummary } from "@/lib/types";

export type ManagedUserPriorityKey =
  | "inactive_admin"
  | "recruiter_without_org"
  | "inactive_internal"
  | "internal_onboarding"
  | "internal_dormant"
  | "candidate_to_qualify"
  | "internal_operational"
  | "steady";

export type ManagedUserPriorityMeta = {
  key: ManagedUserPriorityKey;
  label: string;
  description: string;
  tone: "info" | "success" | "danger" | "muted";
};

export type ManagedUsersSummary = {
  total: number;
  activeCount: number;
  internalCount: number;
  invitationWatchCount: number;
  recruitersWithoutOrganizationCount: number;
  inactiveInternalCount: number;
  dormantInternalCount: number;
  candidatesToReviewCount: number;
  topPriorityUser: ManagedUserSummary | null;
};

const oneDayInMs = 86_400_000;

function getDaysSince(dateValue: string | null | undefined) {
  if (!dateValue) {
    return Number.POSITIVE_INFINITY;
  }

  return (Date.now() - new Date(dateValue).getTime()) / oneDayInMs;
}

export function needsManagedCandidateReview(user: ManagedUserSummary) {
  return (
    user.role === "candidat" &&
    ((user.candidate_profile_completion ?? 0) < 70 || user.applications_count === 0)
  );
}

export function hasManagedUserInvitationWatch(user: ManagedUserSummary) {
  if (user.role === "candidat" || !user.invitation_sent_at) {
    return false;
  }

  return getDaysSince(user.invitation_sent_at) <= 14 && user.jobs_count === 0;
}

export function isManagedUserDormant(user: ManagedUserSummary) {
  if (user.role === "candidat" || !user.is_active) {
    return false;
  }

  const latestSignalAt =
    user.last_admin_action_at ?? user.updated_at ?? user.invitation_sent_at ?? user.created_at;

  return getDaysSince(latestSignalAt) > 45 && user.jobs_count === 0;
}

export function getManagedUserPriorityMeta(
  user: ManagedUserSummary
): ManagedUserPriorityMeta {
  if (user.role === "admin" && !user.is_active) {
    return {
      key: "inactive_admin",
      label: "Admin inactif",
      description:
        "Un compte admin est desactive. Verifiez s'il faut le rebasculer, le remplacer ou le cloturer proprement.",
      tone: "danger"
    };
  }

  if (user.role === "recruteur" && !user.organization_id) {
    return {
      key: "recruiter_without_org",
      label: "Sans organisation",
      description:
        "Le recruteur n'est rattache a aucune organisation. L'acces n'est pas pleinement exploitable tant que le rattachement n'est pas corrige.",
      tone: "danger"
    };
  }

  if (user.role !== "candidat" && !user.is_active) {
    return {
      key: "inactive_internal",
      label: "Interne inactif",
      description:
        "Le compte interne reste coupe du cockpit. Confirmez si l'acces doit etre reactive ou retire definitivement.",
      tone: "danger"
    };
  }

  if (hasManagedUserInvitationWatch(user)) {
    return {
      key: "internal_onboarding",
      label: "Onboarding a suivre",
      description:
        "Une invitation interne a ete envoyee recemment mais le compte n'a pas encore produit de signal operationnel visible.",
      tone: "info"
    };
  }

  if (isManagedUserDormant(user)) {
    return {
      key: "internal_dormant",
      label: "Compte dormant",
      description:
        "Le compte reste actif mais n'envoie plus de signal utile. Il peut meriter un point d'usage ou un nettoyage d'acces.",
      tone: "info"
    };
  }

  if (needsManagedCandidateReview(user)) {
    return {
      key: "candidate_to_qualify",
      label: "Candidat a qualifier",
      description:
        "Le profil candidat manque encore d'informations ou n'a pas encore active de dossier. Il faut le fiabiliser avant exploitation.",
      tone: "info"
    };
  }

  if (user.role !== "candidat" && user.jobs_count > 0) {
    return {
      key: "internal_operational",
      label: "Compte operationnel",
      description:
        "Le compte porte deja une activite utile dans la plateforme et ne remonte pas comme urgence immediate.",
      tone: "success"
    };
  }

  return {
    key: "steady",
    label: "A surveiller",
    description:
      "Le compte reste sain pour l'instant mais doit rester visible dans le pilotage global des acces.",
    tone: "muted"
  };
}

export function getManagedUserPriorityScore(user: ManagedUserSummary) {
  let score = 0;

  if (user.role === "admin" && !user.is_active) {
    score += 380;
  }

  if (user.role === "recruteur" && !user.organization_id) {
    score += 340;
  }

  if (user.role !== "candidat" && !user.is_active) {
    score += 280;
  }

  if (hasManagedUserInvitationWatch(user)) {
    score += 240;
  }

  if (isManagedUserDormant(user)) {
    score += 190;
  }

  if (needsManagedCandidateReview(user)) {
    score += 150;
  }

  if (user.role !== "candidat") {
    score += Math.min(90, user.jobs_count * 18);
  } else {
    score += Math.min(70, user.applications_count * 12);
  }

  if (user.role === "candidat") {
    score += Math.min(80, user.candidate_profile_completion ?? 0);
  }

  if (user.is_active) {
    score += 25;
  }

  return score;
}

export function summarizeManagedUsers(users: ManagedUserSummary[]): ManagedUsersSummary {
  const prioritizedUsers = [...users].sort((left, right) => {
    const leftScore = getManagedUserPriorityScore(left);
    const rightScore = getManagedUserPriorityScore(right);

    if (leftScore !== rightScore) {
      return rightScore - leftScore;
    }

    const leftDate = new Date(
      left.last_admin_action_at ?? left.updated_at ?? left.created_at
    ).getTime();
    const rightDate = new Date(
      right.last_admin_action_at ?? right.updated_at ?? right.created_at
    ).getTime();

    return rightDate - leftDate;
  });

  return {
    total: users.length,
    activeCount: users.filter((user) => user.is_active).length,
    internalCount: users.filter((user) => user.role !== "candidat").length,
    invitationWatchCount: users.filter((user) => hasManagedUserInvitationWatch(user)).length,
    recruitersWithoutOrganizationCount: users.filter(
      (user) => user.role === "recruteur" && !user.organization_id
    ).length,
    inactiveInternalCount: users.filter(
      (user) => user.role !== "candidat" && !user.is_active
    ).length,
    dormantInternalCount: users.filter((user) => isManagedUserDormant(user)).length,
    candidatesToReviewCount: users.filter((user) => needsManagedCandidateReview(user)).length,
    topPriorityUser: prioritizedUsers[0] ?? null
  };
}
