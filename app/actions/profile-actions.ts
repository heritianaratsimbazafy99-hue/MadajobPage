"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type ProfileActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

const defaultState: ProfileActionState = {
  status: "idle",
  message: ""
};

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

function computeProfileCompletion(values: Record<string, string | number | null>) {
  const trackedKeys = [
    "full_name",
    "phone",
    "headline",
    "city",
    "bio",
    "current_position",
    "desired_position",
    "skills_text"
  ] as const;

  const completed = trackedKeys.filter((key) => {
    const value = values[key];

    if (typeof value === "number") {
      return value > 0;
    }

    return Boolean(value);
  }).length;

  return Math.round((completed / trackedKeys.length) * 100);
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

  const completion = computeProfileCompletion({
    full_name: fullName,
    phone,
    headline,
    city,
    bio,
    current_position: currentPosition,
    desired_position: desiredPosition,
    skills_text: skillsText
  });

  const supabase = await createClient();

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
    .update({
      headline: headline || null,
      city: city || null,
      country: country || "Madagascar",
      bio: bio || null,
      experience_years: experienceYears,
      current_position: currentPosition || null,
      desired_position: desiredPosition || null,
      skills_text: skillsText || null,
      cv_text: cvText || null,
      profile_completion: completion
    })
    .eq("user_id", profile.id);

  if (candidateError) {
    return {
      status: "error",
      message: candidateError.message
    };
  }

  revalidatePath("/app/candidat");

  return {
    status: "success",
    message: `Profil mis a jour. Taux de completion actuel : ${completion}%.`
  };
}
