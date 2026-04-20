export const supplementaryDocumentTypeOptions = [
  {
    value: "cover_letter",
    label: "Lettre de motivation",
    description: "Ajoutez une lettre reusable pour vos prochains dossiers."
  },
  {
    value: "portfolio",
    label: "Portfolio",
    description: "Ajoutez un portfolio, book ou dossier de realisations."
  },
  {
    value: "certificate",
    label: "Certificat",
    description: "Ajoutez un certificat, diplome ou piece justificative."
  },
  {
    value: "identity",
    label: "Piece d'identite",
    description: "Ajoutez une piece administrative utile pour la suite du processus."
  },
  {
    value: "recommendation",
    label: "Reference",
    description: "Ajoutez une recommandation ou un document de reference."
  },
  {
    value: "other",
    label: "Autre document",
    description: "Ajoutez toute autre piece utile a votre dossier candidat."
  }
] as const;

const documentTypeEntries: Array<[string, { label: string; description: string }]> = [
  [
    "cv",
    {
      label: "CV",
      description: "Document de reference principal pour vos candidatures."
    }
  ],
  ...supplementaryDocumentTypeOptions.map(
    (option): [string, { label: string; description: string }] => [
      option.value,
      {
        label: option.label,
        description: option.description
      }
    ]
  )
];

const documentTypeLabels = new Map<string, { label: string; description: string }>(
  documentTypeEntries
);

function humanizeDocumentType(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function getCandidateDocumentTypeMeta(documentType: string) {
  return (
    documentTypeLabels.get(documentType) ?? {
      label: humanizeDocumentType(documentType),
      description: "Document rattache a votre espace candidat."
    }
  );
}
