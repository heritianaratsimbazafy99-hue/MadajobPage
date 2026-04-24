import type { Job, ManagedJob } from "@/lib/types";
import { getComparableMonthlySalary, hasVisibleSalary } from "@/lib/job-salary";

export type MatchingCandidateProfile = {
  headline?: string | null;
  city?: string | null;
  current_position?: string | null;
  desired_position?: string | null;
  desired_contract_type?: string | null;
  desired_work_mode?: string | null;
  desired_salary_min?: number | null;
  desired_salary_currency?: string | null;
  desired_sectors?: string[] | null;
  desired_locations?: string[] | null;
  desired_experience_level?: string | null;
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
  Partial<
    Pick<
      ManagedJob,
      | "requirements"
      | "responsibilities"
      | "benefits"
      | "salary_min"
      | "salary_max"
      | "salary_currency"
      | "salary_period"
      | "salary_is_visible"
    >
  >;

export type JobMatchBreakdownItem = {
  key: "focus" | "skills" | "location" | "preferences" | "profile" | "gap";
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

const genericJobKeywords = new Set([
  "bonne",
  "bonnes",
  "capacite",
  "capacites",
  "client",
  "clients",
  "collaboration",
  "communication",
  "competence",
  "competences",
  "connaissance",
  "connaissances",
  "equipe",
  "equipes",
  "experience",
  "gestion",
  "mission",
  "missions",
  "niveau",
  "objectifs",
  "organisation",
  "outils",
  "poste",
  "profil",
  "projet",
  "projets",
  "service",
  "services",
  "suivi",
  "travail"
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

function getMeaningfulKeywords(tokens: string[], limit = 6) {
  return pickTopKeywords(
    tokens.filter((token) => token.length >= 4 && !genericJobKeywords.has(token)),
    limit
  );
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

function getExperienceLevelTokens(level: string) {
  if (level.includes("lead") || level.includes("management")) {
    return ["lead", "management", "manager", "direction", "directeur", "responsable", "head", "chef"];
  }

  if (level.includes("senior")) {
    return ["senior", "experimente", "confirme", "responsable", "5 ans", "6 ans", "7 ans"];
  }

  if (level.includes("intermediaire")) {
    return ["intermediaire", "confirme", "2 ans", "3 ans", "4 ans"];
  }

  if (level.includes("junior")) {
    return ["junior", "debutant", "stage", "stagiaire", "alternance", "assistant"];
  }

  return level ? [level] : [];
}

function getPreferenceScore(profile: MatchingCandidateProfile, job: MatchableJob) {
  const desiredContract = normalizeText(profile.desired_contract_type ?? "");
  const desiredWorkMode = normalizeText(profile.desired_work_mode ?? "");
  const desiredSectors = (profile.desired_sectors ?? []).map(normalizeText).filter(Boolean);
  const desiredLocations = (profile.desired_locations ?? []).map(normalizeText).filter(Boolean);
  const desiredExperienceLevel = normalizeText(profile.desired_experience_level ?? "");
  const jobSector = normalizeText(job.sector);
  const jobLocation = normalizeText(job.location);
  const jobExperienceText = normalizeText(
    [job.title, job.summary, job.requirements, job.responsibilities].filter(Boolean).join(" ")
  );
  const desiredSalaryMin =
    typeof profile.desired_salary_min === "number" && profile.desired_salary_min > 0
      ? profile.desired_salary_min
      : null;
  const desiredCurrency = profile.desired_salary_currency || "MGA";
  const jobCurrency = job.salary_currency || "MGA";
  const contractMatches =
    Boolean(desiredContract) && normalizeText(job.contract_type).includes(desiredContract);
  const workModeMatches =
    Boolean(desiredWorkMode) && normalizeText(job.work_mode).includes(desiredWorkMode);
  const sectorMatches =
    desiredSectors.length > 0 &&
    jobSector.length > 0 &&
    desiredSectors.some(
      (sector) => jobSector.includes(sector) || sector.includes(jobSector)
    );
  const locationMatches =
    desiredLocations.length > 0 &&
    jobLocation.length > 0 &&
    desiredLocations.some(
      (location) => jobLocation.includes(location) || location.includes(jobLocation)
    );
  const experienceLevelMatches =
    Boolean(desiredExperienceLevel) &&
    getExperienceLevelTokens(desiredExperienceLevel).some((token) => jobExperienceText.includes(token));
  const salaryIsComparable =
    Boolean(desiredSalaryMin) &&
    hasVisibleSalary(job) &&
    jobCurrency === desiredCurrency &&
    getComparableMonthlySalary(job) > 0;
  const salaryMatches =
    Boolean(desiredSalaryMin) &&
    salaryIsComparable &&
    getComparableMonthlySalary(job) >= Number(desiredSalaryMin);

  return {
    score:
      (contractMatches ? 6 : 0) +
      (workModeMatches ? 6 : 0) +
      (sectorMatches ? 6 : 0) +
      (locationMatches ? 6 : 0) +
      (experienceLevelMatches ? 4 : 0) +
      (salaryMatches ? 8 : 0),
    hasPreferenceSignal: Boolean(
      desiredContract ||
        desiredWorkMode ||
        desiredSalaryMin ||
        desiredSectors.length > 0 ||
        desiredLocations.length > 0 ||
        desiredExperienceLevel
    ),
    contractMatches,
    workModeMatches,
    sectorMatches,
    locationMatches,
    experienceLevelMatches,
    salaryMatches,
    salaryIsComparable,
    desiredSalaryMin,
    desiredCurrency
  };
}

function getPreferenceBreakdownValue(
  profile: MatchingCandidateProfile,
  job: MatchableJob,
  preference: ReturnType<typeof getPreferenceScore>
) {
  const details: string[] = [];

  if (profile.desired_contract_type) {
    details.push(
      preference.contractMatches
        ? `contrat ${profile.desired_contract_type} aligne`
        : `contrat ${profile.desired_contract_type} a verifier`
    );
  }

  if (profile.desired_work_mode) {
    details.push(
      preference.workModeMatches
        ? `mode ${profile.desired_work_mode} aligne`
        : `mode ${profile.desired_work_mode} a verifier`
    );
  }

  if (profile.desired_sectors?.length) {
    details.push(
      preference.sectorMatches
        ? `secteur cible aligne (${profile.desired_sectors.join(", ")})`
        : "secteur cible a verifier"
    );
  }

  if (profile.desired_locations?.length) {
    details.push(
      preference.locationMatches
        ? `lieu souhaite aligne (${profile.desired_locations.join(", ")})`
        : "lieu souhaite a verifier"
    );
  }

  if (profile.desired_experience_level) {
    details.push(
      preference.experienceLevelMatches
        ? `niveau ${profile.desired_experience_level} visible dans l'offre`
        : `niveau ${profile.desired_experience_level} a confirmer`
    );
  }

  if (preference.desiredSalaryMin) {
    if (preference.salaryMatches) {
      details.push(`remuneration visible compatible avec ${preference.desiredCurrency}`);
    } else if (!hasVisibleSalary(job)) {
      details.push("remuneration de l'offre non visible");
    } else if ((job.salary_currency || "MGA") !== preference.desiredCurrency) {
      details.push("devise de remuneration differente");
    } else if (preference.salaryIsComparable) {
      details.push("remuneration visible sous le minimum souhaite");
    }
  }

  return details.length > 0
    ? `${details.join(", ")}.`
    : "Aucune preference de contrat, mode ou remuneration renseignee.";
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
  const candidateSignals = Array.from(new Set([...focusTokens, ...candidateKeywordTokens]));
  const meaningfulJobKeywords = getMeaningfulKeywords(
    [...jobFocusTokens, ...jobKeywordTokens],
    8
  );
  const meaningfulMatchedKeywords = getMeaningfulKeywords(
    [...titleMatches, ...keywordMatches],
    4
  );
  const matchedKeywords =
    meaningfulMatchedKeywords.length > 0
      ? meaningfulMatchedKeywords
      : pickTopKeywords([...titleMatches, ...keywordMatches]);
  const missingKeywords = meaningfulJobKeywords.filter(
    (keyword) => !candidateSignals.includes(keyword)
  );
  const completion =
    typeof profile.profile_completion === "number" ? profile.profile_completion : 0;
  const hasFocusSignal = focusTokens.length > 0;
  const hasSkillSignal = candidateKeywordTokens.length > 0;
  const hasLocationSignal = locationTokens.length > 0;
  const preferenceScore = getPreferenceScore(profile, job);
  const hasSignal = hasFocusSignal || hasSkillSignal || preferenceScore.hasPreferenceSignal;

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
        },
        {
          key: "gap",
          label: "Points a verifier",
          value: "Les ecarts seront calcules des que le poste vise et les competences seront renseignes."
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
  const score = clampScore(
    titleScore + keywordScore + locationScore + completionScore + preferenceScore.score
  );
  const level = getLevel(score);
  const extraSkillMatches = keywordMatches.filter((keyword) => !titleMatches.includes(keyword));
  const profileBreakdown = getProfileCoverageLabel(completion);
  const highlightedGaps = pickTopKeywords(missingKeywords, 3);

  let reason = "Le profil est encore eloigne de cette offre pour le moment.";
  let nextStep =
    "Completez le profil ou les exigences de l'offre pour fiabiliser davantage ce matching.";

  if (directFocusAlignment && keywordMatches.length > 0) {
    reason = `Le poste vise recoupe clairement l'intitule de l'offre, avec des signaux sur ${matchedKeywords.join(", ")}.`;
    nextStep =
      highlightedGaps.length > 0
        ? `Priorisez un contact rapide, puis confirmez surtout ${highlightedGaps.join(", ")}.`
        : "Priorisez un contact rapide ou une candidature si les prerequis restants sont confirmes.";
  } else if (titleMatches.length > 0 && matchedKeywords.length > 0) {
    reason = `Cible metier et competences deja visibles sur ${matchedKeywords.join(", ")}.`;
    nextStep =
      highlightedGaps.length > 0
        ? `Verifiez surtout ${highlightedGaps.join(", ")} avant d'avancer ce dossier.`
        : "Verifiez surtout le niveau attendu, la disponibilite et les criteres de tri restants.";
  } else if (titleMatches.length > 0) {
    reason = "Le poste vise recoupe clairement l'intitule de cette offre.";
    nextStep =
      highlightedGaps.length > 0
        ? `Le titre est coherent. Il reste surtout a confirmer ${highlightedGaps.join(", ")}.`
        : "Le titre est coherent. Il reste surtout a confirmer les competences clefs du poste.";
  } else if (keywordMatches.length > 0) {
    reason = `Competences detectees dans l'offre: ${matchedKeywords.join(", ")}.`;
    nextStep =
      highlightedGaps.length > 0
        ? `La base competences est presente, mais il faut encore lever ${highlightedGaps.join(", ")}.`
        : "La base competences est presente, mais la cible metier merite encore d'etre precisee.";
  } else if (locationMatches.length > 0) {
    reason = "La localisation du candidat reste coherente avec cette offre.";
    nextStep =
      highlightedGaps.length > 0
        ? `La proximite geographique est bonne, mais le profil doit encore couvrir ${highlightedGaps.join(", ")}.`
        : "La proximite geographique est bonne, mais le contenu du profil doit encore etre aligne avec le poste.";
  } else if (preferenceScore.score >= 10) {
    reason =
      "Les preferences de contrat, mode de travail ou remuneration rapprochent ce poste de la recherche du candidat.";
    nextStep =
      "Confirmez maintenant l'adequation metier et les competences clefs avant d'avancer.";
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
    }
  ];

  if (preferenceScore.hasPreferenceSignal) {
    breakdown.push({
      key: "preferences",
      label: "Preferences",
      value: getPreferenceBreakdownValue(profile, job, preferenceScore)
    });
  }

  breakdown.push(
    {
      key: "profile",
      label: "Profil",
      value: profileBreakdown
    },
    {
      key: "gap",
      label: "Points a verifier",
      value:
        highlightedGaps.length > 0
          ? `Verifier surtout ${highlightedGaps.join(", ")} avant arbitrage.`
          : meaningfulJobKeywords.length > 0
            ? "Aucun ecart majeur n'apparait dans les mots clefs les plus visibles."
            : "L'offre donne encore peu de signaux exploitables sur les prerequis."
    }
  );

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
