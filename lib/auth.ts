import { redirect } from "next/navigation";

import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { AppRole, Profile } from "@/lib/types";

export async function getCurrentProfile(): Promise<Profile | null> {
  if (!isSupabaseConfigured) {
    return null;
  }

  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();

  if (claimsError || !claimsData?.claims?.sub) {
    return null;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, organization_id, phone, avatar_path, is_active")
    .eq("id", claimsData.claims.sub)
    .single();

  if (error || !data) {
    return null;
  }

  return data as Profile;
}

export async function requireAuthenticatedProfile() {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/connexion");
  }

  if (!profile.is_active) {
    redirect("/connexion?inactive=1");
  }

  return profile;
}

export async function requireRole(roles: AppRole[]) {
  const profile = await requireAuthenticatedProfile();

  if (profile.role === "admin") {
    return profile;
  }

  if (!roles.includes(profile.role)) {
    redirect("/app");
  }

  return profile;
}

export function getDashboardPath(role: AppRole) {
  if (role === "recruteur") {
    return "/app/recruteur";
  }

  if (role === "admin") {
    return "/app/admin";
  }

  return "/app/candidat";
}
