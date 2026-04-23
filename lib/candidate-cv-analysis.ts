type CandidateCvAnalysisInput = {
  headline: string;
  bio: string;
  city: string;
  current_position: string;
  desired_position: string;
  skills_text: string;
  cv_text: string;
  experience_years: number | null;
  primary_cv: { id: string } | null;
  documentsCount?: number | null;
};

type CandidateCvCatalogEntry = {
  label: string;
  terms: string[];
};

type CandidateCvSignal = {
  label: string;
  value: string;
};

export type CandidateCvAnalysis = {
  score: number;
  tone: "success" | "info" | "muted";
  label: string;
  description: string;
  signals: CandidateCvSignal[];
  strengths: string[];
  watchouts: string[];
  nextActions: string[];
  topKeywords: string[];
  tools: string[];
  languages: string[];
};

const stopWords = new Set([
  "a",
  "ai",
  "an",
  "ans",
  "au",
  "aux",
  "avec",
  "avoir",
  "bonne",
  "bonnes",
  "car",
  "ce",
  "cet",
  "cette",
  "comme",
  "dans",
  "de",
  "des",
  "du",
  "en",
  "est",
  "et",
  "etre",
  "la",
  "le",
  "les",
  "leur",
  "leurs",
  "mes",
  "mon",
  "non",
  "nos",
  "notre",
  "nous",
  "ou",
  "par",
  "plus",
  "pour",
  "poste",
  "profil",
  "que",
  "qui",
  "sur",
  "ses",
  "son",
  "sont",
  "une",
  "un",
  "vos",
  "votre"
]);

const genericTokens = new Set([
  "client",
  "clients",
  "collaboration",
  "communication",
  "competence",
  "competences",
  "connaissance",
  "connaissances",
  "entreprise",
  "equipes",
  "equipe",
  "experience",
  "gestion",
  "mission",
  "missions",
  "objectif",
  "objectifs",
  "organisation",
  "outils",
  "projet",
  "projets",
  "service",
  "services",
  "suivi",
  "travail"
]);

const toolCatalog: CandidateCvCatalogEntry[] = [
  { label: "Excel", terms: ["excel"] },
  { label: "PowerPoint", terms: ["powerpoint", "ppt"] },
  { label: "Word", terms: ["word"] },
  { label: "Google Workspace", terms: ["google workspace", "google docs", "google sheets"] },
  { label: "Canva", terms: ["canva"] },
  { label: "Figma", terms: ["figma"] },
  { label: "Photoshop", terms: ["photoshop"] },
  { label: "Illustrator", terms: ["illustrator"] },
  { label: "Sage", terms: ["sage"] },
  { label: "SAP", terms: ["sap"] },
  { label: "CRM", terms: ["crm", "salesforce", "hubspot"] },
  { label: "SQL", terms: ["sql", "postgresql", "mysql"] },
  { label: "Python", terms: ["python"] },
  { label: "React", terms: ["react"] },
  { label: "Next.js", terms: ["nextjs", "next.js"] },
  { label: "TypeScript", terms: ["typescript"] },
  { label: "Jira", terms: ["jira"] },
  { label: "Notion", terms: ["notion"] }
];

const languageCatalog: CandidateCvCatalogEntry[] = [
  { label: "Francais", terms: ["francais", "français", "french"] },
  { label: "Anglais", terms: ["anglais", "english"] },
  { label: "Malgache", terms: ["malgache", "malagasy"] },
  { label: "Allemand", terms: ["allemand", "german"] },
  { label: "Espagnol", terms: ["espagnol", "spanish"] },
  { label: "Italien", terms: ["italien", "italian"] }
];

const roleCatalog: CandidateCvCatalogEntry[] = [
  {
    label: "Business development / vente B2B",
    terms: [
      "account executive",
      "business developer",
      "business developpement",
      "business development",
      "developpement commercial",
      "sales"
    ]
  },
  {
    label: "Marketing / business",
    terms: ["marketing", "business", "commercial"]
  },
  {
    label: "Support client / relation client",
    terms: ["support client", "customer success", "relation client"]
  },
  {
    label: "Finance / comptabilite",
    terms: ["finance", "comptabilite", "accounting"]
  },
  {
    label: "Developpement web / produit",
    terms: ["react", "next.js", "typescript", "developpeur", "developer"]
  }
];

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(...values: string[]) {
  const tokens = values
    .flatMap((value) => normalizeText(value).split(" "))
    .filter((token) => token.length >= 3 && !stopWords.has(token));

  return Array.from(new Set(tokens));
}

function sortTokens(tokens: string[]) {
  return tokens
    .slice()
    .sort((left, right) => {
      if (right.length !== left.length) {
        return right.length - left.length;
      }

      return left.localeCompare(right, "fr");
    });
}

function getMeaningfulKeywords(tokens: string[], limit = 6) {
  return sortTokens(tokens.filter((token) => !genericTokens.has(token))).slice(0, limit);
}

function detectCatalogEntries(text: string, catalog: CandidateCvCatalogEntry[]) {
  const normalized = normalizeText(text);

  return catalog
    .filter((entry) =>
      entry.terms.some((term) => normalized.includes(normalizeText(term)))
    )
    .map((entry) => entry.label);
}

function inferCandidateTarget(input: CandidateCvAnalysisInput) {
  const explicitTarget =
    input.desired_position.trim() ||
    input.headline.trim() ||
    input.current_position.trim();

  if (explicitTarget) {
    return explicitTarget;
  }

  return detectCatalogEntries(input.cv_text, roleCatalog)[0] ?? "";
}

function detectExperienceYears(input: CandidateCvAnalysisInput) {
  if (typeof input.experience_years === "number") {
    return input.experience_years;
  }

  const normalized = normalizeText(input.cv_text);
  const match = normalized.match(/\b(\d{1,2})\s+ans?\b/);
  return match ? Number.parseInt(match[1] ?? "", 10) : null;
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function getCandidateCvAnalysis(
  input: CandidateCvAnalysisInput
): CandidateCvAnalysis {
  const fullText = [
    input.headline,
    input.bio,
    input.current_position,
    input.desired_position,
    input.skills_text,
    input.cv_text
  ]
    .filter(Boolean)
    .join(" ");

  const topKeywords = getMeaningfulKeywords(
    tokenize(input.skills_text, input.cv_text, input.current_position, input.desired_position),
    6
  );
  const tools = detectCatalogEntries(fullText, toolCatalog).slice(0, 5);
  const languages = detectCatalogEntries(fullText, languageCatalog).slice(0, 4);
  const inferredTarget = inferCandidateTarget(input);
  const hasExplicitTarget = Boolean(
    input.desired_position.trim() || input.current_position.trim() || input.headline.trim()
  );
  const experienceYears = detectExperienceYears(input);
  const cvWordCount = normalizeText(input.cv_text).split(" ").filter(Boolean).length;
  const hasTarget = Boolean(inferredTarget);
  const hasNarrative = input.bio.trim().length >= 40 || input.cv_text.trim().length >= 140;
  const hasSkillsDepth = input.skills_text.trim().length >= 24 || topKeywords.length >= 4;
  const documentsCount = input.documentsCount ?? (input.primary_cv ? 1 : 0);

  let score = 0;
  score += hasTarget ? 18 : 0;
  score += hasSkillsDepth ? 18 : input.skills_text.trim() ? 8 : 0;
  score += cvWordCount >= 70 ? 18 : cvWordCount >= 30 ? 10 : 0;
  score += hasNarrative ? 10 : 0;
  score += tools.length > 0 ? 10 : 0;
  score += languages.length > 0 ? 8 : 0;
  score += experienceYears !== null ? 8 : 0;
  score += input.primary_cv ? 8 : 0;
  score += documentsCount >= 3 ? 2 : 0;

  const finalScore = clampScore(score);

  let label = "Lecture CV a structurer";
  let description =
    "Le dossier existe deja, mais il manque encore assez de matiere pour donner une lecture CV vraiment exploitable.";
  let tone: CandidateCvAnalysis["tone"] = "muted";

  if (finalScore >= 80) {
    label = "Lecture CV exploitable";
    description =
      "Le dossier donne deja une vision claire du positionnement, des competences et des outils mobilisables.";
    tone = "success";
  } else if (finalScore >= 60) {
    label = "Lecture CV en bonne voie";
    description =
      "Le dossier est lisible, mais quelques precises additions peuvent encore le rendre plus convaincant.";
    tone = "info";
  }

  const strengths: string[] = [];
  const watchouts: string[] = [];

  if (hasExplicitTarget) {
    strengths.push("Cible metier deja visible dans le titre ou les postes renseignes.");
  } else if (hasTarget) {
    strengths.push(`Cible metier detectee dans le CV : ${inferredTarget}.`);
  } else {
    watchouts.push("Le poste vise n'est pas encore assez clair.");
  }

  if (hasSkillsDepth) {
    strengths.push(
      topKeywords.length > 0
        ? `Competences detectees : ${topKeywords.slice(0, 4).join(", ")}.`
        : "Base competences deja exploitable."
    );
  } else {
    watchouts.push("Les competences restent trop legeres ou trop generiques.");
  }

  if (cvWordCount >= 30) {
    strengths.push(`Resume CV present avec environ ${cvWordCount} mots exploitables.`);
  } else {
    watchouts.push("Le resume CV est absent ou trop court pour appuyer le dossier.");
  }

  if (tools.length > 0 || languages.length > 0) {
    strengths.push(
      [
        tools.length > 0 ? `Outils : ${tools.join(", ")}` : "",
        languages.length > 0 ? `Langues : ${languages.join(", ")}` : ""
      ]
        .filter(Boolean)
        .join(" · ") + "."
    );
  } else {
    watchouts.push("Les outils et langues utiles ne ressortent pas encore assez.");
  }

  if (experienceYears !== null) {
    strengths.push(`${experienceYears} an(s) d'experience identifies.`);
  } else {
    watchouts.push("Le niveau d'experience n'est pas encore assez quantifie.");
  }

  if (input.primary_cv) {
    strengths.push("Un CV principal est deja disponible pour les candidatures rapides.");
  } else {
    watchouts.push("Aucun CV principal actif n'est disponible.");
  }

  const nextActions =
    watchouts.length > 0
      ? watchouts.slice(0, 4).map((item) => {
          if (item.includes("poste vise")) {
            return "Precisez clairement le poste recherche et le titre professionnel.";
          }

          if (item.includes("competences")) {
            return "Ajoutez des competences concretes, outils ou environnements de travail.";
          }

          if (item.includes("resume CV")) {
            return "Renseignez un resume CV plus dense avec missions, resultats et contexte.";
          }

          if (item.includes("outils et langues")) {
            return "Faites ressortir les langues et outils vraiment operationnels.";
          }

          if (item.includes("experience")) {
            return "Quantifiez mieux l'experience avec des annees ou periodes.";
          }

          if (item.includes("CV principal")) {
            return "Ajoutez ou remplacez le CV principal pour securiser les prochaines candidatures.";
          }

          return item;
        })
      : [
          "Gardez la cible metier alignee avec les offres que vous visez.",
          "Mettez a jour le resume CV des qu'une mission ou responsabilite change.",
          "Conservez un CV principal et des pieces complementaires coherents avec votre positionnement."
        ];

  const signals: CandidateCvSignal[] = [
    {
      label: "Cible",
      value: inferredTarget || "A preciser"
    },
    {
      label: "Competences detectees",
      value: topKeywords.length > 0 ? topKeywords.slice(0, 4).join(", ") : "Signal faible"
    },
    {
      label: "Outils / langues",
      value:
        [...tools.slice(0, 3), ...languages.slice(0, 2)].join(", ") || "A mieux faire ressortir"
    },
    {
      label: "Narration CV",
      value:
        cvWordCount >= 70
          ? "Resume dense et exploitable"
          : cvWordCount >= 30
            ? "Resume present mais encore resumee"
            : "Resume trop court ou absent"
    }
  ];

  return {
    score: finalScore,
    tone,
    label,
    description,
    signals,
    strengths: strengths.slice(0, 4),
    watchouts: watchouts.slice(0, 4),
    nextActions,
    topKeywords,
    tools,
    languages
  };
}
