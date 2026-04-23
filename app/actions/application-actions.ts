"use server";

import { revalidatePath } from "next/cache";

import { applicationStatusValues } from "@/lib/application-status";
import { requireRole } from "@/lib/auth";
import { getApplicationStatusMeta } from "@/lib/application-status";
import {
  getInterviewNextActionLabel,
  getInterviewProposedDecisionMeta,
  getInterviewRecommendationMeta,
  getSuggestedApplicationStatusFromInterviewDecision,
  interviewFormatOptions,
  interviewNextActionOptions,
  interviewProposedDecisionOptions,
  interviewRecommendationOptions,
  interviewStatusOptions
} from "@/lib/interviews";
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
const allowedInterviewStatuses = new Set<string>(interviewStatusOptions.map((option) => option.value));
const allowedInterviewFormats = new Set<string>(interviewFormatOptions.map((option) => option.value));
const allowedInterviewRecommendations = new Set<string>(
  interviewRecommendationOptions.map((option) => option.value)
);
const allowedInterviewProposedDecisions = new Set<string>(
  interviewProposedDecisionOptions.map((option) => option.value)
);
const allowedInterviewNextActions = new Set<string>(
  interviewNextActionOptions.map((option) => option.value)
);
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getTrimmedValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function parseOptionalDateTime(value: string) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

async function getApplicationMutationClient() {
  return createAdminClient() ?? (await createClient());
}

function revalidateApplicationSurfaces(applicationId: string, jobSlug: string | null) {
  revalidatePath("/app/recruteur");
  revalidatePath("/app/admin");
  revalidatePath("/app/admin/emails");
  revalidatePath("/app/recruteur/candidatures");
  revalidatePath("/app/admin/candidatures");
  revalidatePath("/app/recruteur/entretiens");
  revalidatePath("/app/admin/entretiens");
  revalidatePath("/app/recruteur/shortlist");
  revalidatePath("/app/admin/shortlist");
  revalidatePath(`/app/recruteur/candidatures/${applicationId}`);
  revalidatePath(`/app/admin/candidatures/${applicationId}`);
  revalidatePath("/app/candidat");
  revalidatePath("/app/candidat/candidatures");
  revalidatePath(`/app/candidat/candidatures/${applicationId}`);
  revalidatePath("/app/candidat/notifications");

  if (jobSlug) {
    revalidatePath(`/app/candidat/offres/${jobSlug}`);
  }
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

async function getManageableInterviewForActor(
  actorRole: "admin" | "recruteur",
  organizationId: string | null,
  interviewId: string
) {
  const supabase = await getApplicationMutationClient();
  let query = supabase
    .from("application_interviews")
    .select(
      "id, application_id, status, starts_at, applications!inner(id, candidate_id, status, job_posts!inner(organization_id, slug, title), candidate:profiles!applications_candidate_id_fkey(full_name, email))"
    )
    .eq("id", interviewId);

  if (actorRole === "recruteur") {
    query = query.eq("applications.job_posts.organization_id", organizationId);
  }

  const { data, error } = await query.maybeSingle();

  if (error || !data) {
    return null;
  }

  return data;
}

function extractInterviewContext(interviewRecord: Record<string, unknown>) {
  const rawApplicationRelation =
    (interviewRecord as {
      applications?:
        | {
            id?: string | null;
            candidate_id?: string | null;
            status?: string | null;
            candidate?: { full_name?: string | null; email?: string | null } | null;
            job_posts?:
              | { slug?: string | null; title?: string | null }
              | Array<{ slug?: string | null; title?: string | null }>
              | null;
          }
        | Array<{
            id?: string | null;
            candidate_id?: string | null;
            status?: string | null;
            candidate?: { full_name?: string | null; email?: string | null } | null;
            job_posts?:
              | { slug?: string | null; title?: string | null }
              | Array<{ slug?: string | null; title?: string | null }>
              | null;
          }>
        | null;
    }).applications ?? null;
  const application = Array.isArray(rawApplicationRelation)
    ? rawApplicationRelation[0] ?? null
    : rawApplicationRelation;
  const rawJobRelation = application?.job_posts ?? null;
  const currentJob = Array.isArray(rawJobRelation) ? rawJobRelation[0] ?? null : rawJobRelation;

  return {
    applicationId: typeof application?.id === "string" ? application.id : null,
    candidateId: typeof application?.candidate_id === "string" ? application.candidate_id : null,
    candidateName:
      application?.candidate && typeof application.candidate.full_name === "string"
        ? application.candidate.full_name
        : null,
    candidateEmail:
      application?.candidate && typeof application.candidate.email === "string"
        ? application.candidate.email
        : null,
    jobSlug: currentJob && typeof currentJob.slug === "string" ? currentJob.slug : null,
    jobTitle:
      currentJob && typeof currentJob.title === "string" ? currentJob.title : "votre offre"
  };
}

async function updateApplicationStatusInternal(
  profile: Awaited<ReturnType<typeof requireRole>>,
  applicationId: string,
  nextStatus: string,
  options?: {
    note?: string | null;
  }
): Promise<ApplicationActionState> {
  const actorRole = profile.role === "admin" ? "admin" : "recruteur";

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
    changed_by: profile.id,
    note: options?.note?.trim() ? options.note.trim() : null
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

  revalidateApplicationSurfaces(applicationId, jobSlug);

  return {
    status: "success",
    message: "Statut mis a jour avec succes."
  };
}

export async function updateApplicationStatusAction(
  _previousState: ApplicationActionState = defaultState,
  formData: FormData
): Promise<ApplicationActionState> {
  const profile = await requireRole(["recruteur", "admin"]);
  const applicationId = getTrimmedValue(formData, "application_id");
  const nextStatus = getTrimmedValue(formData, "status");

  return updateApplicationStatusInternal(profile, applicationId, nextStatus);
}

export async function moveApplicationStatusAction(
  applicationId: string,
  nextStatus: string
): Promise<ApplicationActionState> {
  const profile = await requireRole(["recruteur", "admin"]);

  return updateApplicationStatusInternal(profile, applicationId, nextStatus);
}

export async function bulkMoveApplicationsStatusAction(
  applicationIds: string[],
  nextStatus: string
): Promise<ApplicationActionState> {
  const profile = await requireRole(["recruteur", "admin"]);
  const uniqueIds = Array.from(
    new Set(
      applicationIds
        .map((applicationId) => applicationId.trim())
        .filter((applicationId) => uuidPattern.test(applicationId))
    )
  );

  if (!uniqueIds.length || !allowedStatuses.has(nextStatus)) {
    return {
      status: "error",
      message: "Selection ou statut invalide."
    };
  }

  let updatedCount = 0;
  let unchangedCount = 0;
  let failedCount = 0;

  for (const applicationId of uniqueIds) {
    const result = await updateApplicationStatusInternal(profile, applicationId, nextStatus);

    if (result.status === "success") {
      if (result.message === "Le statut est deja a jour.") {
        unchangedCount += 1;
      } else {
        updatedCount += 1;
      }
      continue;
    }

    failedCount += 1;
  }

  if (updatedCount === 0 && failedCount > 0) {
    return {
      status: "error",
      message: "Aucun dossier n'a pu etre mis a jour."
    };
  }

  const details = [
    updatedCount > 0 ? `${updatedCount} mis a jour` : "",
    unchangedCount > 0 ? `${unchangedCount} deja a jour` : "",
    failedCount > 0 ? `${failedCount} en echec` : ""
  ]
    .filter(Boolean)
    .join(" · ");

  return {
    status: failedCount > 0 ? "success" : "success",
    message: details
      ? `Traitement termine: ${details}.`
      : "Traitement termine."
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

export async function scheduleInterviewAction(
  _previousState: ApplicationActionState = defaultState,
  formData: FormData
): Promise<ApplicationActionState> {
  const profile = await requireRole(["recruteur", "admin"]);
  const actorRole = profile.role === "admin" ? "admin" : "recruteur";
  const applicationId = getTrimmedValue(formData, "application_id");
  const startsAtInput = getTrimmedValue(formData, "starts_at");
  const endsAtInput = getTrimmedValue(formData, "ends_at");
  const interviewFormat = getTrimmedValue(formData, "format");
  const interviewerName = getTrimmedValue(formData, "interviewer_name");
  const interviewerEmail = getTrimmedValue(formData, "interviewer_email");
  const location = getTrimmedValue(formData, "location");
  const meetingUrl = getTrimmedValue(formData, "meeting_url");
  const notes = getTrimmedValue(formData, "notes");
  const timezone = getTrimmedValue(formData, "timezone") || "Indian/Antananarivo";

  const startsAt = parseOptionalDateTime(startsAtInput);
  const endsAt = parseOptionalDateTime(endsAtInput);

  if (!applicationId || !uuidPattern.test(applicationId)) {
    return {
      status: "error",
      message: "Candidature invalide."
    };
  }

  if (!startsAt || !allowedInterviewFormats.has(interviewFormat) || !interviewerName) {
    return {
      status: "error",
      message: "Les informations de planning sont incompletes."
    };
  }

  if (endsAt && new Date(endsAt).getTime() <= new Date(startsAt).getTime()) {
    return {
      status: "error",
      message: "L'heure de fin doit etre apres l'heure de debut."
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

  const rawJobRelation =
    (manageableApplication as {
      candidate_id?: string | null;
      job_posts?:
        | { slug?: string | null; title?: string | null }
        | Array<{ slug?: string | null; title?: string | null }>
        | null;
      candidate?: { full_name?: string | null; email?: string | null } | null;
    }).job_posts ?? null;
  const currentJob = Array.isArray(rawJobRelation) ? rawJobRelation[0] ?? null : rawJobRelation;
  const jobSlug = currentJob && typeof currentJob.slug === "string" ? currentJob.slug : null;
  const jobTitle =
    currentJob && typeof currentJob.title === "string" ? currentJob.title : "votre offre";
  const candidateId =
    typeof (manageableApplication as { candidate_id?: string | null }).candidate_id === "string"
      ? String((manageableApplication as { candidate_id?: string | null }).candidate_id)
      : null;
  const rawCandidateRelation =
    (manageableApplication as {
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
  const currentStatus = String((manageableApplication as { status?: string | null }).status ?? "submitted");

  const supabase = await getApplicationMutationClient();
  const { error: interviewError } = await supabase.from("application_interviews").insert({
    application_id: applicationId,
    scheduled_by: profile.id,
    status: "scheduled",
    format: interviewFormat,
    starts_at: startsAt,
    ends_at: endsAt,
    timezone,
    location: location || null,
    meeting_url: meetingUrl || null,
    notes: notes || null,
    interviewer_name: interviewerName,
    interviewer_email: interviewerEmail || null
  });

  if (interviewError) {
    return {
      status: "error",
      message: interviewError.message
    };
  }

  if (!["interview", "hired", "rejected"].includes(currentStatus)) {
    await supabase.from("applications").update({ status: "interview" }).eq("id", applicationId);
    await supabase.from("application_status_history").insert({
      application_id: applicationId,
      from_status: currentStatus,
      to_status: "interview",
      changed_by: profile.id,
      note: "Entretien planifie depuis la plateforme."
    });
  }

  const interviewLabel = new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(startsAt));

  if (candidateId) {
    await createNotifications([
      {
        user_id: candidateId,
        kind: "application_interview_scheduled",
        title: "Entretien planifie",
        body: `Un entretien pour ${jobTitle} est planifie le ${interviewLabel}.`,
        link_href: `/app/candidat/candidatures/${applicationId}`,
        metadata: {
          application_id: applicationId,
          interview_starts_at: startsAt,
          interview_format: interviewFormat
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
        template_key: "candidate_interview_scheduled",
        subject: `Entretien planifie pour ${jobTitle}`,
        preview_text: `Votre entretien est planifie le ${interviewLabel}. Consultez votre espace candidat pour retrouver les informations utiles et la suite du processus.`,
        link_href: `/app/candidat/candidatures/${applicationId}`,
        metadata: {
          application_id: applicationId,
          interview_starts_at: startsAt,
          interview_format: interviewFormat,
          job_title: jobTitle
        }
      }
    ]);
  }

  revalidateApplicationSurfaces(applicationId, jobSlug);

  return {
    status: "success",
    message: "Entretien planifie."
  };
}

export async function updateInterviewStatusAction(
  _previousState: ApplicationActionState = defaultState,
  formData: FormData
): Promise<ApplicationActionState> {
  const profile = await requireRole(["recruteur", "admin"]);
  const actorRole = profile.role === "admin" ? "admin" : "recruteur";
  const interviewId = getTrimmedValue(formData, "interview_id");
  const nextStatus = getTrimmedValue(formData, "status");

  if (!interviewId || !uuidPattern.test(interviewId) || !allowedInterviewStatuses.has(nextStatus)) {
    return {
      status: "error",
      message: "Mise a jour entretien invalide."
    };
  }

  const manageableInterview = await getManageableInterviewForActor(
    actorRole,
    profile.organization_id,
    interviewId
  );

  if (!manageableInterview) {
    return {
      status: "error",
      message: "Impossible de retrouver cet entretien."
    };
  }

  const currentStatus = String(manageableInterview.status ?? "scheduled");

  if (currentStatus === nextStatus) {
    return {
      status: "success",
      message: "Le statut de l'entretien est deja a jour."
    };
  }

  const interviewContext = extractInterviewContext(manageableInterview as Record<string, unknown>);
  const {
    applicationId,
    candidateEmail,
    candidateId,
    candidateName,
    jobSlug,
    jobTitle
  } = interviewContext;

  const supabase = await getApplicationMutationClient();
  const { error } = await supabase
    .from("application_interviews")
    .update({ status: nextStatus })
    .eq("id", interviewId);

  if (error) {
    return {
      status: "error",
      message: error.message
    };
  }

  if (nextStatus === "cancelled" && candidateId && applicationId) {
    await createNotifications([
      {
        user_id: candidateId,
        kind: "application_interview_cancelled",
        title: "Entretien annule",
        body: `L'entretien planifie pour ${jobTitle} a ete annule. Consultez votre espace candidat pour suivre la suite du dossier.`,
        link_href: `/app/candidat/candidatures/${applicationId}`,
        metadata: {
          application_id: applicationId,
          interview_id: interviewId
        }
      }
    ]);

    if (candidateEmail) {
      await enqueueTransactionalEmails([
        {
          recipient_email: candidateEmail,
          recipient_name: candidateName,
          recipient_user_id: candidateId,
          template_key: "candidate_interview_cancelled",
          subject: `Entretien annule pour ${jobTitle}`,
          preview_text: `L'entretien planifie pour ${jobTitle} a ete annule. Consultez votre espace candidat pour suivre la suite du dossier.`,
          link_href: `/app/candidat/candidatures/${applicationId}`,
          metadata: {
            application_id: applicationId,
            interview_id: interviewId,
            job_title: jobTitle
          }
        }
      ]);
    }
  }

  if (applicationId) {
    revalidateApplicationSurfaces(applicationId, jobSlug);
  } else {
    revalidatePath("/app/recruteur/entretiens");
    revalidatePath("/app/admin/entretiens");
  }

  return {
    status: "success",
    message:
      nextStatus === "completed"
        ? "Entretien marque comme termine."
        : nextStatus === "cancelled"
          ? "Entretien annule."
          : "Entretien mis a jour."
  };
}

export async function saveInterviewFeedbackAction(
  _previousState: ApplicationActionState = defaultState,
  formData: FormData
): Promise<ApplicationActionState> {
  const profile = await requireRole(["recruteur", "admin"]);
  const actorRole = profile.role === "admin" ? "admin" : "recruteur";
  const interviewId = getTrimmedValue(formData, "interview_id");
  const summary = getTrimmedValue(formData, "summary");
  const strengths = getTrimmedValue(formData, "strengths");
  const concerns = getTrimmedValue(formData, "concerns");
  const recommendation = getTrimmedValue(formData, "recommendation");
  const proposedDecision = getTrimmedValue(formData, "proposed_decision");
  const nextAction = getTrimmedValue(formData, "next_action");
  const markCompleted = getTrimmedValue(formData, "mark_completed") === "true";

  if (
    !interviewId ||
    !uuidPattern.test(interviewId) ||
    !summary ||
    !strengths ||
    !concerns ||
    !allowedInterviewRecommendations.has(recommendation) ||
    !allowedInterviewProposedDecisions.has(proposedDecision) ||
    !allowedInterviewNextActions.has(nextAction)
  ) {
    return {
      status: "error",
      message: "Le compte-rendu d'entretien est incomplet."
    };
  }

  const manageableInterview = await getManageableInterviewForActor(
    actorRole,
    profile.organization_id,
    interviewId
  );

  if (!manageableInterview) {
    return {
      status: "error",
      message: "Impossible de retrouver cet entretien."
    };
  }

  const currentStatus = String(manageableInterview.status ?? "scheduled");

  if (currentStatus === "cancelled") {
    return {
      status: "error",
      message: "Impossible de journaliser un compte-rendu sur un entretien annule."
    };
  }

  const interviewContext = extractInterviewContext(manageableInterview as Record<string, unknown>);
  const { applicationId, jobSlug } = interviewContext;
  const interviewStartsAt =
    typeof (manageableInterview as { starts_at?: string | null }).starts_at === "string"
      ? String((manageableInterview as { starts_at?: string | null }).starts_at)
      : null;

  if (!applicationId || !uuidPattern.test(applicationId)) {
    return {
      status: "error",
      message: "Le dossier rattache a cet entretien est introuvable."
    };
  }

  const supabase = await getApplicationMutationClient();
  const { error: feedbackError } = await supabase
    .from("application_interview_feedback")
    .upsert(
      {
        interview_id: interviewId,
        application_id: applicationId,
        author_id: profile.id,
        summary,
        strengths,
        concerns,
        recommendation,
        proposed_decision: proposedDecision,
        next_action: nextAction
      },
      { onConflict: "interview_id" }
    );

  if (feedbackError) {
    return {
      status: "error",
      message: feedbackError.message
    };
  }

  if (markCompleted && currentStatus === "scheduled") {
    const { error: interviewUpdateError } = await supabase
      .from("application_interviews")
      .update({ status: "completed" })
      .eq("id", interviewId);

    if (interviewUpdateError) {
      return {
        status: "error",
        message: interviewUpdateError.message
      };
    }
  }

  const recommendationLabel = getInterviewRecommendationMeta(recommendation).label;
  const decisionLabel = getInterviewProposedDecisionMeta(proposedDecision).label;
  const nextActionLabel = getInterviewNextActionLabel(nextAction);
  const interviewLabel = interviewStartsAt
    ? new Intl.DateTimeFormat("fr-FR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      }).format(new Date(interviewStartsAt))
    : "cet entretien";

  const { error: noteError } = await supabase.from("internal_notes").insert({
    application_id: applicationId,
    author_id: profile.id,
    body: [
      `Feedback entretien du ${interviewLabel}.`,
      `Recommandation : ${recommendationLabel}.`,
      `Decision proposee : ${decisionLabel}.`,
      `Prochaine action : ${nextActionLabel}.`,
      `Synthese : ${summary}`
    ].join("\n")
  });

  revalidateApplicationSurfaces(applicationId, jobSlug);

  return {
    status: "success",
    message: noteError
      ? markCompleted && currentStatus === "scheduled"
        ? "Compte-rendu enregistre et entretien marque comme termine. La note interne automatique n'a pas pu etre journalisee."
        : "Compte-rendu enregistre. La note interne automatique n'a pas pu etre journalisee."
      : markCompleted && currentStatus === "scheduled"
        ? "Compte-rendu enregistre et entretien marque comme termine."
        : "Compte-rendu enregistre."
  };
}

export async function applyInterviewDecisionAction(
  _previousState: ApplicationActionState = defaultState,
  formData: FormData
): Promise<ApplicationActionState> {
  const profile = await requireRole(["recruteur", "admin"]);
  const actorRole = profile.role === "admin" ? "admin" : "recruteur";
  const applicationId = getTrimmedValue(formData, "application_id");
  const interviewId = getTrimmedValue(formData, "interview_id");
  const requestedStatus = getTrimmedValue(formData, "status");
  const decisionNote = getTrimmedValue(formData, "decision_note");

  if (
    !applicationId ||
    !uuidPattern.test(applicationId) ||
    !interviewId ||
    !uuidPattern.test(interviewId)
  ) {
    return {
      status: "error",
      message: "Impossible de retrouver le contexte de decision."
    };
  }

  const manageableInterview = await getManageableInterviewForActor(
    actorRole,
    profile.organization_id,
    interviewId
  );

  if (!manageableInterview) {
    return {
      status: "error",
      message: "Impossible de retrouver cet entretien."
    };
  }

  const interviewContext = extractInterviewContext(manageableInterview as Record<string, unknown>);

  if (!interviewContext.applicationId || interviewContext.applicationId !== applicationId) {
    return {
      status: "error",
      message: "Le dossier rattache a cet entretien est incoherent."
    };
  }

  const interviewStartsAt =
    typeof (manageableInterview as { starts_at?: string | null }).starts_at === "string"
      ? String((manageableInterview as { starts_at?: string | null }).starts_at)
      : null;
  const interviewLabel = interviewStartsAt
    ? new Intl.DateTimeFormat("fr-FR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      }).format(new Date(interviewStartsAt))
    : "cet entretien";

  const supabase = await getApplicationMutationClient();
  const { data: feedbackRow, error: feedbackError } = await supabase
    .from("application_interview_feedback")
    .select("summary, recommendation, proposed_decision, next_action")
    .eq("interview_id", interviewId)
    .maybeSingle();

  if (feedbackError || !feedbackRow) {
    return {
      status: "error",
      message: "Aucun compte-rendu d'entretien exploitable n'a ete trouve."
    };
  }

  const suggestedStatus = getSuggestedApplicationStatusFromInterviewDecision(
    String(feedbackRow.proposed_decision ?? ""),
    typeof feedbackRow.next_action === "string" ? feedbackRow.next_action : null
  );
  const nextStatus =
    requestedStatus && allowedStatuses.has(requestedStatus) ? requestedStatus : suggestedStatus;
  const recommendationLabel = getInterviewRecommendationMeta(
    String(feedbackRow.recommendation ?? "")
  ).label;
  const proposedDecisionLabel = getInterviewProposedDecisionMeta(
    String(feedbackRow.proposed_decision ?? "")
  ).label;
  const nextActionLabel = getInterviewNextActionLabel(String(feedbackRow.next_action ?? ""));
  const nextStatusLabel = getApplicationStatusMeta(nextStatus).label;

  const historyNote = [
    `Decision post-entretien appliquee depuis le feedback du ${interviewLabel}.`,
    `Recommandation : ${recommendationLabel}.`,
    `Decision proposee : ${proposedDecisionLabel}.`,
    `Prochaine action : ${nextActionLabel}.`,
    decisionNote ? `Commentaire interne : ${decisionNote}` : ""
  ]
    .filter(Boolean)
    .join("\n");

  const internalNoteBody = [
    `Decision post-entretien sur le dossier.`,
    `Entretien source : ${interviewLabel}.`,
    `Statut cible : ${nextStatusLabel}.`,
    `Recommandation : ${recommendationLabel}.`,
    `Decision proposee : ${proposedDecisionLabel}.`,
    `Prochaine action : ${nextActionLabel}.`,
    `Synthese : ${String(feedbackRow.summary ?? "")}`,
    decisionNote ? `Commentaire interne : ${decisionNote}` : ""
  ]
    .filter(Boolean)
    .join("\n");

  const statusResult = await updateApplicationStatusInternal(profile, applicationId, nextStatus, {
    note: historyNote
  });

  if (statusResult.status === "error") {
    return statusResult;
  }

  const { error: noteError } = await supabase.from("internal_notes").insert({
    application_id: applicationId,
    author_id: profile.id,
    body: internalNoteBody
  });

  if (statusResult.message === "Le statut est deja a jour.") {
    revalidateApplicationSurfaces(applicationId, interviewContext.jobSlug);

    return {
      status: "success",
      message: noteError
        ? "Decision post-entretien journalisee. Le statut etait deja a jour, mais la note interne automatique n'a pas pu etre enregistree."
        : "Decision post-entretien journalisee. Le statut etait deja a jour."
    };
  }

  return {
    status: "success",
    message: noteError
      ? "Decision post-entretien appliquee et statut mis a jour. La note interne automatique n'a pas pu etre enregistree."
      : "Decision post-entretien appliquee et statut mis a jour."
  };
}
