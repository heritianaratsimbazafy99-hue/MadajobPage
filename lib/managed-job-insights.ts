import type { ManagedJob } from "@/lib/types";

export type ManagedJobPriorityKey =
  | "to_publish"
  | "closing_soon"
  | "live_without_candidates"
  | "active_pipeline"
  | "inactive";

export type ManagedJobPriorityMeta = {
  key: ManagedJobPriorityKey;
  label: string;
  description: string;
  tone: "info" | "success" | "danger" | "muted";
};

export type ManagedJobsSummary = {
  total: number;
  draftCount: number;
  publishedCount: number;
  withoutApplicationsCount: number;
  closingSoonCount: number;
  activePipelineCount: number;
  featuredCount: number;
  topPriorityJob: ManagedJob | null;
};

const oneDayInMs = 86_400_000;

function getDaysUntil(dateValue: string | null | undefined) {
  if (!dateValue) {
    return Number.POSITIVE_INFINITY;
  }

  return (new Date(dateValue).getTime() - Date.now()) / oneDayInMs;
}

export function isManagedJobClosingSoon(job: ManagedJob) {
  if (job.status !== "published" || !job.closing_at) {
    return false;
  }

  const daysUntilClosing = getDaysUntil(job.closing_at);
  return daysUntilClosing >= 0 && daysUntilClosing <= 7;
}

export function getManagedJobPriorityMeta(job: ManagedJob): ManagedJobPriorityMeta {
  if (job.status === "draft") {
    return {
      key: "to_publish",
      label: "A publier",
      description: "Cette offre est encore en brouillon et attend un arbitrage de diffusion.",
      tone: "info"
    };
  }

  if (job.status === "published" && job.applications_count === 0) {
    return {
      key: "live_without_candidates",
      label: "Sans candidatures",
      description: "L'offre est visible mais n'a pas encore genere de pipeline.",
      tone: "danger"
    };
  }

  if (isManagedJobClosingSoon(job)) {
    return {
      key: "closing_soon",
      label: "Cloture proche",
      description: "La date de cloture approche. Il faut arbitrer rapidement les derniers dossiers.",
      tone: "info"
    };
  }

  if (job.status === "published" && job.applications_count >= 5) {
    return {
      key: "active_pipeline",
      label: "Pipeline actif",
      description: "Cette offre alimente deja un pipeline significatif a exploiter.",
      tone: "success"
    };
  }

  return {
    key: "inactive",
    label: "A surveiller",
    description: "Cette offre reste accessible mais ne remonte pas comme priorite immediate.",
    tone: job.status === "published" ? "muted" : "muted"
  };
}

export function getManagedJobPriorityScore(job: ManagedJob) {
  let score = 0;

  if (job.status === "draft") {
    score += 320;
  }

  if (job.status === "published") {
    score += 160;
  }

  if (job.status === "published" && job.applications_count === 0) {
    score += 240;
  }

  if (isManagedJobClosingSoon(job)) {
    score += 220;
  }

  if (job.status === "published" && job.applications_count >= 5) {
    score += 180;
  } else if (job.status === "published" && job.applications_count >= 1) {
    score += 80;
  }

  if (job.is_featured) {
    score += 40;
  }

  if (job.status === "closed" || job.status === "archived") {
    score -= 120;
  }

  const recentUpdateTime = new Date(job.updated_at || job.created_at).getTime();
  score += Math.max(0, Math.round((recentUpdateTime - Date.now()) / oneDayInMs));

  return score;
}

export function summarizeManagedJobs(jobs: ManagedJob[]): ManagedJobsSummary {
  const prioritizedJobs = [...jobs].sort((left, right) => {
    const leftScore = getManagedJobPriorityScore(left);
    const rightScore = getManagedJobPriorityScore(right);

    if (leftScore !== rightScore) {
      return rightScore - leftScore;
    }

    return new Date(right.updated_at || right.created_at).getTime() - new Date(left.updated_at || left.created_at).getTime();
  });

  return {
    total: jobs.length,
    draftCount: jobs.filter((job) => job.status === "draft").length,
    publishedCount: jobs.filter((job) => job.status === "published").length,
    withoutApplicationsCount: jobs.filter(
      (job) => job.status === "published" && job.applications_count === 0
    ).length,
    closingSoonCount: jobs.filter((job) => isManagedJobClosingSoon(job)).length,
    activePipelineCount: jobs.filter(
      (job) => job.status === "published" && job.applications_count >= 5
    ).length,
    featuredCount: jobs.filter((job) => job.is_featured).length,
    topPriorityJob: prioritizedJobs[0] ?? null
  };
}
