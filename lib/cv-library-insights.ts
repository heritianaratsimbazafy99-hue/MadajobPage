import type { CvLibraryDocument, CvLibraryParsingStatus } from "@/lib/types";

export type CvLibraryMatchingProfile = {
  headline: string;
  city: string;
  current_position: string;
  desired_position: string;
  skills_text: string;
  cv_text: string;
  profile_completion: number;
};

export type CvLibrarySummary = {
  totalCount: number;
  parsedCount: number;
  unsupportedCount: number;
  emptyCount: number;
  recentCount: number;
};

const recentWindowInMs = 7 * 24 * 60 * 60 * 1000;

function stripExtension(fileName: string) {
  return fileName.replace(/\.[^.]+$/, "");
}

export function inferCvLibraryCandidateName(fileName: string) {
  return stripExtension(fileName)
    .replace(/[_-]+/g, " ")
    .replace(/\b(cv|resume|curriculum|vitae)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function getCvLibraryParsingStatus(
  fileName: string,
  mimeType: string | null,
  parsedText: string
): CvLibraryParsingStatus {
  const lowerName = fileName.toLowerCase();
  const isPdf = mimeType === "application/pdf" || lowerName.endsWith(".pdf");
  const isText = mimeType === "text/plain" || lowerName.endsWith(".txt");

  if (!isPdf && !isText) {
    return "unsupported";
  }

  return parsedText.trim().length > 0 ? "parsed" : "empty";
}

export function buildCvLibraryMatchingProfile(
  document: Pick<
    CvLibraryDocument,
    "candidate_name" | "file_name" | "parsed_text" | "parsing_status"
  >
): CvLibraryMatchingProfile {
  const displayName = document.candidate_name || inferCvLibraryCandidateName(document.file_name);
  const hasParsedText = document.parsing_status === "parsed" && document.parsed_text.trim().length > 0;

  return {
    headline: hasParsedText ? `${displayName} ${document.parsed_text.slice(0, 180)}` : displayName,
    city: "",
    current_position: displayName,
    desired_position: hasParsedText ? document.parsed_text.slice(0, 220) : "",
    skills_text: hasParsedText ? document.parsed_text : "",
    cv_text: hasParsedText ? document.parsed_text : "",
    profile_completion: hasParsedText ? 85 : 20
  };
}

export function summarizeCvLibraryDocuments(
  documents: CvLibraryDocument[],
  now = Date.now()
): CvLibrarySummary {
  return {
    totalCount: documents.length,
    parsedCount: documents.filter((document) => document.parsing_status === "parsed").length,
    unsupportedCount: documents.filter((document) => document.parsing_status === "unsupported").length,
    emptyCount: documents.filter((document) => document.parsing_status === "empty").length,
    recentCount: documents.filter(
      (document) => now - new Date(document.created_at).getTime() <= recentWindowInMs
    ).length
  };
}
