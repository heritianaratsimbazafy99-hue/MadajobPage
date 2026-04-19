"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth";
import { getPublishedJobById } from "@/lib/jobs";
import { createClient } from "@/lib/supabase/server";

export type JobActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

const defaultState: JobActionState = {
  status: "idle",
  message: ""
};

function getTrimmedValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

async function generateUniqueSlug(title: string) {
  const supabase = await createClient();
  const base = slugify(title) || `offre-${Date.now()}`;

  for (let attempt = 0; attempt < 50; attempt += 1) {
    const suffix = attempt === 0 ? "" : `-${attempt + 1}`;
    const candidate = `${base}${suffix}`;
    const { data } = await supabase
      .from("job_posts")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();

    if (!data) {
      return candidate;
    }
  }

  return `${base}-${Date.now()}`;
}

export async function createJobAction(
  _previousState: JobActionState = defaultState,
  formData: FormData
): Promise<JobActionState> {
  const profile = await requireRole(["recruteur", "admin"]);

  if (!profile.organization_id) {
    return {
      status: "error",
      message: "Aucune organisation n'est rattachee a ce compte. Verifie le profil Supabase avant de creer une offre."
    };
  }

  const title = getTrimmedValue(formData, "title");
  const summary = getTrimmedValue(formData, "summary");
  const location = getTrimmedValue(formData, "location");
  const contractType = getTrimmedValue(formData, "contract_type");
  const workMode = getTrimmedValue(formData, "work_mode");
  const sector = getTrimmedValue(formData, "sector");
  const responsibilities = getTrimmedValue(formData, "responsibilities");
  const requirements = getTrimmedValue(formData, "requirements");
  const benefits = getTrimmedValue(formData, "benefits");
  const status = getTrimmedValue(formData, "status") || "draft";
  const isFeatured = formData.get("is_featured") === "on";

  if (!title || !summary) {
    return {
      status: "error",
      message: "Le titre et le resume sont obligatoires pour creer une offre."
    };
  }

  const slug = await generateUniqueSlug(title);
  const publishedAt = status === "published" ? new Date().toISOString() : null;
  const supabase = await createClient();

  const { error } = await supabase.from("job_posts").insert({
    organization_id: profile.organization_id,
    created_by: profile.id,
    title,
    slug,
    location,
    contract_type: contractType,
    work_mode: workMode,
    sector,
    summary,
    responsibilities,
    requirements,
    benefits,
    status,
    is_featured: isFeatured,
    published_at: publishedAt
  });

  if (error) {
    return {
      status: "error",
      message: error.message
    };
  }

  revalidatePath("/app/recruteur");
  revalidatePath("/app/admin");
  revalidatePath("/carrieres");

  return {
    status: "success",
    message:
      status === "published"
        ? "Offre publiee. Elle apparaitra desormais dans le site carriere."
        : "Offre enregistree en brouillon dans la plateforme."
  };
}

export async function applyToJobAction(
  _previousState: JobActionState = defaultState,
  formData: FormData
): Promise<JobActionState> {
  const profile = await requireRole(["candidat"]);

  const jobId = getTrimmedValue(formData, "job_post_id");
  const jobSlug = getTrimmedValue(formData, "job_slug");
  const coverLetter = getTrimmedValue(formData, "cover_letter");

  if (!jobId) {
    return {
      status: "error",
      message: "Impossible d'identifier cette offre pour l'instant."
    };
  }

  const job = await getPublishedJobById(jobId);

  if (!job) {
    return {
      status: "error",
      message: "Cette offre n'est plus disponible ou n'est pas encore publiee."
    };
  }

  const supabase = await createClient();
  const { data: existingApplication } = await supabase
    .from("applications")
    .select("id")
    .eq("job_post_id", jobId)
    .eq("candidate_id", profile.id)
    .maybeSingle();

  if (existingApplication) {
    return {
      status: "error",
      message: "Vous avez deja postule a cette offre."
    };
  }

  const { error } = await supabase.from("applications").insert({
    job_post_id: jobId,
    candidate_id: profile.id,
    cover_letter: coverLetter || null
  });

  if (error) {
    return {
      status: "error",
      message: error.message
    };
  }

  revalidatePath("/app/candidat");
  revalidatePath("/carrieres");
  if (jobSlug) {
    revalidatePath(`/carrieres/${jobSlug}`);
  }

  return {
    status: "success",
    message: "Votre candidature a bien ete envoyee depuis la plateforme Madajob."
  };
}
