"use server";

import { revalidatePath } from "next/cache";

import { getDashboardPath, requireAuthenticatedProfile } from "@/lib/auth";
import { getNotificationsPath } from "@/lib/notification-path";
import { markAllNotificationsRead, markNotificationRead } from "@/lib/notifications";

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
