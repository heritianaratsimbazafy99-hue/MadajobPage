"use server";

import { revalidatePath } from "next/cache";

import { getDashboardPath, requireAuthenticatedProfile } from "@/lib/auth";
import { markAllNotificationsRead, markNotificationRead } from "@/lib/notifications";

function getNotificationsPath(role: "candidat" | "recruteur" | "admin") {
  if (role === "recruteur") {
    return "/app/recruteur/notifications";
  }

  if (role === "admin") {
    return "/app/admin/notifications";
  }

  return "/app/candidat/notifications";
}

export async function markNotificationReadAction(notificationId: string) {
  const profile = await requireAuthenticatedProfile();
  await markNotificationRead(notificationId, profile.id);

  revalidatePath(getDashboardPath(profile.role));
  revalidatePath(getNotificationsPath(profile.role));
}

export async function markAllNotificationsReadAction() {
  const profile = await requireAuthenticatedProfile();
  await markAllNotificationsRead(profile.id);

  revalidatePath(getDashboardPath(profile.role));
  revalidatePath(getNotificationsPath(profile.role));
}
