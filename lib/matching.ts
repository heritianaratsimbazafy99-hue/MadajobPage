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

export type JobMatchBreakdownItem = {
  key: "focus" | "skills" | "location" | "profile";
  label: string;
  value: string;
};

export type JobMatchResult = {
  score: number;
  level: "fort" | "bon" | "moyen" | "faible";
  tone: "success" | "info" | "muted";
  label: string;
  reason: string;
  matchedKeywords: string[];
  hasSignal: boolean;
  breakdown: JobMatchBreakdownItem[];
  nextStep: string;
};

const stopWords = new Set([
  "a",
  "au",
  "aux",
  "avec",
  "ce",
  "cet",
  "cette",
  "de",
  "des",
  "du",
  "dans",
  "d",
  "en",
  "et",
  "la",
  "le",
  "les",
  "leur",
  "leurs",
  "non",
  "nos",
  "notre",
  "nous",
  "pour",
  "plus",
  "poste",
  "offre",
  "par",
  "pas",
  "que",
  "qui",
  "sur",
  "ses",
  "son",
  "sa",
  "sont",
  "the",
  "their",
  "this",
  "that",
  "sans",
  "vous",
  "une",
  "un",
  "est",
  "vos",
  "votre",
  "and",
  "for",
  "job",
  "from",
  "with",
  "ou",
  "ces"
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

function sortKeywords(tokens: string[]) {
  return tokens
    .slice()
    .sort((left, right) => {
      if (right.length !== left.length) {
        return right.length - left.length;
      }

      return left.localeCompare(right, "fr");
    });
}

function pickTopKeywords(tokens: string[], limit = 4) {
  return Array.from(new Set(sortKeywords(tokens))).slice(0, limit);
}

function hasDirectTextOverlap(left: Array<string | null | undefined>, right: string | null | undefined) {
  const normalizedRight = normalizeText(right ?? "");

  if (!normalizedRight) {
    return false;
  }

  return left.some((entry) => {
    const normalizedEntry = normalizeText(entry ?? "");
    return (
      normalizedEntry.length >= 3 &&
      (normalizedEntry.includes(normalizedRight) || normalizedRight.includes(normalizedEntry))
    );
  });
}

function getCoverage(matches: string[], referenceTokens: string[], cap: number) {
  const referenceSize = Math.max(1, Math.min(cap, referenceTokens.length));
  return Math.min(1, matches.length / referenceSize);
}

function getCompletionScore(profile: MatchingCandidateProfile) {
  const completion =
    typeof profile.profile_completion === "number" ? profile.profile_completion : 0;
  const completionScore = Math.min(12, Math.round(completion / 8));
  const depthBonus =
    (profile.desired_position || profile.current_position || profile.headline ? 4 : 0) +
    (profile.skills_text ? 4 : 0) +
    (profile.cv_text ? 2 : 0);

  return Math.min(20, completionScore + depthBonus);
}

function getProfileCoverageLabel(completion: number) {
  if (completion >= 85) {
    return `Profil bien consolide (${completion}%).`;
  }

  if (completion >= 60) {
    return `Profil exploitable (${completion}%).`;
  }

  if (completion > 0) {
    return `Profil encore partiel (${completion}%).`;
  }

  return "Profil encore peu renseigne.";
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
  const focusSources = [profile.desired_position, profile.current_position, profile.headline];
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
  const matchedKeywords = pickTopKeywords([...titleMatches, ...keywordMatches]);
  const completion =
    typeof profile.profile_completion === "number" ? profile.profile_completion : 0;
  const hasFocusSignal = focusTokens.length > 0;
  const hasSkillSignal = candidateKeywordTokens.length > 0;
  const hasLocationSignal = locationTokens.length > 0;
  const hasSignal = hasFocusSignal || hasSkillSignal;

  if (!hasSignal) {
    return {
      score: 0,
      level: "faible",
      tone: "muted",
      label: "Profil a completer",
      reason: "Renseignez le poste vise, les competences et votre ville pour activer le matching.",
      matchedKeywords: [],
      hasSignal: false,
      breakdown: [
        {
          key: "focus",
          label: "Cible metier",
          value: "Poste vise a preciser."
        },
        {
          key: "skills",
          label: "Competences",
          value: "Competences et CV a completer."
        },
        {
          key: "location",
          label: "Localisation",
          value: hasLocationSignal ? "Ville renseignee, a croiser avec les offres." : "Ville non renseignee."
        },
        {
          key: "profile",
          label: "Profil",
          value: getProfileCoverageLabel(completion)
        }
      ],
      nextStep: "Commencez par renseigner un poste vise et quelques competences clefs pour activer des suggestions fiables."
    };
  }

  const directFocusAlignment = hasDirectTextOverlap(focusSources, job.title);
  const focusCoverage = getCoverage(titleMatches, jobFocusTokens, 4);
  const titleScore = Math.min(
    45,
    Math.round(focusCoverage * 30) + titleMatches.length * 8 + (directFocusAlignment ? 11 : 0)
  );
  const keywordCoverage = getCoverage(keywordMatches, jobKeywordTokens, 6);
  const keywordScore = Math.min(35, keywordMatches.length * 6 + Math.round(keywordCoverage * 8));
  const locationScore = locationMatches.length > 0 ? 10 : 0;
  const completionScore = getCompletionScore(profile);
  const score = clampScore(titleScore + keywordScore + locationScore + completionScore);
  const level = getLevel(score);
  const extraSkillMatches = keywordMatches.filter((keyword) => !titleMatches.includes(keyword));
  const profileBreakdown = getProfileCoverageLabel(completion);

  let reason = "Le profil est encore eloigne de cette offre pour le moment.";
  let nextStep =
    "Completez le profil ou les exigences de l'offre pour fiabiliser davantage ce matching.";

  if (directFocusAlignment && keywordMatches.length > 0) {
    reason = `Le poste vise recoupe clairement l'intitule de l'offre, avec des signaux sur ${matchedKeywords.join(", ")}.`;
    nextStep = "Priorisez un contact rapide ou une candidature si les prerequis restants sont confirmes.";
  } else if (titleMatches.length > 0 && matchedKeywords.length > 0) {
    reason = `Cible metier et competences deja visibles sur ${matchedKeywords.join(", ")}.`;
    nextStep = "Verifiez surtout le niveau attendu, la disponibilite et les criteres de tri restants.";
  } else if (titleMatches.length > 0) {
    reason = "Le poste vise recoupe clairement l'intitule de cette offre.";
    nextStep = "Le titre est coherent. Il reste surtout a confirmer les competences clefs du poste.";
  } else if (keywordMatches.length > 0) {
    reason = `Competences detectees dans l'offre: ${matchedKeywords.join(", ")}.`;
    nextStep = "La base competences est presente, mais la cible metier merite encore d'etre precisee.";
  } else if (locationMatches.length > 0) {
    reason = "La localisation du candidat reste coherente avec cette offre.";
    nextStep = "La proximite geographique est bonne, mais le contenu du profil doit encore etre aligne avec le poste.";
  }

  const breakdown: JobMatchBreakdownItem[] = [
    {
      key: "focus",
      label: "Cible metier",
      value: directFocusAlignment
        ? `Intitule tres proche du poste (${pickTopKeywords(titleMatches, 2).join(", ") || "titre aligne"}).`
        : titleMatches.length > 0
          ? `${titleMatches.length} repere(s) commun(s) avec le titre de l'offre.`
          : hasFocusSignal
            ? "Cible renseignee, mais encore peu recoupee avec le titre."
            : "Poste vise non renseigne."
    },
    {
      key: "skills",
      label: "Competences",
      value:
        keywordMatches.length > 0
          ? `${keywordMatches.length} mot(s) clef detecte(s)${extraSkillMatches.length > 0 ? ` : ${pickTopKeywords(extraSkillMatches).join(", ")}` : ` : ${matchedKeywords.join(", ")}`}.`
          : hasSkillSignal
            ? "Competences renseignees, mais peu visibles dans cette offre."
            : "Competences ou CV non renseignes."
    },
    {
      key: "location",
      label: "Localisation",
      value:
        locationMatches.length > 0
          ? "Ville coherente avec l'offre."
          : hasLocationSignal
            ? "Localisation a confirmer par rapport a l'offre."
            : "Ville non renseignee."
    },
    {
      key: "profile",
      label: "Profil",
      value: profileBreakdown
    }
  ];

  return {
    score,
    level,
    tone: getTone(level),
    label: `Match ${score}%`,
    reason,
    matchedKeywords,
    hasSignal: true,
    breakdown,
    nextStep
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
