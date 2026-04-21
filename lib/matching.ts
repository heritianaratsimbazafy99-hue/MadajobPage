import type { Job, ManagedJob } from "@/lib/types";

export type MatchingCandidateProfile = {
  headline?: string | null;
  city?: string | null;
  current_position?: string | null;
  desired_position?: string | null;
  skills_text?: string | null;
  cv_text?: string | null;
  profile_completion?: number | null;
};

export type MatchableJob = Pick<
  Job,
  | "id"
  | "title"
  | "slug"
  | "location"
  | "contract_type"
  | "work_mode"
  | "sector"
  | "summary"
  | "status"
  | "organization_name"
> &
  Partial<Pick<ManagedJob, "requirements" | "responsibilities" | "benefits">>;

export type JobMatchResult = {
  score: number;
  level: "fort" | "bon" | "moyen" | "faible";
  tone: "success" | "info" | "muted";
  label: string;
  reason: string;
  matchedKeywords: string[];
  hasSignal: boolean;
};

const stopWords = new Set([
  "avec",
  "dans",
  "pour",
  "sans",
  "vous",
  "nous",
  "leur",
  "leurs",
  "des",
  "les",
  "une",
  "un",
  "sur",
  "par",
  "qui",
  "est",
  "ces",
  "ses",
  "aux",
  "vos",
  "nos",
  "the",
  "and",
  "for",
  "job",
  "poste",
  "offre"
]);

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(...values: Array<string | null | undefined>) {
  const tokens = values
    .flatMap((value) => normalizeText(value ?? "").split(" "))
    .filter((token) => token.length >= 2 && !stopWords.has(token));

  return Array.from(new Set(tokens));
}

function intersect(left: string[], right: string[]) {
  const rightSet = new Set(right);
  return left.filter((value) => rightSet.has(value));
}

function getLevel(score: number): JobMatchResult["level"] {
  if (score >= 78) {
    return "fort";
  }

  if (score >= 60) {
    return "bon";
  }

  if (score >= 40) {
    return "moyen";
  }

  return "faible";
}

function getTone(level: JobMatchResult["level"]) {
  if (level === "fort") {
    return "success" as const;
  }

  if (level === "bon" || level === "moyen") {
    return "info" as const;
  }

  return "muted" as const;
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function getCandidateJobMatch(
  profile: MatchingCandidateProfile,
  job: MatchableJob
): JobMatchResult {
  const focusTokens = tokenize(
    profile.desired_position,
    profile.current_position,
    profile.headline
  );
  const candidateKeywordTokens = tokenize(profile.skills_text, profile.cv_text);
  const locationTokens = tokenize(profile.city);
  const jobFocusTokens = tokenize(job.title, job.sector);
  const jobKeywordTokens = tokenize(
    job.summary,
    job.requirements,
    job.responsibilities,
    job.benefits,
    job.title,
    job.sector
  );
  const jobLocationTokens = tokenize(job.location);

  const titleMatches = intersect(focusTokens, jobFocusTokens);
  const keywordMatches = intersect(
    [...focusTokens, ...candidateKeywordTokens],
    jobKeywordTokens
  );
  const locationMatches = intersect(locationTokens, jobLocationTokens);
  const matchedKeywords = Array.from(new Set([...titleMatches, ...keywordMatches])).slice(0, 4);
  const hasSignal =
    focusTokens.length + candidateKeywordTokens.length + locationTokens.length >= 2;

  if (!hasSignal) {
    return {
      score: 0,
      level: "faible",
      tone: "muted",
      label: "Profil a completer",
      reason: "Renseignez le poste vise, les competences et votre ville pour activer le matching.",
      matchedKeywords: [],
      hasSignal: false
    };
  }

  const titleScore = Math.min(42, titleMatches.length * 16);
  const keywordScore = Math.min(38, keywordMatches.length * 5);
  const locationScore = locationMatches.length > 0 ? 10 : 0;
  const completionScore =
    typeof profile.profile_completion === "number"
      ? Math.min(10, Math.round(profile.profile_completion / 10))
      : 0;
  const score = clampScore(titleScore + keywordScore + locationScore + completionScore);
  const level = getLevel(score);

  let reason = "Le profil est encore eloigne de cette offre pour le moment.";

  if (titleMatches.length > 0 && matchedKeywords.length > 0) {
    reason = `Intitule et mots clefs alignes: ${matchedKeywords.join(", ")}.`;
  } else if (titleMatches.length > 0) {
    reason = "Le poste vise recoupe clairement l'intitule de cette offre.";
  } else if (keywordMatches.length > 0) {
    reason = `Competences detectees dans l'offre: ${matchedKeywords.join(", ")}.`;
  } else if (locationMatches.length > 0) {
    reason = "La localisation du candidat reste coherente avec cette offre.";
  }

  return {
    score,
    level,
    tone: getTone(level),
    label: `Match ${score}%`,
    reason,
    matchedKeywords,
    hasSignal: true
  };
}

export function rankJobsForCandidate<T extends MatchableJob>(
  profile: MatchingCandidateProfile,
  jobs: T[]
) {
  return jobs
    .map((job) => ({
      job,
      match: getCandidateJobMatch(profile, job)
    }))
    .sort((left, right) => right.match.score - left.match.score);
}

export function getBestJobMatchForCandidate<T extends MatchableJob>(
  profile: MatchingCandidateProfile,
  jobs: T[]
) {
  const rankedJobs = rankJobsForCandidate(profile, jobs);
  return rankedJobs[0] ?? null;
}
