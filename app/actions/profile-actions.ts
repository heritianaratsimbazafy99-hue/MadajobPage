"use server";

import { revalidatePath } from "next/cache";

import { supplementaryDocumentTypeOptions } from "@/lib/candidate-documents";
import { syncCandidateProfileTextFromUploadedFile } from "@/lib/candidate-cv-text";
import { getCandidateProfileInsights } from "@/lib/candidate-profile";
import { requireRole } from "@/lib/auth";
import {
  JOB_CONTRACT_TYPE_OPTIONS,
  JOB_WORK_MODE_OPTIONS
} from "@/lib/job-options";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type ProfileActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

const defaultState: ProfileActionState = {
  status: "idle",
  message: ""
};

const allowedSupplementaryDocumentTypes = new Set(
  supplementaryDocumentTypeOptions.map((option) => option.value)
);
const allowedContractTypes = new Set<string>(JOB_CONTRACT_TYPE_OPTIONS);
const allowedWorkModes = new Set<string>(JOB_WORK_MODE_OPTIONS);
const allowedSalaryCurrencies = new Set(["MGA", "EUR", "USD"]);

function getTrimmedValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function getNullableNumber(formData: FormData, key: string) {
  const raw = String(formData.get(key) ?? "").trim();

  if (!raw) {
    return null;
  }

  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

function sanitizeFileName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function getUploadFile(formData: FormData, key: string) {
  const value = formData.get(key);

  if (!(value instanceof File) || value.size === 0) {
    return null;
  }

  return value;
}

function validateCandidateDocumentFile(file: File) {
  if (file.size > 10 * 1024 * 1024) {
    return "Le fichier ne doit pas depasser 10 Mo.";
  }

  return "";
}

async function cleanupUploadedFile(bucketId: string, storagePath: string) {
  const adminClient = createAdminClient();

  if (!adminClient) {
    return;
  }

  await adminClient.storage.from(bucketId).remove([storagePath]);
}

export async function uploadCandidateCvAction(formData: FormData): Promise<ProfileActionState> {
  const profile = await requireRole(["candidat"]);
  const adminClient = createAdminClient();

  if (!adminClient) {
    return {
      status: "error",
      message: "Le client admin Supabase n'est pas disponible. Verifie SUPABASE_SERVICE_ROLE_KEY."
    };
  }

  const file = getUploadFile(formData, "cv_file");

  if (!file) {
    return {
      status: "error",
      message: "Selectionnez un CV avant de lancer l'envoi."
    };
  }

  const validationError = validateCandidateDocumentFile(file);

  if (validationError) {
    return {
      status: "error",
      message: validationError
    };
  }

  const extension = file.name.includes(".")
    ? file.name.split(".").pop()?.toLowerCase() ?? "pdf"
    : "pdf";
  const safeName = sanitizeFileName(file.name || `cv.${extension}`);
  const storagePath = `${profile.id}/${Date.now()}-${safeName}`;

  const { error: uploadError } = await adminClient.storage
    .from("candidate-cv")
    .upload(storagePath, file, {
      cacheControl: "3600",
      contentType: file.type || undefined,
      upsert: false
    });

  if (uploadError) {
    return {
      status: "error",
      message: uploadError.message
    };
  }

  const { error: resetError } = await adminClient
    .from("candidate_documents")
    .update({ is_primary: false })
    .eq("candidate_id", profile.id)
    .eq("is_primary", true);

  if (resetError) {
    await cleanupUploadedFile("candidate-cv", storagePath);

    return {
      status: "error",
      message: resetError.message
    };
  }

  const { data: insertedDocument, error: insertError } = await adminClient
    .from("candidate_documents")
    .insert({
      candidate_id: profile.id,
      document_type: "cv",
      bucket_id: "candidate-cv",
      storage_path: storagePath,
      file_name: file.name,
      mime_type: file.type || null,
      file_size: file.size,
      is_primary: true
    })
    .select("id, document_type, bucket_id, storage_path, file_name, mime_type, file_size, is_primary, created_at")
    .single();

  if (insertError) {
    await cleanupUploadedFile("candidate-cv", storagePath);

    return {
      status: "error",
      message: insertError.message
    };
  }

  if (insertedDocument) {
    await syncCandidateProfileTextFromUploadedFile(profile, file, {
      id: String(insertedDocument.id),
      document_type: String(insertedDocument.document_type ?? "cv"),
      bucket_id: String(insertedDocument.bucket_id ?? "candidate-cv"),
      storage_path: String(insertedDocument.storage_path ?? storagePath),
      file_name: String(insertedDocument.file_name ?? file.name),
      mime_type:
        typeof insertedDocument.mime_type === "string" ? insertedDocument.mime_type : null,
      file_size:
        typeof insertedDocument.file_size === "number" ? insertedDocument.file_size : file.size,
      is_primary: Boolean(insertedDocument.is_primary),
      created_at: String(insertedDocument.created_at ?? new Date().toISOString())
    });
  }

  revalidatePath("/app/candidat");
  revalidatePath("/app/candidat/documents");

  return {
    status: "success",
    message: "CV principal televerse. Il sera rattache automatiquement a vos prochaines candidatures."
  };
}

export async function uploadCandidateDocumentAction(
  formData: FormData
): Promise<ProfileActionState> {
  const profile = await requireRole(["candidat"]);
  const adminClient = createAdminClient();

  if (!adminClient) {
    return {
      status: "error",
      message: "Le client admin Supabase n'est pas disponible. Verifie SUPABASE_SERVICE_ROLE_KEY."
    };
  }

  const requestedDocumentType = getTrimmedValue(formData, "document_type") || "portfolio";
  const documentType = allowedSupplementaryDocumentTypes.has(
    requestedDocumentType as (typeof supplementaryDocumentTypeOptions)[number]["value"]
  )
    ? requestedDocumentType
    : "other";
  const file = getUploadFile(formData, "document_file");

  if (!file) {
    return {
      status: "error",
      message: "Selectionnez un document avant de lancer l'envoi."
    };
  }

  const validationError = validateCandidateDocumentFile(file);

  if (validationError) {
    return {
      status: "error",
      message: validationError
    };
  }

  const extension = file.name.includes(".")
    ? file.name.split(".").pop()?.toLowerCase() ?? "pdf"
    : "pdf";
  const safeName = sanitizeFileName(file.name || `document.${extension}`);
  const storagePath = `${profile.id}/${Date.now()}-${safeName}`;

  const { error: uploadError } = await adminClient.storage
    .from("candidate-documents")
    .upload(storagePath, file, {
      cacheControl: "3600",
      contentType: file.type || undefined,
      upsert: false
    });

  if (uploadError) {
    return {
      status: "error",
      message: uploadError.message
    };
  }

  const { error: insertError } = await adminClient.from("candidate_documents").insert({
    candidate_id: profile.id,
    document_type: documentType,
    bucket_id: "candidate-documents",
    storage_path: storagePath,
    file_name: file.name,
    mime_type: file.type || null,
    file_size: file.size,
    is_primary: false
  });

  if (insertError) {
    await cleanupUploadedFile("candidate-documents", storagePath);

    return {
      status: "error",
      message: insertError.message
    };
  }

  revalidatePath("/app/candidat");
  revalidatePath("/app/candidat/documents");

  return {
    status: "success",
    message: "Document complementaire ajoute a votre espace candidat."
  };
}

export async function updateCandidateProfileAction(
  _previousState: ProfileActionState = defaultState,
  formData: FormData
): Promise<ProfileActionState> {
  const profile = await requireRole(["candidat"]);

  const fullName = getTrimmedValue(formData, "full_name");
  const phone = getTrimmedValue(formData, "phone");
  const headline = getTrimmedValue(formData, "headline");
  const city = getTrimmedValue(formData, "city");
  const country = getTrimmedValue(formData, "country") || "Madagascar";
  const bio = getTrimmedValue(formData, "bio");
  const experienceYears = getNullableNumber(formData, "experience_years");
  const currentPosition = getTrimmedValue(formData, "current_position");
  const desiredPosition = getTrimmedValue(formData, "desired_position");
  const desiredContractType = getTrimmedValue(formData, "desired_contract_type");
  const desiredWorkMode = getTrimmedValue(formData, "desired_work_mode");
  const desiredSalaryMin = getNullableNumber(formData, "desired_salary_min");
  const desiredSalaryCurrency = getTrimmedValue(formData, "desired_salary_currency") || "MGA";
  const jobAlertsEnabled = formData.get("job_alerts_enabled") === "on";
  const skillsText = getTrimmedValue(formData, "skills_text");
  const cvText = getTrimmedValue(formData, "cv_text");

  if (desiredContractType && !allowedContractTypes.has(desiredContractType)) {
    return {
      status: "error",
      message: "Le type de contrat souhaite n'est pas reconnu."
    };
  }

  if (desiredWorkMode && !allowedWorkModes.has(desiredWorkMode)) {
    return {
      status: "error",
      message: "Le mode de travail souhaite n'est pas reconnu."
    };
  }

  if (desiredSalaryMin !== null && desiredSalaryMin < 0) {
    return {
      status: "error",
      message: "La remuneration souhaitee doit etre positive."
    };
  }

  if (!allowedSalaryCurrencies.has(desiredSalaryCurrency)) {
    return {
      status: "error",
      message: "La devise de remuneration souhaitee n'est pas reconnue."
    };
  }

  const supabase = await createClient();
  const { data: primaryCv } = await supabase
    .from("candidate_documents")
    .select("id")
    .eq("candidate_id", profile.id)
    .eq("is_primary", true)
    .limit(1)
    .maybeSingle();

  const profileInsights = getCandidateProfileInsights({
    full_name: fullName,
    phone,
    headline,
    city,
    bio,
    experience_years: experienceYears,
    current_position: currentPosition,
    desired_position: desiredPosition,
    desired_contract_type: desiredContractType,
    desired_work_mode: desiredWorkMode,
    desired_salary_min: desiredSalaryMin,
    skills_text: skillsText,
    cv_text: cvText,
    primary_cv: primaryCv ? { id: String(primaryCv.id ?? "primary-cv") } : null
  });

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      full_name: fullName || null,
      phone: phone || null
    })
    .eq("id", profile.id);

  if (profileError) {
    return {
      status: "error",
      message: profileError.message
    };
  }

  const { error: candidateError } = await supabase
    .from("candidate_profiles")
    .upsert(
      {
        user_id: profile.id,
        headline: headline || null,
        city: city || null,
        country: country || "Madagascar",
        bio: bio || null,
        experience_years: experienceYears,
        current_position: currentPosition || null,
        desired_position: desiredPosition || null,
        desired_contract_type: desiredContractType || null,
        desired_work_mode: desiredWorkMode || null,
        desired_salary_min: desiredSalaryMin,
        desired_salary_currency: desiredSalaryCurrency,
        job_alerts_enabled: jobAlertsEnabled,
        skills_text: skillsText || null,
        cv_text: cvText || null,
        profile_completion: profileInsights.completion
      },
      { onConflict: "user_id" }
    );

  if (candidateError) {
    return {
      status: "error",
      message: candidateError.message
    };
  }

  revalidatePath("/app/candidat");
  revalidatePath("/app/candidat/offres");
  revalidatePath("/app/candidat/alertes");

  return {
    status: "success",
    message:
      profileInsights.missingItems.length > 0
        ? `Profil mis a jour. Taux de completion actuel : ${profileInsights.completion}%. Il reste ${profileInsights.missingItems.length} point(s) prioritaire(s) a completer.`
        : `Profil mis a jour. Taux de completion actuel : ${profileInsights.completion}%. Votre dossier couvre toutes les rubriques prioritaires.`
  };
}

export async function updateCandidateJobAlertsPreferenceAction(
  _previousState: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  const profile = await requireRole(["candidat"]);
  const jobAlertsEnabled = formData.get("job_alerts_enabled") === "on";
  const supabase = await createClient();

  const { error } = await supabase
    .from("candidate_profiles")
    .update({
      job_alerts_enabled: jobAlertsEnabled
    })
    .eq("user_id", profile.id);

  if (error) {
    return {
      status: "error",
      message: error.message
    };
  }

  revalidatePath("/app/candidat");
  revalidatePath("/app/candidat/offres");
  revalidatePath("/app/candidat/alertes");

  return {
    status: "success",
    message: jobAlertsEnabled
      ? "Alertes d'offres activees. Les nouvelles offres compatibles pourront remonter ici."
      : "Alertes d'offres desactivees. Les alertes existantes restent consultables."
  };
}
