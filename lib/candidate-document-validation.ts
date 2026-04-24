export type CandidateUploadKind = "cv" | "supplementary";

export type CandidateUploadDescriptor = {
  name: string;
  type: string;
  size: number;
};

const maxCandidateDocumentSize = 10 * 1024 * 1024;

const cvExtensions = new Set(["pdf", "doc", "docx"]);
const supplementaryExtensions = new Set(["pdf", "doc", "docx", "png", "jpg", "jpeg"]);

const cvMimeTypes = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
]);

const supplementaryMimeTypes = new Set([
  ...cvMimeTypes,
  "image/png",
  "image/jpeg"
]);

function getExtension(fileName: string) {
  const parts = fileName.toLowerCase().split(".");
  return parts.length > 1 ? parts.pop() ?? "" : "";
}

export function validateCandidateUploadFile(
  file: CandidateUploadDescriptor,
  kind: CandidateUploadKind
) {
  if (file.size > maxCandidateDocumentSize) {
    return "Le fichier ne doit pas depasser 10 Mo.";
  }

  const extension = getExtension(file.name);
  const mimeType = file.type.trim().toLowerCase();
  const allowedExtensions = kind === "cv" ? cvExtensions : supplementaryExtensions;
  const allowedMimeTypes = kind === "cv" ? cvMimeTypes : supplementaryMimeTypes;
  const hasAllowedExtension = allowedExtensions.has(extension);
  const hasAllowedMimeType = Boolean(mimeType) && allowedMimeTypes.has(mimeType);

  if (!hasAllowedExtension && !hasAllowedMimeType) {
    return kind === "cv"
      ? "Format non accepte. Ajoutez un CV PDF, DOC ou DOCX."
      : "Format non accepte. Ajoutez un document PDF, DOC, DOCX, PNG ou JPG.";
  }

  return "";
}
