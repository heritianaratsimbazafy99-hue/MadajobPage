"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { AppRole } from "@/lib/types";

export type AdminActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

const defaultState: AdminActionState = {
  status: "idle",
  message: ""
};

const allowedRoles = new Set<AppRole>(["candidat", "recruteur", "admin"]);

function getTrimmedValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

async function logProfileAuditEvent(
  actorId: string,
  entityId: string,
  action: string,
  metadata: Record<string, unknown>
) {
  const adminClient = createAdminClient();

  if (!adminClient) {
    return;
  }

  await adminClient.from("audit_events").insert({
    actor_id: actorId,
    action,
    entity_type: "profile",
    entity_id: entityId,
    metadata
  });
}

function revalidateAdminUserViews(userId: string) {
  revalidatePath("/app/admin");
  revalidatePath("/app/admin/utilisateurs");
  revalidatePath(`/app/admin/utilisateurs/${userId}`);
  revalidatePath("/app/admin/candidats");
  revalidatePath(`/app/admin/candidats/${userId}`);
  revalidatePath("/app/recruteur");
  revalidatePath("/app/recruteur/candidats");
  revalidatePath("/app/recruteur/candidatures");
  revalidatePath("/app/candidat");
  revalidatePath("/connexion");
}

export async function updateUserAccessAction(
  _previousState: AdminActionState = defaultState,
  formData: FormData
): Promise<AdminActionState> {
  const profile = await requireRole(["admin"]);
  const userId = getTrimmedValue(formData, "user_id");
  const role = getTrimmedValue(formData, "role") as AppRole;
  const organizationId = getTrimmedValue(formData, "organization_id");
  const fullName = getTrimmedValue(formData, "full_name");
  const phone = getTrimmedValue(formData, "phone");
  const isActive = formData.get("is_active") === "on";

  if (!userId || !allowedRoles.has(role)) {
    return {
      status: "error",
      message: "Utilisateur ou role invalide."
    };
  }

  if (userId === profile.id && (!isActive || role !== "admin")) {
    return {
      status: "error",
      message: "Vous ne pouvez pas desactiver ou retrograder votre propre compte admin."
    };
  }

  if (role === "recruteur" && !organizationId) {
    return {
      status: "error",
      message: "Un recruteur doit etre rattache a une organisation."
    };
  }

  const supabase = await createClient();
  const { data: existingUser, error: fetchError } = await supabase
    .from("profiles")
    .select("id, role, organization_id, is_active, full_name, phone")
    .eq("id", userId)
    .maybeSingle();

  if (fetchError || !existingUser) {
    return {
      status: "error",
      message: fetchError?.message || "Utilisateur introuvable."
    };
  }

  const nextOrganizationId = role === "candidat" ? null : organizationId || null;
  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      role,
      organization_id: nextOrganizationId,
      full_name: fullName || null,
      phone: phone || null,
      is_active: isActive
    })
    .eq("id", userId);

  if (updateError) {
    return {
      status: "error",
      message: updateError.message
    };
  }

  if (role === "candidat") {
    const adminClient = createAdminClient();

    if (adminClient) {
      await adminClient.from("candidate_profiles").upsert(
        {
          user_id: userId
        },
        { onConflict: "user_id" }
      );
    }
  }

  await logProfileAuditEvent(profile.id, userId, "profile_access_updated", {
    previous_role: existingUser.role,
    next_role: role,
    previous_organization_id: existingUser.organization_id,
    next_organization_id: nextOrganizationId,
    previous_is_active: existingUser.is_active,
    next_is_active: isActive
  });

  revalidateAdminUserViews(userId);

  return {
    status: "success",
    message: "Acces utilisateur mis a jour avec succes."
  };
}
