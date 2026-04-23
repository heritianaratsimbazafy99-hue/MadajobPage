import type { ManagedOrganizationSummary } from "@/lib/types";

export type ManagedOrganizationPriorityKey =
  | "inactive_org"
  | "without_recruiters"
  | "without_jobs"
  | "advanced_pipeline"
  | "dormant"
  | "healthy";

export type ManagedOrganizationPriorityMeta = {
  key: ManagedOrganizationPriorityKey;
  label: string;
  description: string;
  tone: "info" | "success" | "danger" | "muted";
};

export type ManagedOrganizationsSummary = {
  total: number;
  activeCount: number;
  withoutRecruitersCount: number;
  withoutJobsCount: number;
  advancedPipelineCount: number;
  dormantCount: number;
  topPriorityOrganization: ManagedOrganizationSummary | null;
};

const oneDayInMs = 86_400_000;

function getLatestSignalAt(organization: ManagedOrganizationSummary) {
  return organization.latest_application_at ?? organization.latest_job_at;
}

function getDaysSinceLatestSignal(organization: ManagedOrganizationSummary) {
  const latestSignalAt = getLatestSignalAt(organization);

  if (!latestSignalAt) {
    return Number.POSITIVE_INFINITY;
  }

  return (Date.now() - new Date(latestSignalAt).getTime()) / oneDayInMs;
}

export function isManagedOrganizationDormant(organization: ManagedOrganizationSummary) {
  return getDaysSinceLatestSignal(organization) > 45;
}

export function getManagedOrganizationPriorityMeta(
  organization: ManagedOrganizationSummary
): ManagedOrganizationPriorityMeta {
  if (!organization.is_active) {
    return {
      key: "inactive_org",
      label: "Inactive",
      description: "Cette organisation est desactivee et demande un arbitrage d'activation ou de cloture.",
      tone: "danger"
    };
  }

  if (organization.recruiters_count === 0) {
    return {
      key: "without_recruiters",
      label: "Sans recruteur",
      description: "L'organisation n'a pas de recruteur rattache pour porter la diffusion et le traitement du pipeline.",
      tone: "danger"
    };
  }

  if (organization.active_jobs_count === 0 && organization.applications_count > 0) {
    return {
      key: "without_jobs",
      label: "Sans offre active",
      description: "Le pipeline existe encore mais aucune offre publiee n'est actuellement active.",
      tone: "info"
    };
  }

  if (organization.shortlist_count > 0) {
    return {
      key: "advanced_pipeline",
      label: "Pipeline avance",
      description: "Cette organisation a deja des dossiers shortlistes ou en entretien qui meritent une supervision continue.",
      tone: "success"
    };
  }

  if (isManagedOrganizationDormant(organization)) {
    return {
      key: "dormant",
      label: "Dormante",
      description: "Aucune activite recente n'a ete detectee. Un check de diffusion ou d'animation peut etre necessaire.",
      tone: "info"
    };
  }

  return {
    key: "healthy",
    label: "A surveiller",
    description: "L'organisation reste saine mais ne remonte pas comme priorite immediate.",
    tone: "muted"
  };
}

export function getManagedOrganizationPriorityScore(
  organization: ManagedOrganizationSummary
) {
  let score = 0;

  if (!organization.is_active) {
    score += 340;
  }

  if (organization.recruiters_count === 0) {
    score += 300;
  } else if (organization.recruiters_count >= 3) {
    score += 40;
  }

  if (organization.active_jobs_count === 0) {
    score += organization.applications_count > 0 ? 180 : 110;
  } else {
    score += Math.min(120, organization.active_jobs_count * 22);
  }

  if (organization.shortlist_count > 0) {
    score += 220 + Math.min(90, organization.shortlist_count * 18);
  }

  if (organization.applications_count > 0) {
    score += Math.min(110, organization.applications_count * 8);
  }

  if (isManagedOrganizationDormant(organization)) {
    score += 140;
  }

  const daysSinceLatestSignal = getDaysSinceLatestSignal(organization);

  if (Number.isFinite(daysSinceLatestSignal)) {
    if (daysSinceLatestSignal <= 14) {
      score += 45;
    } else if (daysSinceLatestSignal <= 30) {
      score += 20;
    }
  }

  return score;
}

export function summarizeManagedOrganizations(
  organizations: ManagedOrganizationSummary[]
): ManagedOrganizationsSummary {
  const prioritizedOrganizations = [...organizations].sort((left, right) => {
    const leftScore = getManagedOrganizationPriorityScore(left);
    const rightScore = getManagedOrganizationPriorityScore(right);

    if (leftScore !== rightScore) {
      return rightScore - leftScore;
    }

    const leftDate = new Date(getLatestSignalAt(left) ?? 0).getTime();
    const rightDate = new Date(getLatestSignalAt(right) ?? 0).getTime();

    return rightDate - leftDate;
  });

  return {
    total: organizations.length,
    activeCount: organizations.filter((organization) => organization.is_active).length,
    withoutRecruitersCount: organizations.filter(
      (organization) => organization.recruiters_count === 0
    ).length,
    withoutJobsCount: organizations.filter(
      (organization) => organization.active_jobs_count === 0
    ).length,
    advancedPipelineCount: organizations.filter(
      (organization) => organization.shortlist_count > 0
    ).length,
    dormantCount: organizations.filter((organization) => isManagedOrganizationDormant(organization))
      .length,
    topPriorityOrganization: prioritizedOrganizations[0] ?? null
  };
}
