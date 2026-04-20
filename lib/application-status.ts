function humanizeStatus(status: string) {
  return status
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export const applicationStatusOptions = [
  {
    value: "submitted",
    label: "Soumise",
    description:
      "Votre candidature a bien ete recue et elle est maintenant visible dans votre suivi.",
    candidateHint:
      "Aucune action urgente n'est requise. Gardez simplement votre profil et votre CV a jour."
  },
  {
    value: "screening",
    label: "En etude",
    description:
      "Votre dossier est en cours d'analyse par l'equipe recrutement.",
    candidateHint:
      "Surveillez votre email et votre telephone pour un premier retour."
  },
  {
    value: "interview",
    label: "Entretien",
    description:
      "Votre candidature avance dans le process et un echange est en preparation ou deja planifie.",
    candidateHint:
      "Preparez vos disponibilites, vos exemples de realisations et relisez l'offre."
  },
  {
    value: "shortlist",
    label: "Shortlist",
    description:
      "Votre profil fait partie des dossiers retenus pour la suite du recrutement.",
    candidateHint:
      "Restez reactif si l'equipe vous demande des precisions ou des documents complementaires."
  },
  {
    value: "hired",
    label: "Retenue",
    description:
      "Bonne nouvelle, votre candidature a ete retenue pour ce poste.",
    candidateHint:
      "Surveillez vos messages pour la suite du parcours administratif et contractuel."
  },
  {
    value: "rejected",
    label: "Non retenue",
    description:
      "Le recrutement n'a pas ete poursuivi sur cette offre.",
    candidateHint:
      "Continuez a postuler: votre profil reste mobilisable sur d'autres opportunites."
  }
] as const;

export const applicationStatusValues = applicationStatusOptions.map(
  (option) => option.value
);

const applicationStatusMap = new Map<string, (typeof applicationStatusOptions)[number]>(
  applicationStatusOptions.map((option) => [option.value, option])
);

export function getApplicationStatusMeta(status: string) {
  return (
    applicationStatusMap.get(status) ?? {
      value: status,
      label: humanizeStatus(status),
      description: "Votre candidature suit son traitement sur la plateforme Madajob.",
      candidateHint:
        "Le suivi continue dans votre espace candidat. Nous vous afficherons ici la prochaine evolution."
    }
  );
}

export function isFinalApplicationStatus(status: string) {
  return status === "hired" || status === "rejected";
}
