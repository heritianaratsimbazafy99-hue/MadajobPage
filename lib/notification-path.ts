import type { AppRole } from "@/lib/types";

export function getNotificationsPath(role: AppRole) {
  if (role === "recruteur") {
    return "/app/recruteur/notifications";
  }

  if (role === "admin") {
    return "/app/admin/notifications";
  }

  return "/app/candidat/notifications";
}
