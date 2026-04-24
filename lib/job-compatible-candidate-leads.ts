import { isFinalApplicationStatus } from "@/lib/application-status";
import {
  getCandidateJobMatch,
  type JobMatchResult,
  type MatchableJob
} from "@/lib/matching";
import type { ManagedCandidateSummary, RecruiterApplication } from "@/lib/types";

const shortlistStatuses = new Set(["shortlist", "interview", "hired"]);

export type JobCompatibleCandidateLead = {
  candidate: ManagedCandidateSummary;
  match: JobMatchResult;
  signals: string[];
  nextAction: string;
};

export type JobCompatibleCandidateLeadSummary = {
  totalCount: number;
  strongCount: number;
  withCvCount: number;
  readyProfileCount: number;
  topLead: JobCompatibleCandidateLead | null;
};

type CandidateApplicationContext = {
  hasApplicationOnJob: boolean;
  hasActiveApplication: boolean;
  hasShortlistApplication: boolean;
};

type GetCompatibleCandidateLeadsInput = {
  job: MatchableJob;
  candidates: ManagedCandidateSummary[];
  applications: RecruiterApplication[];
  limit?: number;
  minScore?: number;
};

function getCandidateApplicationContext(
  candidateId: string,
  jobId: string,
  applications: RecruiterApplication[]
): CandidateApplicationContext {
  const candidateApplications = applications.filter((application) => application.candidate_id === candidateId);

  return {
    hasApplicationOnJob: candidateApplications.some((application) => application.job_id === jobId),
    hasActiveApplication: candidateApplications.some(
      (application) => !isFinalApplicationStatus(application.status)
    ),
    hasShortlistApplication: candidateApplications.some((application) =>
      shortlistStatuses.has(application.status)
    )
  };
}

function getLeadPriorityScore(lead: JobCompatibleCandidateLead) {
  let score = lead.match.score * 2;

  if (lead.candidate.has_primary_cv) {
    score += 35;
  }

  if (lead.candidate.profile_completion >= 80) {
    score += 30;
  } else if (lead.candidate.profile_completion >= 60) {
    score += 15;
  }

  if (lead.match.level === "fort") {
    score += 25;
  }

  return score;
}

function buildLeadSignals(candidate: ManagedCandidateSummary) {
  const signals = ["Non contacte", "Non shortlist", "Sans candidature active"];

  if (candidate.has_primary_cv) {
    signals.push("CV principal");
  }

  if (candidate.profile_completion >= 80) {
    signals.push("Profil complet");
  }

  return signals;
}

function buildNextAction(lead: JobCompatibleCandidateLead) {
  if (lead.match.score >= 78 && lead.candidate.has_primary_cv) {
    return "Profil compatible a ouvrir en priorite pour qualifier un contact cible.";
  }

  if (lead.match.score >= 60) {
    return "Verifier le profil et les preferences avant un premier contact.";
  }

  return "A garder en veille si le vivier prioritaire reste court.";
}

export function getCompatibleUncontactedCandidateLeads({
  job,
  candidates,
  applications,
  limit = 8,
  minScore = 60
}: GetCompatibleCandidateLeadsInput): JobCompatibleCandidateLead[] {
  const leads = candidates
    .map((candidate) => {
      const context = getCandidateApplicationContext(candidate.id, job.id, applications);

      if (
        context.hasApplicationOnJob ||
        context.hasActiveApplication ||
        context.hasShortlistApplication
      ) {
        return null;
      }

      const match = getCandidateJobMatch(candidate, job);

      if (match.score < minScore) {
        return null;
      }

      const lead: JobCompatibleCandidateLead = {
        candidate,
        match,
        signals: buildLeadSignals(candidate),
        nextAction: ""
      };

      return {
        ...lead,
        nextAction: buildNextAction(lead)
      };
    })
    .filter((lead): lead is JobCompatibleCandidateLead => Boolean(lead))
    .sort((left, right) => {
      const leftScore = getLeadPriorityScore(left);
      const rightScore = getLeadPriorityScore(right);

      if (leftScore !== rightScore) {
        return rightScore - leftScore;
      }

      return right.match.score - left.match.score;
    });

  return leads.slice(0, limit);
}

export function summarizeCompatibleCandidateLeads(
  leads: JobCompatibleCandidateLead[]
): JobCompatibleCandidateLeadSummary {
  return {
    totalCount: leads.length,
    strongCount: leads.filter((lead) => lead.match.score >= 78 || lead.match.level === "fort").length,
    withCvCount: leads.filter((lead) => lead.candidate.has_primary_cv).length,
    readyProfileCount: leads.filter((lead) => lead.candidate.profile_completion >= 80).length,
    topLead: leads[0] ?? null
  };
}
