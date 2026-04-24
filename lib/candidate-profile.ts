type CandidateProfileInsightInput = {
  full_name: string;
  phone: string;
  headline: string;
  city: string;
  bio: string;
  experience_years: number | null;
  current_position: string;
  desired_position: string;
  desired_contract_type?: string;
  desired_work_mode?: string;
  desired_salary_min?: number | null;
  skills_text: string;
  cv_text: string;
  primary_cv: { id: string } | null;
};

type CandidateProfileChecklistItem = {
  key: string;
  label: string;
  action: string;
  isComplete: (profile: CandidateProfileInsightInput) => boolean;
};

function hasText(value: string) {
  return value.trim().length > 0;
}

const checklist: CandidateProfileChecklistItem[] = [
  {
    key: "full_name",
    label: "Nom complet",
    action: "Ajoutez votre nom complet pour personnaliser clairement votre dossier.",
    isComplete: (profile) => hasText(profile.full_name)
  },
  {
    key: "phone",
    label: "Telephone",
    action: "Ajoutez un numero joignable pour fluidifier un premier contact recruteur.",
    isComplete: (profile) => hasText(profile.phone)
  },
  {
    key: "headline",
    label: "Titre professionnel",
    action: "Renseignez un titre clair pour aider les recruteurs a vous identifier rapidement.",
    isComplete: (profile) => hasText(profile.headline)
  },
  {
    key: "city",
    label: "Ville",
    action: "Indiquez votre ville pour apparaitre sur des recherches plus ciblees.",
    isComplete: (profile) => hasText(profile.city)
  },
  {
    key: "current_position",
    label: "Poste actuel",
    action: "Precisez votre poste actuel pour mieux contextualiser votre parcours.",
    isComplete: (profile) => hasText(profile.current_position)
  },
  {
    key: "desired_position",
    label: "Poste recherche",
    action: "Renseignez le type de poste vise pour clarifier votre intention de candidature.",
    isComplete: (profile) => hasText(profile.desired_position)
  },
  {
    key: "search_preferences",
    label: "Preferences de recherche",
    action:
      "Ajoutez un contrat, un mode de travail ou une remuneration souhaitee pour affiner vos recommandations.",
    isComplete: (profile) =>
      hasText(profile.desired_contract_type ?? "") ||
      hasText(profile.desired_work_mode ?? "") ||
      Boolean(profile.desired_salary_min && profile.desired_salary_min > 0)
  },
  {
    key: "skills_text",
    label: "Competences clefs",
    action: "Listez vos competences clefs, outils et langues pour renforcer votre lisibilite.",
    isComplete: (profile) => hasText(profile.skills_text)
  },
  {
    key: "bio",
    label: "Presentation",
    action: "Ajoutez une presentation courte pour mettre en avant votre valeur rapidement.",
    isComplete: (profile) => hasText(profile.bio)
  },
  {
    key: "experience_years",
    label: "Annees d'experience",
    action: "Renseignez votre niveau d'experience pour mieux cadrer votre positionnement.",
    isComplete: (profile) => profile.experience_years !== null
  },
  {
    key: "cv_text",
    label: "Resume de CV",
    action: "Ajoutez un resume de CV pour enrichir votre dossier meme avant parsing avance.",
    isComplete: (profile) => hasText(profile.cv_text)
  },
  {
    key: "primary_cv",
    label: "CV principal",
    action: "Televersez un CV principal pour joindre automatiquement un document a vos prochaines candidatures.",
    isComplete: (profile) => Boolean(profile.primary_cv)
  }
];

export type CandidateProfileInsights = {
  completion: number;
  completedCount: number;
  totalCount: number;
  missingItems: string[];
  nextActions: string[];
  readinessLabel: string;
  readinessDescription: string;
};

export function getCandidateProfileInsights(
  profile: CandidateProfileInsightInput
): CandidateProfileInsights {
  const completedItems = checklist.filter((item) => item.isComplete(profile));
  const missingItems = checklist.filter((item) => !item.isComplete(profile));
  const completion = Math.round((completedItems.length / checklist.length) * 100);

  let readinessLabel = "Dossier a renforcer";
  let readinessDescription =
    "Votre profil existe deja, mais plusieurs informations clefs manquent encore pour bien soutenir vos candidatures.";

  if (completion >= 85) {
    readinessLabel = "Dossier pret a candidater";
    readinessDescription =
      "Votre dossier couvre l'essentiel. Gardez-le a jour et restez reactif sur vos candidatures actives.";
  } else if (completion >= 60) {
    readinessLabel = "Dossier en bonne voie";
    readinessDescription =
      "Votre profil est deja exploitable, mais quelques ajouts peuvent encore ameliorer votre lisibilite.";
  }

  const nextActions =
    missingItems.length > 0
      ? missingItems.slice(0, 4).map((item) => item.action)
      : [
          "Gardez votre CV principal aligne avec les postes que vous visez.",
          "Continuez a suivre vos candidatures actives depuis la plateforme.",
          "Mettez a jour votre profil des qu'un element de parcours evolue."
        ];

  return {
    completion,
    completedCount: completedItems.length,
    totalCount: checklist.length,
    missingItems: missingItems.map((item) => item.label),
    nextActions,
    readinessLabel,
    readinessDescription
  };
}
