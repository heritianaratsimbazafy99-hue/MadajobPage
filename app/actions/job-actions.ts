"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth";
import { getPublishedJobById } from "@/lib/jobs";
import {
  createNotifications,
  getActiveProfileIdsByRole
} from "@/lib/notifications";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { enqueueTransactionalEmails } from "@/lib/transactional-emails";

export type JobActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

const defaultState: JobActionState = {
  status: "idle",
  message: ""
};

const allowedJobStatuses = new Set(["draft", "published", "closed", "archived"]);
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getTrimmedValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

async function getJobMutationClient() {
  return createAdminClient() ?? (await createClient());
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
  const supabase = await getJobMutationClient();
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

async function getManageableJobForActor(
  _actorId: string,
  role: "recruteur" | "admin",
  organizationId: string | null,
  jobId: string
) {
  const supabase = await getJobMutationClient();
  let query = supabase
    .from("job_posts")
    .select("id, slug, title, status, published_at, closing_at, organization_id")
    .eq("id", jobId);

  if (role === "recruteur") {
    query = query.eq("organization_id", organizationId);
  }

  const { data, error } = await query.maybeSingle();

  if (error || !data) {
    return null;
  }

  return data;
}

async function logJobAuditEvent(
  actorId: string,
  action: string,
  entityId: string,
  metadata: Record<string, unknown>
) {
  const adminClient = createAdminClient();

  if (!adminClient) {
    return;
  }

  await adminClient.from("audit_events").insert({
    actor_id: actorId,
    action,
    entity_type: "job_post",
    entity_id: entityId,
    metadata
  });
}

function revalidateJobViews(jobSlug: string, jobId: string) {
  revalidatePath("/app/recruteur");
  revalidatePath("/app/recruteur/offres");
  revalidatePath(`/app/recruteur/offres/${jobId}`);
  revalidatePath("/app/admin");
  revalidatePath("/app/admin/offres");
  revalidatePath(`/app/admin/offres/${jobId}`);
  revalidatePath("/app/candidat");
  revalidatePath("/app/candidat/offres");
  revalidatePath(`/app/candidat/offres/${jobSlug}`);
  revalidatePath("/carrieres");
  revalidatePath(`/carrieres/${jobSlug}`);
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
  const department = getTrimmedValue(formData, "department");
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
  const supabase = await getJobMutationClient();

  const { error } = await supabase.from("job_posts").insert({
    organization_id: profile.organization_id,
    created_by: profile.id,
    title,
    slug,
    department: department || null,
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

  const { data: createdJob } = await supabase
    .from("job_posts")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  revalidatePath("/app/recruteur");
  revalidatePath("/app/recruteur/offres");
  revalidatePath("/app/admin");
  revalidatePath("/app/admin/offres");
  revalidatePath("/app/candidat");
  revalidatePath("/app/candidat/offres");
  revalidatePath("/carrieres");

  if (createdJob?.id) {
    await logJobAuditEvent(profile.id, "job_created", String(createdJob.id), {
      title,
      status,
      is_featured: isFeatured,
      organization_id: profile.organization_id
    });
    revalidateJobViews(slug, String(createdJob.id));
  }

  return {
    status: "success",
    message:
      status === "published"
        ? "Offre publiee. Elle apparaitra desormais sur le site carriere et dans l'espace candidat."
        : "Offre enregistree en brouillon dans la plateforme."
  };
}

export async function updateJobAction(
  _previousState: JobActionState = defaultState,
  formData: FormData
): Promise<JobActionState> {
  const profile = await requireRole(["recruteur", "admin"]);
  const actorRole = profile.role === "admin" ? "admin" : "recruteur";
  const jobId = getTrimmedValue(formData, "job_id");

  if (!jobId || !uuidPattern.test(jobId)) {
    return {
      status: "error",
      message: "Identifiant d'offre invalide."
    };
  }

  const job = await getManageableJobForActor(
    profile.id,
    actorRole,
    profile.organization_id,
    jobId
  );

  if (!job) {
    return {
      status: "error",
      message: "Vous ne pouvez pas modifier cette offre."
    };
  }

  const title = getTrimmedValue(formData, "title");
  const summary = getTrimmedValue(formData, "summary");
  const department = getTrimmedValue(formData, "department");
  const location = getTrimmedValue(formData, "location");
  const contractType = getTrimmedValue(formData, "contract_type");
  const workMode = getTrimmedValue(formData, "work_mode");
  const sector = getTrimmedValue(formData, "sector");
  const responsibilities = getTrimmedValue(formData, "responsibilities");
  const requirements = getTrimmedValue(formData, "requirements");
  const benefits = getTrimmedValue(formData, "benefits");
  const isFeatured = formData.get("is_featured") === "on";

  if (!title || !summary) {
    return {
      status: "error",
      message: "Le titre et le resume sont obligatoires."
    };
  }

  const supabase = await getJobMutationClient();
  const { error } = await supabase
    .from("job_posts")
    .update({
      title,
      summary,
      department: department || null,
      location: location || null,
      contract_type: contractType || null,
      work_mode: workMode || null,
      sector: sector || null,
      responsibilities: responsibilities || null,
      requirements: requirements || null,
      benefits: benefits || null,
      is_featured: isFeatured
    })
    .eq("id", jobId);

  if (error) {
    return {
      status: "error",
      message: error.message
    };
  }

  await logJobAuditEvent(profile.id, "job_updated", jobId, {
    title,
    is_featured: isFeatured,
    status: job.status
  });

  revalidateJobViews(String(job.slug ?? ""), jobId);

  return {
    status: "success",
    message: "Offre mise a jour."
  };
}

export async function updateJobStatusAction(
  _previousState: JobActionState = defaultState,
  formData: FormData
): Promise<JobActionState> {
  const profile = await requireRole(["recruteur", "admin"]);
  const actorRole = profile.role === "admin" ? "admin" : "recruteur";
  const jobId = getTrimmedValue(formData, "job_id");
  const nextStatus = getTrimmedValue(formData, "status");

  if (!jobId || !uuidPattern.test(jobId) || !allowedJobStatuses.has(nextStatus)) {
    return {
      status: "error",
      message: "Transition d'offre invalide."
    };
  }

  const job = await getManageableJobForActor(
    profile.id,
    actorRole,
    profile.organization_id,
    jobId
  );

  if (!job) {
    return {
      status: "error",
      message: "Vous ne pouvez pas modifier cette offre."
    };
  }

  const currentStatus = String(job.status ?? "draft");

  if (currentStatus === nextStatus) {
    return {
      status: "success",
      message: "Le statut de cette offre est deja a jour."
    };
  }

  const now = new Date().toISOString();
  const patch: Record<string, string | null | boolean> = {
    status: nextStatus
  };

  if (nextStatus === "published") {
    patch.published_at = now;
    patch.closing_at = null;
  } else if (nextStatus === "closed") {
    patch.closing_at = now;
  } else if (nextStatus === "draft") {
    patch.closing_at = null;
  }

  const supabase = await getJobMutationClient();
  const { error } = await supabase
    .from("job_posts")
    .update(patch)
    .eq("id", jobId);

  if (error) {
    return {
      status: "error",
      message: error.message
    };
  }

  await logJobAuditEvent(profile.id, "job_status_changed", jobId, {
    from_status: currentStatus,
    to_status: nextStatus
  });

  revalidateJobViews(String(job.slug ?? ""), jobId);

  return {
    status: "success",
    message:
      nextStatus === "published"
        ? "Offre publiee."
        : nextStatus === "closed"
          ? "Offre fermee."
          : nextStatus === "archived"
            ? "Offre archivee."
            : "Offre repassee en brouillon."
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
  const { data: primaryCv } = await supabase
    .from("candidate_documents")
    .select("id, file_name")
    .eq("candidate_id", profile.id)
    .eq("is_primary", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

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

  const { data: insertedApplication, error } = await supabase
    .from("applications")
    .insert({
      job_post_id: jobId,
      candidate_id: profile.id,
      cv_document_id: primaryCv?.id ?? null,
      cover_letter: coverLetter || null
    })
    .select("id")
    .single();

  if (error) {
    return {
      status: "error",
      message: error.message
    };
  }

  const applicationId = String(insertedApplication?.id ?? "");
  const candidateLabel = profile.full_name || profile.email || "Un candidat";

  if (applicationId) {
    await createNotifications([
      {
        user_id: profile.id,
        kind: "application_submitted",
        title: `Candidature envoyee pour ${job.title}`,
        body: primaryCv?.file_name
          ? `Votre dossier a bien ete envoye avec le CV ${primaryCv.file_name}.`
          : "Votre dossier a bien ete envoye. Pensez a rattacher un CV principal pour vos prochaines candidatures.",
        link_href: `/app/candidat/candidatures/${applicationId}`,
        metadata: {
          application_id: applicationId,
          job_post_id: jobId,
          job_slug: jobSlug
        }
      }
    ]);

    if (profile.email) {
      await enqueueTransactionalEmails([
        {
          recipient_email: profile.email,
          recipient_name: profile.full_name,
          recipient_user_id: profile.id,
          template_key: "candidate_application_confirmation",
          subject: `Candidature recue pour ${job.title}`,
          preview_text: `Votre candidature pour ${job.title} a bien ete enregistree sur Madajob. Vous pouvez suivre son evolution depuis votre espace candidat.`,
          link_href: `/app/candidat/candidatures/${applicationId}`,
          metadata: {
            application_id: applicationId,
            job_post_id: jobId,
            job_slug: jobSlug,
            job_title: job.title
          }
        }
      ]);
    }

    const adminClient = createAdminClient();

    if (adminClient) {
      const { data: jobRow } = await adminClient
        .from("job_posts")
        .select("organization_id")
        .eq("id", jobId)
        .maybeSingle();

      const organizationId =
        typeof jobRow?.organization_id === "string" ? jobRow.organization_id : null;

      if (organizationId) {
        const [recruiterIds, adminIds] = await Promise.all([
          getActiveProfileIdsByRole("recruteur", { organizationId }),
          getActiveProfileIdsByRole("admin")
        ]);

        const recruiterNotifications = recruiterIds.map((userId) => ({
          user_id: userId,
          kind: "new_application_received",
          title: `Nouvelle candidature sur ${job.title}`,
          body: `${candidateLabel} a postule a cette offre depuis l'espace candidat.`,
          link_href: `/app/recruteur/candidatures/${applicationId}`,
          metadata: {
            application_id: applicationId,
            job_post_id: jobId
          }
        }));

        const adminNotifications = adminIds.map((userId) => ({
          user_id: userId,
          kind: "new_application_received",
          title: `Nouvelle candidature sur ${job.title}`,
          body: `${candidateLabel} a postule a cette offre. La plateforme a cree un nouveau dossier candidat.`,
          link_href: `/app/admin/candidatures/${applicationId}`,
          metadata: {
            application_id: applicationId,
            job_post_id: jobId
          }
        }));

        await createNotifications([...recruiterNotifications, ...adminNotifications]);
      }
    }
  }

  revalidatePath("/app/candidat");
  revalidatePath("/app/candidat/candidatures");
  revalidatePath("/app/candidat/notifications");
  revalidatePath("/app/candidat/offres");
  revalidatePath("/app/recruteur");
  revalidatePath("/app/recruteur/notifications");
  revalidatePath("/app/admin");
  revalidatePath("/app/admin/notifications");
  revalidatePath("/carrieres");
  if (jobSlug) {
    revalidatePath(`/carrieres/${jobSlug}`);
    revalidatePath(`/app/candidat/offres/${jobSlug}`);
  }

  return {
    status: "success",
    message: primaryCv?.file_name
      ? `Votre candidature a bien ete envoyee avec votre CV principal (${primaryCv.file_name}).`
      : "Votre candidature a bien ete envoyee. Pensez a televerser votre CV principal pour renforcer vos prochains envois."
  };
}
