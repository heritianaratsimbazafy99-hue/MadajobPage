import { isFinalApplicationStatus } from "@/lib/application-status";
import type { ManagedCandidateSummary } from "@/lib/types";

export type ManagedCandidatePriorityKey =
  | "missing_cv"
  | "advanced_pipeline"
  | "ready_profile"
  | "active_followup"
  | "to_qualify"
  | "inactive";

export type ManagedCandidatePriorityMeta = {
  key: ManagedCandidatePriorityKey;
  label: string;
  description: string;
  tone: "info" | "success" | "danger" | "muted";
};

export type ManagedCandidatesSummary = {
  total: number;
  withCvCount: number;
  withoutCvCount: number;
  readyCount: number;
  activePipelineCount: number;
  lowCompletionCount: number;
  multiApplicationCount: number;
  recentActivityCount: number;
  topPriorityCandidate: ManagedCandidateSummary | null;
};

const oneDayInMs = 86_400_000;

function getDaysSince(dateValue: string | null | undefined) {
  if (!dateValue) {
    return Number.POSITIVE_INFINITY;
  }

  return (Date.now() - new Date(dateValue).getTime()) / oneDayInMs;
}

export function hasActiveCandidatePipeline(candidate: ManagedCandidateSummary) {
  if (candidate.applications_count <= 0) {
    return false;
  }

  if (!candidate.latest_status) {
    return true;
  }

  return !isFinalApplicationStatus(candidate.latest_status);
}

export function hasAdvancedCandidatePipeline(candidate: ManagedCandidateSummary) {
  return candidate.latest_status === "shortlist" || candidate.latest_status === "interview";
}

export function isManagedCandidateReady(candidate: ManagedCandidateSummary) {
  return candidate.has_primary_cv && candidate.profile_completion >= 80;
}

export function getManagedCandidatePriorityMeta(
  candidate: ManagedCandidateSummary
): ManagedCandidatePriorityMeta {
  if (!candidate.has_primary_cv && candidate.applications_count > 0) {
    return {
      key: "missing_cv",
      label: "CV a fiabiliser",
      description: "Le profil a deja alimente le pipeline mais il manque encore un CV principal exploitable rapidement.",
      tone: "danger"
    };
  }

  if (hasAdvancedCandidatePipeline(candidate)) {
    return {
      key: "advanced_pipeline",
      label: "Pipeline avance",
      description: "Le candidat est deja shortlist ou en entretien. Il faut garder ce dossier visible.",
      tone: "success"
    };
  }

  if (isManagedCandidateReady(candidate)) {
    return {
      key: "ready_profile",
      label: "Pret a activer",
      description: "Le profil est deja bien complete avec CV principal et peut etre rapproche rapidement des bonnes offres.",
      tone: "success"
    };
  }

  if (hasActiveCandidatePipeline(candidate) || candidate.applications_count >= 2) {
    return {
      key: "active_followup",
      label: "A relancer",
      description: "Le candidat est deja present dans le vivier et merite un suivi operationnel plus visible.",
      tone: "info"
    };
  }

  if (candidate.profile_completion < 50 || !candidate.desired_position) {
    return {
      key: "to_qualify",
      label: "A qualifier",
      description: "Le profil manque encore d'informations structurantes avant d'etre pleinement exploitable.",
      tone: "info"
    };
  }

  return {
    key: "inactive",
    label: "A surveiller",
    description: "Le profil reste disponible dans la base mais ne remonte pas comme priorite immediate.",
    tone: "muted"
  };
}

export function getManagedCandidatePriorityScore(
  candidate: ManagedCandidateSummary,
  options: {
    matchScore?: number;
  } = {}
) {
  let score = 0;

  if (!candidate.has_primary_cv && candidate.applications_count > 0) {
    score += 320;
  }

  if (hasAdvancedCandidatePipeline(candidate)) {
    score += 280;
  } else if (hasActiveCandidatePipeline(candidate)) {
    score += 180;
  }

  if (isManagedCandidateReady(candidate)) {
    score += 180;
  } else if (candidate.profile_completion >= 60) {
    score += 90;
  } else if (candidate.profile_completion >= 40) {
    score += 45;
  } else {
    score += 15;
  }

  if (candidate.has_primary_cv) {
    score += 70;
  }

  if (candidate.applications_count >= 3) {
    score += 70;
  } else if (candidate.applications_count >= 2) {
    score += 45;
  } else if (candidate.applications_count >= 1) {
    score += 20;
  }

  if (typeof options.matchScore === "number" && options.matchScore > 0) {
    score += Math.round(options.matchScore * 1.8);
  }

  const daysSinceActivity = getDaysSince(candidate.latest_application_at);

  if (Number.isFinite(daysSinceActivity)) {
    if (daysSinceActivity <= 7) {
      score += 40;
    } else if (daysSinceActivity <= 30) {
      score += 20;
    } else if (daysSinceActivity > 90) {
      score -= 25;
    }
  }

  if (candidate.latest_status && isFinalApplicationStatus(candidate.latest_status)) {
    score -= 60;
  }

  return score;
}

export function summarizeManagedCandidates(
  candidates: ManagedCandidateSummary[]
): ManagedCandidatesSummary {
  const prioritizedCandidates = [...candidates].sort((left, right) => {
    const leftScore = getManagedCandidatePriorityScore(left);
    const rightScore = getManagedCandidatePriorityScore(right);

    if (leftScore !== rightScore) {
      return rightScore - leftScore;
    }

    return new Date(right.latest_application_at ?? 0).getTime() - new Date(left.latest_application_at ?? 0).getTime();
  });

  return {
    total: candidates.length,
    withCvCount: candidates.filter((candidate) => candidate.has_primary_cv).length,
    withoutCvCount: candidates.filter((candidate) => !candidate.has_primary_cv).length,
    readyCount: candidates.filter((candidate) => isManagedCandidateReady(candidate)).length,
    activePipelineCount: candidates.filter((candidate) => hasActiveCandidatePipeline(candidate)).length,
    lowCompletionCount: candidates.filter((candidate) => candidate.profile_completion < 50).length,
    multiApplicationCount: candidates.filter((candidate) => candidate.applications_count >= 2).length,
    recentActivityCount: candidates.filter(
      (candidate) => getDaysSince(candidate.latest_application_at) <= 30
    ).length,
    topPriorityCandidate: prioritizedCandidates[0] ?? null
  };
}
