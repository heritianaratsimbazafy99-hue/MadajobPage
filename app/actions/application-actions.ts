"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type ApplicationActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

const defaultState: ApplicationActionState = {
  status: "idle",
  message: ""
};

const allowedStatuses = new Set([
  "submitted",
  "screening",
  "interview",
  "shortlist",
  "hired",
  "rejected"
]);

function getTrimmedValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function updateApplicationStatusAction(
  _previousState: ApplicationActionState = defaultState,
  formData: FormData
): Promise<ApplicationActionState> {
  const profile = await requireRole(["recruteur", "admin"]);
  const applicationId = getTrimmedValue(formData, "application_id");
  const nextStatus = getTrimmedValue(formData, "status");

  if (!applicationId || !allowedStatuses.has(nextStatus)) {
    return {
      status: "error",
      message: "Statut ou candidature invalide."
    };
  }

  const supabase = await createClient();

  const { data: existingApplication, error: fetchError } = await supabase
    .from("applications")
    .select("id, status")
    .eq("id", applicationId)
    .single();

  if (fetchError || !existingApplication) {
    return {
      status: "error",
      message: fetchError?.message || "Impossible de retrouver cette candidature."
    };
  }

  const currentStatus = String(existingApplication.status ?? "submitted");

  if (currentStatus === nextStatus) {
    return {
      status: "success",
      message: "Le statut est deja a jour."
    };
  }

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

  revalidatePath("/app/recruteur");
  revalidatePath("/app/admin");
  revalidatePath("/app/candidat");

  return {
    status: "success",
    message: "Statut mis a jour avec succes."
  };
}
