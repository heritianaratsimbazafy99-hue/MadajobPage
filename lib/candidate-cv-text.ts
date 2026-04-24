import { getCandidateProfileInsights } from "@/lib/candidate-profile";
import { extractPdfTextFromBuffer, extractPdfTextFromFile } from "@/lib/pdf-text";
import { createAdminClient } from "@/lib/supabase/admin";
import type { CandidateDocumentData, CandidateProfileData, Profile } from "@/lib/types";

const minimumExtractedWords = 24;

function getWordCount(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

function shouldReplaceCvText(currentText: string, extractedText: string) {
  return (
    getWordCount(extractedText) >= minimumExtractedWords &&
    getWordCount(extractedText) > getWordCount(currentText)
  );
}

function getStringArrayRecordValue(record: Record<string, unknown> | null | undefined, key: string) {
  const value = record?.[key];

  return Array.isArray(value)
    ? value.map((item) => String(item).trim()).filter(Boolean)
    : [];
}

async function updateCandidateProfileCvText(
  profile: Profile,
  candidateProfile: CandidateProfileData,
  extractedText: string
) {
  const adminClient = createAdminClient();

  if (!adminClient || !shouldReplaceCvText(candidateProfile.cv_text, extractedText)) {
    return candidateProfile;
  }

  const nextProfile: CandidateProfileData = {
    ...candidateProfile,
    cv_text: extractedText
  };
  const insights = getCandidateProfileInsights(nextProfile);

  await adminClient.from("candidate_profiles").upsert(
    {
      user_id: profile.id,
      cv_text: extractedText,
      profile_completion: insights.completion
    },
    { onConflict: "user_id" }
  );

  return {
    ...nextProfile,
    profile_completion: insights.completion
  };
}

export async function enrichCandidateProfileWithCvText(
  profile: Profile,
  candidateProfile: CandidateProfileData
) {
  if (!candidateProfile.primary_cv || getWordCount(candidateProfile.cv_text) >= minimumExtractedWords) {
    return candidateProfile;
  }

  const adminClient = createAdminClient();

  if (!adminClient) {
    return candidateProfile;
  }

  const { data, error } = await adminClient.storage
    .from(candidateProfile.primary_cv.bucket_id)
    .download(candidateProfile.primary_cv.storage_path);

  if (error || !data) {
    return candidateProfile;
  }

  const extractedText = extractPdfTextFromBuffer(Buffer.from(await data.arrayBuffer()));
  return updateCandidateProfileCvText(profile, candidateProfile, extractedText);
}

export async function syncCandidateProfileTextFromUploadedFile(
  profile: Profile,
  file: File,
  primaryCv: CandidateDocumentData
) {
  const extractedText = await extractPdfTextFromFile(file);
  const adminClient = createAdminClient();

  if (!adminClient) {
    return;
  }

  const [{ data: profileRow }, { data: candidateRow }] = await Promise.all([
    adminClient
      .from("profiles")
      .select("full_name, email, phone")
      .eq("id", profile.id)
      .maybeSingle(),
    adminClient
      .from("candidate_profiles")
      .select(
        "headline, city, country, bio, experience_years, current_position, desired_position, desired_contract_type, desired_work_mode, desired_salary_min, desired_salary_currency, desired_sectors, desired_locations, desired_experience_level, job_alerts_enabled, skills_text, cv_text, profile_completion"
      )
      .eq("user_id", profile.id)
      .maybeSingle()
  ]);

  const candidateProfile: CandidateProfileData = {
    full_name: String(profileRow?.full_name ?? profile.full_name ?? ""),
    email: String(profileRow?.email ?? profile.email ?? ""),
    phone: String(profileRow?.phone ?? profile.phone ?? ""),
    headline: String(candidateRow?.headline ?? ""),
    city: String(candidateRow?.city ?? ""),
    country: String(candidateRow?.country ?? "Madagascar"),
    bio: String(candidateRow?.bio ?? ""),
    experience_years:
      typeof candidateRow?.experience_years === "number"
        ? candidateRow.experience_years
        : null,
    current_position: String(candidateRow?.current_position ?? ""),
    desired_position: String(candidateRow?.desired_position ?? ""),
    desired_contract_type: String(candidateRow?.desired_contract_type ?? ""),
    desired_work_mode: String(candidateRow?.desired_work_mode ?? ""),
    desired_salary_min:
      typeof candidateRow?.desired_salary_min === "number"
        ? candidateRow.desired_salary_min
        : typeof candidateRow?.desired_salary_min === "string"
          ? Number(candidateRow.desired_salary_min)
          : null,
    desired_salary_currency: String(candidateRow?.desired_salary_currency ?? "MGA"),
    desired_sectors: getStringArrayRecordValue(candidateRow, "desired_sectors"),
    desired_locations: getStringArrayRecordValue(candidateRow, "desired_locations"),
    desired_experience_level: String(candidateRow?.desired_experience_level ?? ""),
    job_alerts_enabled: candidateRow?.job_alerts_enabled !== false,
    skills_text: String(candidateRow?.skills_text ?? ""),
    cv_text: String(candidateRow?.cv_text ?? ""),
    profile_completion:
      typeof candidateRow?.profile_completion === "number" ? candidateRow.profile_completion : 0,
    primary_cv: primaryCv,
    recent_documents: []
  };

  await updateCandidateProfileCvText(profile, candidateProfile, extractedText);
}
