import { getNotificationKindMeta } from "@/lib/notification-kind";
import type { AppNotification } from "@/lib/types";

export type NotificationFocus = "" | "priority" | "interviews" | "applications" | "linked";

export type NotificationSort = "priority_desc" | "recent" | "oldest";

function getNotificationBaseWeight(kind: string) {
  switch (kind) {
    case "application_interview_cancelled":
      return 340;
    case "application_interview_scheduled":
      return 320;
    case "new_application_received":
      return 300;
    case "application_status_updated":
      return 260;
    case "application_submitted":
      return 180;
    case "account_invited":
    case "user_invited":
      return 140;
    default:
      return 120;
  }
}

export function isInterviewNotification(kind: string) {
  return kind === "application_interview_scheduled" || kind === "application_interview_cancelled";
}

export function isApplicationNotification(kind: string) {
  return (
    kind === "application_submitted" ||
    kind === "application_status_updated" ||
    kind === "new_application_received"
  );
}

export function getNotificationPriorityScore(notification: AppNotification) {
  let score = getNotificationBaseWeight(notification.kind);

  if (!notification.is_read) {
    score += 90;
  }

  if (notification.link_href) {
    score += 35;
  }

  const ageHours =
    (Date.now() - new Date(notification.created_at).getTime()) / (1000 * 60 * 60);

  if (ageHours <= 24) {
    score += 25;
  } else if (ageHours <= 72) {
    score += 10;
  }

  return score;
}

export function isPriorityNotification(notification: AppNotification) {
  return getNotificationPriorityScore(notification) >= 220;
}

export function getNotificationTone(notification: AppNotification): "info" | "success" | "danger" | "muted" {
  if (notification.kind === "application_interview_cancelled") {
    return "danger";
  }

  if (
    notification.kind === "application_interview_scheduled" ||
    notification.kind === "application_status_updated" ||
    notification.kind === "new_application_received"
  ) {
    return "info";
  }

  if (notification.kind === "application_submitted") {
    return "success";
  }

  return "muted";
}

export function getNotificationActionLabel(notification: AppNotification) {
  if (notification.link_href) {
    if (isInterviewNotification(notification.kind)) {
      return "Ouvrir le rendez-vous lie";
    }

    if (isApplicationNotification(notification.kind)) {
      return "Ouvrir le dossier lie";
    }

    return "Ouvrir l'ecran lie";
  }

  if (!notification.is_read) {
    return "Marquer comme lu apres verification";
  }

  return "Aucune action directe";
}

export function getNotificationSummaryText(notification: AppNotification) {
  const kindMeta = getNotificationKindMeta(notification.kind);

  if (notification.kind === "application_interview_scheduled") {
    return "Un entretien a ete planifie. Verifiez l'horaire, le lien et le dossier associe.";
  }

  if (notification.kind === "application_interview_cancelled") {
    return "Un rendez-vous a change. Verifiez le dossier associe pour la suite du process.";
  }

  if (notification.kind === "application_status_updated") {
    return "Le dossier a evolue. Ouvrez la candidature liee pour lire la suite du parcours.";
  }

  if (notification.kind === "new_application_received") {
    return "Une nouvelle candidature est arrivee. Ouvrez le dossier pour la traiter rapidement.";
  }

  if (notification.kind === "application_submitted") {
    return "La candidature a bien ete enregistree. Le suivi detaille reste accessible depuis le dossier.";
  }

  return kindMeta.description;
}

export function summarizeNotifications(notifications: AppNotification[]) {
  const sortedByPriority = [...notifications].sort((left, right) => {
    const leftScore = getNotificationPriorityScore(left);
    const rightScore = getNotificationPriorityScore(right);

    if (leftScore !== rightScore) {
      return rightScore - leftScore;
    }

    return new Date(right.created_at).getTime() - new Date(left.created_at).getTime();
  });

  const latestNotification = [...notifications].sort(
    (left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime()
  )[0] ?? null;

  return {
    unreadCount: notifications.filter((notification) => !notification.is_read).length,
    linkedCount: notifications.filter((notification) => Boolean(notification.link_href)).length,
    interviewCount: notifications.filter((notification) =>
      isInterviewNotification(notification.kind)
    ).length,
    applicationCount: notifications.filter((notification) =>
      isApplicationNotification(notification.kind)
    ).length,
    priorityCount: notifications.filter((notification) =>
      isPriorityNotification(notification)
    ).length,
    latestNotification,
    topNotification: sortedByPriority[0] ?? null
  };
}
