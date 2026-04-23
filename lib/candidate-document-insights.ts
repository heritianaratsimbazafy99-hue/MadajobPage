import { supplementaryDocumentTypeOptions } from "@/lib/candidate-documents";
import type { CandidateDocumentData } from "@/lib/types";

const recommendedSupplementaryTypes = ["cover_letter", "portfolio", "certificate", "recommendation"];

export type CandidateDocumentWorkspaceSummary = {
  totalCount: number;
  cvCount: number;
  supplementaryCount: number;
  distinctSupplementaryTypes: number;
  latestDocument: CandidateDocumentData | null;
  recentCount: number;
  missingRecommendedTypes: string[];
  readinessLabel: string;
  readinessDescription: string;
  nextActions: string[];
};

function getDocumentTypeLabel(value: string) {
  return (
    supplementaryDocumentTypeOptions.find((option) => option.value === value)?.label ??
    value.replace(/[_-]+/g, " ").replace(/\b\w/g, (character) => character.toUpperCase())
  );
}

export function summarizeCandidateDocuments(
  documents: CandidateDocumentData[]
): CandidateDocumentWorkspaceSummary {
  const cvDocuments = documents.filter((document) => document.document_type === "cv");
  const supplementaryDocuments = documents.filter((document) => document.document_type !== "cv");
  const latestDocument = documents[0] ?? null;
  const supplementaryTypes = new Set(
    supplementaryDocuments.map((document) => document.document_type)
  );
  const recentCount = documents.filter((document) => {
    const ageDays = (Date.now() - new Date(document.created_at).getTime()) / 86_400_000;
    return ageDays <= 30;
  }).length;
  const missingRecommendedTypes = recommendedSupplementaryTypes
    .filter((type) => !supplementaryTypes.has(type))
    .map((type) => getDocumentTypeLabel(type));

  let readinessLabel = "Dossier documentaire a renforcer";
  let readinessDescription =
    "Votre espace documents existe deja, mais il peut encore mieux couvrir les pieces reutilisables pour vos candidatures.";

  if (cvDocuments.length > 0 && missingRecommendedTypes.length <= 1) {
    readinessLabel = "Dossier documentaire solide";
    readinessDescription =
      "Vous disposez deja d'un socle utile pour candidater et repondre plus vite aux prochaines demandes.";
  } else if (cvDocuments.length > 0 && supplementaryTypes.size >= 2) {
    readinessLabel = "Dossier documentaire en bonne voie";
    readinessDescription =
      "Votre base est deja exploitable. Quelques pieces complementaires peuvent encore fluidifier la suite du parcours.";
  }

  const nextActions =
    missingRecommendedTypes.length > 0
      ? missingRecommendedTypes.slice(0, 4).map((label) => `Ajouter ou mettre a jour : ${label}.`)
      : [
          "Gardez votre CV principal aligne avec les postes que vous ciblez.",
          "Archivez seulement les pieces vraiment reutilisables sur plusieurs offres.",
          "Mettez a jour vos documents des qu'une information cle change."
        ];

  return {
    totalCount: documents.length,
    cvCount: cvDocuments.length,
    supplementaryCount: supplementaryDocuments.length,
    distinctSupplementaryTypes: supplementaryTypes.size,
    latestDocument,
    recentCount,
    missingRecommendedTypes,
    readinessLabel,
    readinessDescription,
    nextActions
  };
}
