"use server";

import { revalidatePath } from "next/cache";

import { supplementaryDocumentTypeOptions } from "@/lib/candidate-documents";
import { getCandidateProfileInsights } from "@/lib/candidate-profile";
import { requireRole } from "@/lib/auth";
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

  const { error: insertError } = await adminClient.from("candidate_documents").insert({
    candidate_id: profile.id,
    document_type: "cv",
    bucket_id: "candidate-cv",
    storage_path: storagePath,
    file_name: file.name,
    mime_type: file.type || null,
    file_size: file.size,
    is_primary: true
  });

  if (insertError) {
    await cleanupUploadedFile("candidate-cv", storagePath);

    return {
      status: "error",
      message: insertError.message
    };
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
  const skillsText = getTrimmedValue(formData, "skills_text");
  const cvText = getTrimmedValue(formData, "cv_text");

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

  return {
    status: "success",
    message:
      profileInsights.missingItems.length > 0
        ? `Profil mis a jour. Taux de completion actuel : ${profileInsights.completion}%. Il reste ${profileInsights.missingItems.length} point(s) prioritaire(s) a completer.`
        : `Profil mis a jour. Taux de completion actuel : ${profileInsights.completion}%. Votre dossier couvre toutes les rubriques prioritaires.`
  };
}
