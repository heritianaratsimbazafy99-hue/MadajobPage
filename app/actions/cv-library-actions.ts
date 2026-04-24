"use server";

import { revalidatePath } from "next/cache";

import {
  getCvLibraryParsingStatus,
  inferCvLibraryCandidateName
} from "@/lib/cv-library-insights";
import { requireRole } from "@/lib/auth";
import { extractPdfTextFromFile } from "@/lib/pdf-text";
import { createAdminClient } from "@/lib/supabase/admin";
import type { CvLibraryParsingStatus } from "@/lib/types";

export type CvLibraryActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

const maxFileSize = 10 * 1024 * 1024;
const maxFilesPerImport = 30;
const cvLibraryBucketId = "cv-library";
const allowedMimeTypes = new Set([
  "application/pdf",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
]);

function getTrimmedValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function sanitizeFileName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function getUploadFiles(formData: FormData) {
  return formData
    .getAll("cv_files")
    .filter((value): value is File => value instanceof File && value.size > 0);
}

function validateCvLibraryFile(file: File) {
  const lowerName = file.name.toLowerCase();

  if (file.size > maxFileSize) {
    return "Chaque fichier doit rester sous 10 Mo.";
  }

  if (
    !allowedMimeTypes.has(file.type) &&
    !lowerName.endsWith(".pdf") &&
    !lowerName.endsWith(".txt") &&
    !lowerName.endsWith(".doc") &&
    !lowerName.endsWith(".docx")
  ) {
    return "Formats acceptes : PDF, TXT, DOC et DOCX.";
  }

  return "";
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Erreur inconnue";
}

function formatImportIssues(issues: string[]) {
  if (!issues.length) {
    return "";
  }

  const visibleIssues = issues.slice(0, 3).join(" ");
  const remainingCount = issues.length - 3;

  return remainingCount > 0
    ? `${visibleIssues} ${remainingCount} autre(s) erreur(s) non affichee(s).`
    : visibleIssues;
}

async function extractCvLibraryText(file: File) {
  const lowerName = file.name.toLowerCase();

  if (file.type === "text/plain" || lowerName.endsWith(".txt")) {
    return file.text();
  }

  if (file.type === "application/pdf" || lowerName.endsWith(".pdf")) {
    return extractPdfTextFromFile(file);
  }

  return "";
}

export async function uploadCvLibraryDocumentsAction(
  _previousState: CvLibraryActionState,
  formData: FormData
): Promise<CvLibraryActionState> {
  const profile = await requireRole(["recruteur", "admin"]);
  const adminClient = createAdminClient();

  if (!adminClient) {
    return {
      status: "error",
      message: "Le client admin Supabase n'est pas disponible. Verifie SUPABASE_SERVICE_ROLE_KEY."
    };
  }

  const files = getUploadFiles(formData);
  const sourceLabel = getTrimmedValue(formData, "source_label") || "Import CVtheque";
  const importTag = getTrimmedValue(formData, "import_tag");

  if (!files.length) {
    return {
      status: "error",
      message: "Selectionnez au moins un CV avant de lancer l'import."
    };
  }

  if (files.length > maxFilesPerImport) {
    return {
      status: "error",
      message: `Import limite a ${maxFilesPerImport} fichiers par lot.`
    };
  }

  let importedCount = 0;
  let parsedCount = 0;
  let unsupportedCount = 0;
  let emptyCount = 0;
  let failedParsingCount = 0;
  const importIssues: string[] = [];

  for (const [index, file] of files.entries()) {
    const validationError = validateCvLibraryFile(file);

    if (validationError) {
      importIssues.push(`${file.name || `Fichier ${index + 1}`} ignore : ${validationError}`);
      continue;
    }

    const safeName = sanitizeFileName(file.name || `cv-${index + 1}.pdf`) || `cv-${index + 1}`;
    const scope = profile.organization_id ?? profile.id;
    const storagePath = `${scope}/${Date.now()}-${index + 1}-${safeName}`;
    let parsedText = "";
    let parsingStatus: CvLibraryParsingStatus = "pending";
    let parsingError: string | null = null;

    try {
      parsedText = await extractCvLibraryText(file);
      parsingStatus = getCvLibraryParsingStatus(file.name, file.type || null, parsedText);
      parsingError =
        parsingStatus === "unsupported"
          ? "Parsing natif reserve aux PDF et TXT pour cette version."
          : null;
    } catch (error) {
      parsingStatus = "failed";
      parsingError = `Parsing impossible : ${getErrorMessage(error)}`;
    }

    const { error: uploadError } = await adminClient.storage
      .from(cvLibraryBucketId)
      .upload(storagePath, file, {
        cacheControl: "3600",
        contentType: file.type || undefined,
        upsert: false
      });

    if (uploadError) {
      importIssues.push(`${file.name || `Fichier ${index + 1}`} non importe : ${uploadError.message}`);
      continue;
    }

    const { error: insertError } = await adminClient.from("cv_library_documents").insert({
      organization_id: profile.role === "recruteur" ? profile.organization_id : null,
      uploaded_by: profile.id,
      source_label: sourceLabel,
      candidate_name: inferCvLibraryCandidateName(file.name) || null,
      bucket_id: cvLibraryBucketId,
      storage_path: storagePath,
      file_name: file.name,
      mime_type: file.type || null,
      file_size: file.size,
      parsing_status: parsingStatus,
      parsing_error: parsingError,
      parsed_text: parsedText || null,
      tags: importTag ? [importTag] : []
    });

    if (insertError) {
      await adminClient.storage.from(cvLibraryBucketId).remove([storagePath]);

      importIssues.push(`${file.name || `Fichier ${index + 1}`} non indexe : ${insertError.message}`);
      continue;
    }

    importedCount += 1;

    if (parsingStatus === "parsed") {
      parsedCount += 1;
    }

    if (parsingStatus === "unsupported") {
      unsupportedCount += 1;
    }

    if (parsingStatus === "empty") {
      emptyCount += 1;
    }

    if (parsingStatus === "failed") {
      failedParsingCount += 1;
    }
  }

  if (importedCount === 0) {
    return {
      status: "error",
      message: formatImportIssues(importIssues) || "Aucun CV n'a pu etre importe."
    };
  }

  revalidatePath("/app/recruteur/cvtheque");
  revalidatePath("/app/admin/cvtheque");

  const issueSummary = formatImportIssues(importIssues);

  return {
    status: "success",
    message: `${importedCount} CV importe(s), ${parsedCount} parse(s), ${unsupportedCount} en attente d'un parsing avance, ${emptyCount} texte vide, ${failedParsingCount} echec(s) parsing.${issueSummary ? ` ${issueSummary}` : ""}`
  };
}
