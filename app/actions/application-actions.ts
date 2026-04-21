"use server";

import { revalidatePath } from "next/cache";

import { applicationStatusValues } from "@/lib/application-status";
import { requireRole } from "@/lib/auth";
import { getApplicationStatusMeta } from "@/lib/application-status";
import { createNotifications } from "@/lib/notifications";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { enqueueTransactionalEmails } from "@/lib/transactional-emails";

export type ApplicationActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

const defaultState: ApplicationActionState = {
  status: "idle",
  message: ""
};

const allowedStatuses = new Set<string>(applicationStatusValues);
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getTrimmedValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

async function getApplicationMutationClient() {
  return createAdminClient() ?? (await createClient());
}

async function getManageableApplicationForActor(
  actorRole: "admin" | "recruteur",
  organizationId: string | null,
  applicationId: string
) {
  const supabase = await getApplicationMutationClient();
  let query = supabase
    .from("applications")
    .select(
      "id, status, candidate_id, candidate:profiles!applications_candidate_id_fkey(full_name, email), job_posts!inner(organization_id, slug, title)"
    )
    .eq("id", applicationId);

  if (actorRole === "recruteur") {
    query = query.eq("job_posts.organization_id", organizationId);
  }

  const { data, error } = await query.maybeSingle();

  if (error || !data) {
    return null;
  }

  return data;
}

export async function updateApplicationStatusAction(
  _previousState: ApplicationActionState = defaultState,
  formData: FormData
): Promise<ApplicationActionState> {
  const profile = await requireRole(["recruteur", "admin"]);
  const actorRole = profile.role === "admin" ? "admin" : "recruteur";
  const applicationId = getTrimmedValue(formData, "application_id");
  const nextStatus = getTrimmedValue(formData, "status");

  if (!applicationId || !uuidPattern.test(applicationId) || !allowedStatuses.has(nextStatus)) {
    return {
      status: "error",
      message: "Statut ou candidature invalide."
    };
  }

  const existingApplication = await getManageableApplicationForActor(
    actorRole,
    profile.organization_id,
    applicationId
  );

  if (!existingApplication) {
    return {
      status: "error",
      message: "Impossible de retrouver cette candidature."
    };
  }

  const currentStatus = String(existingApplication.status ?? "submitted");
  const rawJobRelation =
    (existingApplication as {
      candidate_id?: string | null;
      job_posts?:
        | { slug?: string | null; title?: string | null }
        | Array<{ slug?: string | null; title?: string | null }>
        | null;
    })
      .job_posts ?? null;
  const currentJob =
    Array.isArray(rawJobRelation) ? rawJobRelation[0] ?? null : rawJobRelation;
  const jobSlug =
    currentJob && typeof currentJob.slug === "string" ? currentJob.slug : null;
  const jobTitle =
    currentJob && typeof currentJob.title === "string" ? currentJob.title : "votre offre";
  const candidateId =
    typeof (existingApplication as { candidate_id?: string | null }).candidate_id === "string"
      ? String((existingApplication as { candidate_id?: string | null }).candidate_id)
      : null;
  const rawCandidateRelation =
    (existingApplication as {
      candidate?: { full_name?: string | null; email?: string | null } | null;
    }).candidate ?? null;
  const candidateName =
    rawCandidateRelation && typeof rawCandidateRelation.full_name === "string"
      ? rawCandidateRelation.full_name
      : null;
  const candidateEmail =
    rawCandidateRelation && typeof rawCandidateRelation.email === "string"
      ? rawCandidateRelation.email
      : null;

  if (currentStatus === nextStatus) {
    return {
      status: "success",
      message: "Le statut est deja a jour."
    };
  }

  const supabase = await getApplicationMutationClient();
  const { error: updateError } = await supabase
    .from("applications")
    .update({ status: nextStatus })
    .eq("id", applicationId);

  if (updateError) {
    return {
      status: "error",
      message: updateError.message
    };
  }

  const { error: historyError } = await supabase.from("application_status_history").insert({
    application_id: applicationId,
    from_status: currentStatus,
    to_status: nextStatus,
    changed_by: profile.id
  });

  if (historyError) {
    return {
      status: "error",
      message: historyError.message
    };
  }

  const statusMeta = getApplicationStatusMeta(nextStatus);

  if (candidateId) {
    await createNotifications([
      {
        user_id: candidateId,
        kind: "application_status_updated",
        title: `Mise a jour de votre candidature`,
        body: `Votre candidature pour ${jobTitle} est maintenant au statut ${statusMeta.label}.`,
        link_href: `/app/candidat/candidatures/${applicationId}`,
        metadata: {
          application_id: applicationId,
          status: nextStatus
        }
      }
    ]);
  }

  if (candidateEmail) {
    await enqueueTransactionalEmails([
      {
        recipient_email: candidateEmail,
        recipient_name: candidateName,
        recipient_user_id: candidateId,
        template_key: "candidate_application_status_update",
        subject: `Mise a jour de votre candidature pour ${jobTitle}`,
        preview_text: `Votre candidature est maintenant au statut ${statusMeta.label}. Consultez votre espace candidat pour voir le suivi detaille et les prochaines etapes.`,
        link_href: `/app/candidat/candidatures/${applicationId}`,
        metadata: {
          application_id: applicationId,
          status: nextStatus,
          job_title: jobTitle
        }
      }
    ]);
  }

  revalidatePath("/app/recruteur");
  revalidatePath("/app/admin");
  revalidatePath("/app/recruteur/candidatures");
  revalidatePath("/app/admin/candidatures");
  revalidatePath(`/app/recruteur/candidatures/${applicationId}`);
  revalidatePath(`/app/admin/candidatures/${applicationId}`);
  revalidatePath("/app/candidat");
  revalidatePath("/app/candidat/candidatures");
  revalidatePath(`/app/candidat/candidatures/${applicationId}`);
  revalidatePath("/app/candidat/notifications");
  if (jobSlug) {
    revalidatePath(`/app/candidat/offres/${jobSlug}`);
  }

  return {
    status: "success",
    message: "Statut mis a jour avec succes."
  };
}

export async function addInternalNoteAction(
  _previousState: ApplicationActionState = defaultState,
  formData: FormData
): Promise<ApplicationActionState> {
  const profile = await requireRole(["recruteur", "admin"]);
  const actorRole = profile.role === "admin" ? "admin" : "recruteur";
  const applicationId = getTrimmedValue(formData, "application_id");
  const body = getTrimmedValue(formData, "body");

  if (!applicationId || !uuidPattern.test(applicationId) || !body) {
    return {
      status: "error",
      message: "La note interne ne peut pas etre vide."
    };
  }

  const manageableApplication = await getManageableApplicationForActor(
    actorRole,
    profile.organization_id,
    applicationId
  );

  if (!manageableApplication) {
    return {
      status: "error",
      message: "Impossible de retrouver cette candidature."
    };
  }

  const supabase = await getApplicationMutationClient();
  const { error } = await supabase.from("internal_notes").insert({
    application_id: applicationId,
    author_id: profile.id,
    body
  });

  if (error) {
    return {
      status: "error",
      message: error.message
    };
  }

  revalidatePath("/app/recruteur");
  revalidatePath("/app/admin");
  revalidatePath("/app/recruteur/candidatures");
  revalidatePath("/app/admin/candidatures");
  revalidatePath(`/app/recruteur/candidatures/${applicationId}`);
  revalidatePath(`/app/admin/candidatures/${applicationId}`);

  return {
    status: "success",
    message: "Note interne ajoutee."
  };
}
