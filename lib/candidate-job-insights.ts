import { isFinalApplicationStatus } from "@/lib/application-status";
import {
  getCandidateJobMatch,
  type JobMatchResult,
  type MatchingCandidateProfile
} from "@/lib/matching";
import type { CandidateApplicationSummary, Job } from "@/lib/types";

export type CandidateJobOpportunity = {
  job: Job;
  application: CandidateApplicationSummary | null;
  match: JobMatchResult;
  priorityScore: number;
  isAvailable: boolean;
  isActiveApplied: boolean;
  hasUpcomingInterview: boolean;
  isReadyToApply: boolean;
  isSaved: boolean;
};

export type CandidateJobsWorkspaceSummary = {
  visibleCount: number;
  appliedCount: number;
  activeAppliedCount: number;
  strongAvailableCount: number;
  readyToApplyCount: number;
  featuredCount: number;
  savedCount: number;
  topAvailableOpportunity: CandidateJobOpportunity | null;
  topActiveOpportunity: CandidateJobOpportunity | null;
};

function getCandidateJobPriorityScore(
  job: Job,
  application: CandidateApplicationSummary | null,
  match: JobMatchResult
) {
  let score = 0;

  if (application) {
    score += isFinalApplicationStatus(application.status) ? -140 : 120;

    if (application.interview_signal.next_interview_at) {
      score += 220;
    }

    if (application.status === "interview") {
      score += 140;
    } else if (application.status === "shortlist") {
      score += 100;
    }
  } else {
    score += match.score * 3;

    if (match.hasSignal && match.score >= 78) {
      score += 110;
    } else if (match.hasSignal && match.score >= 60) {
      score += 70;
    }
  }

  if (job.is_featured) {
    score += 45;
  }

  const publicationAgeDays = job.published_at
    ? (Date.now() - new Date(job.published_at).getTime()) / 86_400_000
    : 999;

  if (publicationAgeDays <= 7) {
    score += 35;
  } else if (publicationAgeDays <= 21) {
    score += 15;
  }

  return score;
}

export function buildCandidateJobOpportunities(
  jobs: Job[],
  applications: CandidateApplicationSummary[],
  candidateProfile: MatchingCandidateProfile,
  savedJobIds: Set<string> = new Set()
) {
  const applicationByJobId = new Map(applications.map((application) => [application.job_id, application]));

  return jobs
    .map((job) => {
      const application = applicationByJobId.get(job.id) ?? null;
      const match = getCandidateJobMatch(candidateProfile, job);
      const isAvailable = !application;
      const isActiveApplied = application !== null && !isFinalApplicationStatus(application.status);
      const hasUpcomingInterview = Boolean(application?.interview_signal.next_interview_at);
      const isReadyToApply = isAvailable && match.hasSignal && match.score >= 60;
      const isSaved = savedJobIds.has(job.id);

      return {
        job,
        application,
        match,
        priorityScore: getCandidateJobPriorityScore(job, application, match) + (isSaved ? 25 : 0),
        isAvailable,
        isActiveApplied,
        hasUpcomingInterview,
        isReadyToApply,
        isSaved
      } satisfies CandidateJobOpportunity;
    })
    .sort((left, right) => {
      if (left.priorityScore !== right.priorityScore) {
        return right.priorityScore - left.priorityScore;
      }

      const leftDate = left.job.published_at ? new Date(left.job.published_at).getTime() : 0;
      const rightDate = right.job.published_at ? new Date(right.job.published_at).getTime() : 0;

      return rightDate - leftDate;
    });
}

export function summarizeCandidateJobsWorkspace(
  opportunities: CandidateJobOpportunity[]
): CandidateJobsWorkspaceSummary {
  const appliedCount = opportunities.filter((entry) => entry.application !== null).length;
  const activeAppliedCount = opportunities.filter((entry) => entry.isActiveApplied).length;
  const strongAvailableCount = opportunities.filter(
    (entry) => entry.isAvailable && entry.match.hasSignal && entry.match.score >= 78
  ).length;
  const readyToApplyCount = opportunities.filter((entry) => entry.isReadyToApply).length;
  const featuredCount = opportunities.filter((entry) => entry.job.is_featured).length;
  const savedCount = opportunities.filter((entry) => entry.isSaved).length;

  return {
    visibleCount: opportunities.length,
    appliedCount,
    activeAppliedCount,
    strongAvailableCount,
    readyToApplyCount,
    featuredCount,
    savedCount,
    topAvailableOpportunity: opportunities.find((entry) => entry.isAvailable) ?? null,
    topActiveOpportunity: opportunities.find((entry) => entry.isActiveApplied) ?? null
  };
}
