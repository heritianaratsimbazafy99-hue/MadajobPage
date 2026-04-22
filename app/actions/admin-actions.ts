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

async function logAdminAuditEvent(
  actorId: string,
  entityType: string,
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
    entity_type: entityType,
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

function revalidateAdminOrganizationViews(organizationId: string) {
  revalidatePath("/app/admin");
  revalidatePath("/app/admin/organisations");
  revalidatePath(`/app/admin/organisations/${organizationId}`);
  revalidatePath("/app/admin/utilisateurs");
  revalidatePath("/app/admin/offres");
  revalidatePath("/app/admin/candidatures");
  revalidatePath("/app/admin/candidats");
  revalidatePath("/app/recruteur");
  revalidatePath("/app/recruteur/offres");
  revalidatePath("/app/recruteur/candidatures");
  revalidatePath("/app/recruteur/candidats");
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

export async function updateOrganizationAction(
  _previousState: AdminActionState = defaultState,
  formData: FormData
): Promise<AdminActionState> {
  const profile = await requireRole(["admin"]);
  const organizationId = getTrimmedValue(formData, "organization_id");
  const name = getTrimmedValue(formData, "name");
  const slug = getTrimmedValue(formData, "slug").toLowerCase();
  const kind = getTrimmedValue(formData, "kind");
  const isActive = formData.get("is_active") === "on";

  if (!organizationId || !name || !slug || !kind) {
    return {
      status: "error",
      message: "Tous les champs organisation sont requis."
    };
  }

  if (!/^[a-z0-9-]{2,80}$/.test(slug)) {
    return {
      status: "error",
      message: "Le slug doit contenir uniquement lettres, chiffres et tirets."
    };
  }

  const supabase = createAdminClient() ?? (await createClient());
  const { data: existingOrganization, error: fetchError } = await supabase
    .from("organizations")
    .select("id, name, slug, kind, is_active")
    .eq("id", organizationId)
    .maybeSingle();

  if (fetchError || !existingOrganization) {
    return {
      status: "error",
      message: fetchError?.message || "Organisation introuvable."
    };
  }

  const { error: updateError } = await supabase
    .from("organizations")
    .update({
      name,
      slug,
      kind,
      is_active: isActive
    })
    .eq("id", organizationId);

  if (updateError) {
    return {
      status: "error",
      message: updateError.message
    };
  }

  await logAdminAuditEvent(profile.id, "organization", organizationId, "organization_updated", {
    previous_name: existingOrganization.name,
    next_name: name,
    previous_slug: existingOrganization.slug,
    next_slug: slug,
    previous_kind: existingOrganization.kind,
    next_kind: kind,
    previous_is_active: existingOrganization.is_active,
    next_is_active: isActive
  });

  revalidateAdminOrganizationViews(organizationId);

  return {
    status: "success",
    message: "Organisation mise a jour avec succes."
  };
}
