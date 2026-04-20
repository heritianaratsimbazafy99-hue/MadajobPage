"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth";
import { createNotifications } from "@/lib/notifications";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AppRole } from "@/lib/types";

export type UserInvitationState = {
  status: "idle" | "success" | "error";
  message: string;
};

const defaultState: UserInvitationState = {
  status: "idle",
  message: ""
};

const allowedRoles = new Set<AppRole>(["candidat", "recruteur", "admin"]);

function getTrimmedValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

async function logInvitationAuditEvent(
  actorId: string,
  entityId: string,
  metadata: Record<string, unknown>
) {
  const adminClient = createAdminClient();

  if (!adminClient) {
    return;
  }

  await adminClient.from("audit_events").insert({
    actor_id: actorId,
    action: "user_invited",
    entity_type: "profile",
    entity_id: entityId,
    metadata
  });
}

export async function inviteUserAction(
  _previousState: UserInvitationState = defaultState,
  formData: FormData
): Promise<UserInvitationState> {
  const profile = await requireRole(["admin"]);
  const adminClient = createAdminClient();

  if (!adminClient) {
    return {
      status: "error",
      message: "Le client admin Supabase n'est pas disponible. Verifie SUPABASE_SERVICE_ROLE_KEY."
    };
  }

  const email = getTrimmedValue(formData, "email").toLowerCase();
  const fullName = getTrimmedValue(formData, "full_name");
  const role = getTrimmedValue(formData, "role") as AppRole;
  const organizationId = getTrimmedValue(formData, "organization_id");

  if (!email || !allowedRoles.has(role)) {
    return {
      status: "error",
      message: "Email ou role invalide."
    };
  }

  if (role === "recruteur" && !organizationId) {
    return {
      status: "error",
      message: "Une organisation est obligatoire pour inviter un recruteur."
    };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const redirectTo = siteUrl
    ? `${siteUrl.replace(/\/$/, "")}/auth/callback?next=/connexion`
    : "http://localhost:3000/auth/callback?next=/connexion";

  const { data, error } = await adminClient.auth.admin.inviteUserByEmail(email, {
    redirectTo,
    data: {
      full_name: fullName,
      role
    }
  });

  if (error || !data.user?.id) {
    return {
      status: "error",
      message: error?.message || "Impossible d'envoyer l'invitation."
    };
  }

  const updates: {
    id: string;
    email: string;
    full_name: string | null;
    role: AppRole;
    organization_id: string | null;
  } = {
    id: data.user.id,
    email,
    full_name: fullName || null,
    role,
    organization_id: role === "candidat" ? null : organizationId || null
  };

  const { error: profileError } = await adminClient
    .from("profiles")
    .upsert(updates, { onConflict: "id" });

  if (profileError) {
    return {
      status: "error",
      message: profileError.message
    };
  }

  await logInvitationAuditEvent(profile.id, data.user.id, {
    invited_email: email,
    invited_role: role,
    organization_id: updates.organization_id
  });

  await createNotifications([
    {
      user_id: profile.id,
      kind: "user_invited",
      title: `Invitation envoyee a ${email}`,
      body: `Le compte ${email} a ete invite avec le role ${role}.`,
      link_href: "/app/admin/utilisateurs",
      metadata: {
        invited_user_id: data.user.id,
        invited_email: email,
        invited_role: role
      }
    },
    {
      user_id: data.user.id,
      kind: "account_invited",
      title: "Votre acces Madajob est pret",
      body: "Un compte a ete prepare pour vous. Connectez-vous apres activation pour acceder a votre espace.",
      link_href: "/app",
      metadata: {
        invited_role: role
      }
    }
  ]);

  revalidatePath("/app/admin");
  revalidatePath("/app/admin/notifications");
  revalidatePath("/app/admin/utilisateurs");

  return {
    status: "success",
    message: "Invitation envoyee avec succes."
  };
}
