import { getComparableMonthlySalary, hasVisibleSalary } from "@/lib/job-salary";
import {
  getCandidateJobMatch,
  type JobMatchResult,
  type MatchableJob,
  type MatchingCandidateProfile
} from "@/lib/matching";

export const CANDIDATE_JOB_ALERT_KIND = "candidate_job_match";
export const CANDIDATE_JOB_ALERT_MIN_MATCH_SCORE = 60;

export type CandidateJobAlertEligibility = {
  eligible: boolean;
  match: JobMatchResult;
  reasons: string[];
  blockedReasons: string[];
};

function normalizeText(value: string | null | undefined) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function hasText(value: string | null | undefined) {
  return normalizeText(value).length > 0;
}

function getPositiveNumber(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null;
}

function matchesPreference(jobValue: string | null | undefined, desiredValue: string | null | undefined) {
  const normalizedJobValue = normalizeText(jobValue);
  const normalizedDesiredValue = normalizeText(desiredValue);

  return (
    normalizedJobValue.length > 0 &&
    normalizedDesiredValue.length > 0 &&
    (normalizedJobValue === normalizedDesiredValue ||
      normalizedJobValue.includes(normalizedDesiredValue) ||
      normalizedDesiredValue.includes(normalizedJobValue))
  );
}

export function hasCandidateJobAlertPreference(profile: MatchingCandidateProfile) {
  return (
    hasText(profile.desired_contract_type) ||
    hasText(profile.desired_work_mode) ||
    Boolean(getPositiveNumber(profile.desired_salary_min))
  );
}

export function getCandidateJobAlertEligibility(
  profile: MatchingCandidateProfile,
  job: MatchableJob,
  options: { minMatchScore?: number } = {}
): CandidateJobAlertEligibility {
  const minMatchScore = options.minMatchScore ?? CANDIDATE_JOB_ALERT_MIN_MATCH_SCORE;
  const match = getCandidateJobMatch(profile, job);
  const reasons: string[] = [];
  const blockedReasons: string[] = [];

  if (job.status !== "published") {
    blockedReasons.push("offre non publiee");
  }

  if (!match.hasSignal || match.score < minMatchScore) {
    blockedReasons.push(`matching insuffisant (${match.score}%)`);
  }

  if (!hasCandidateJobAlertPreference(profile)) {
    blockedReasons.push("aucune preference candidat exploitable");
  }

  if (hasText(profile.desired_contract_type)) {
    if (matchesPreference(job.contract_type, profile.desired_contract_type)) {
      reasons.push(`contrat ${profile.desired_contract_type} aligne`);
    } else {
      blockedReasons.push(`contrat ${profile.desired_contract_type} non aligne`);
    }
  }

  if (hasText(profile.desired_work_mode)) {
    if (matchesPreference(job.work_mode, profile.desired_work_mode)) {
      reasons.push(`mode ${profile.desired_work_mode} aligne`);
    } else {
      blockedReasons.push(`mode ${profile.desired_work_mode} non aligne`);
    }
  }

  const desiredSalaryMin = getPositiveNumber(profile.desired_salary_min);

  if (desiredSalaryMin) {
    const desiredCurrency = profile.desired_salary_currency || "MGA";
    const jobCurrency = job.salary_currency || "MGA";
    const monthlySalary = getComparableMonthlySalary(job);
    const salaryIsComparable =
      hasVisibleSalary(job) && jobCurrency === desiredCurrency && monthlySalary > 0;

    if (salaryIsComparable && monthlySalary >= desiredSalaryMin) {
      reasons.push(`remuneration compatible avec ${desiredCurrency}`);
    } else if (salaryIsComparable) {
      blockedReasons.push("remuneration visible sous le minimum souhaite");
    }
  }

  if (reasons.length === 0) {
    blockedReasons.push("aucune preference alignee");
  }

  return {
    eligible: blockedReasons.length === 0,
    match,
    reasons,
    blockedReasons
  };
}
