import { formatDateTimeDisplay } from "@/lib/format";
import { getInterviewNextActionLabel } from "@/lib/interviews";
import type { RecruiterApplication } from "@/lib/types";

export type DashboardPriorityTone = "primary" | "warning" | "neutral";

export type InterviewDashboardStats = {
  upcoming: number;
  pendingFeedback: number;
  favorable: number;
  watchout: number;
  ready: number;
};

export type InterviewDashboardActionItem = {
  application: RecruiterApplication;
  badge: string;
  title: string;
  hint: string;
  tone: DashboardPriorityTone;
  priority: number;
};

export function hasFavorableInterviewFeedback(application: RecruiterApplication) {
  const recommendation = application.interview_signal.latest_feedback?.recommendation;
  return recommendation === "strong_yes" || recommendation === "yes";
}

export function hasWatchoutInterviewFeedback(application: RecruiterApplication) {
  const recommendation = application.interview_signal.latest_feedback?.recommendation;
  return recommendation === "mixed" || recommendation === "no";
}

export function getInterviewDashboardStats(
  applications: RecruiterApplication[]
): InterviewDashboardStats {
  let upcoming = 0;
  let pendingFeedback = 0;
  let favorable = 0;
  let watchout = 0;
  let ready = 0;

  for (const application of applications) {
    if (application.interview_signal.next_interview_at) {
      upcoming += 1;
    }

    if (application.interview_signal.pending_feedback) {
      pendingFeedback += 1;
    }

    if (application.interview_signal.latest_feedback) {
      ready += 1;
    }

    if (hasFavorableInterviewFeedback(application)) {
      favorable += 1;
    }

    if (hasWatchoutInterviewFeedback(application)) {
      watchout += 1;
    }
  }

  return {
    upcoming,
    pendingFeedback,
    favorable,
    watchout,
    ready
  };
}

function trimText(value: string, limit = 156) {
  if (value.length <= limit) {
    return value;
  }

  return `${value.slice(0, limit - 3).trimEnd()}...`;
}

function buildInterviewActionItem(
  application: RecruiterApplication
): InterviewDashboardActionItem | null {
  const latestFeedback = application.interview_signal.latest_feedback;
  const nextInterviewAt = application.interview_signal.next_interview_at
    ? new Date(application.interview_signal.next_interview_at).getTime()
    : null;
  const now = Date.now();

  if (application.interview_signal.pending_feedback) {
    return {
      application,
      badge: "Urgent",
      title: "Saisir le feedback du dernier entretien",
      hint: "Le rendez-vous est termine mais le compte-rendu structure n'a pas encore ete enregistre.",
      tone: "warning",
      priority: 420
    };
  }

  if (nextInterviewAt) {
    if (nextInterviewAt <= now) {
      return {
        application,
        badge: "A relancer",
        title: "Mettre a jour un entretien depasse",
        hint: `Le rendez-vous prevu le ${formatDateTimeDisplay(application.interview_signal.next_interview_at)} n'est pas encore cloture.`,
        tone: "warning",
        priority: 360
      };
    }

    const hoursUntilInterview = Math.max(0, (nextInterviewAt - now) / 3_600_000);
    return {
      application,
      badge: hoursUntilInterview <= 24 ? "Imminent" : "Planifie",
      title: hoursUntilInterview <= 24 ? "Preparer l'entretien a venir" : "Suivre le prochain entretien",
      hint: `Prochain rendez-vous le ${formatDateTimeDisplay(application.interview_signal.next_interview_at)}.`,
      tone: hoursUntilInterview <= 24 ? "warning" : "primary",
      priority: hoursUntilInterview <= 24 ? 320 : 250
    };
  }

  if (!latestFeedback) {
    return null;
  }

  if (latestFeedback.proposed_decision === "hire") {
    return {
      application,
      badge: "Feu vert",
      title: "Valider une decision d'embauche",
      hint: trimText(latestFeedback.summary || "Le feedback d'entretien pousse le dossier vers une proposition."),
      tone: "primary",
      priority: 300
    };
  }

  if (latestFeedback.proposed_decision === "advance") {
    return {
      application,
      badge: "Feu vert",
      title: "Faire avancer le dossier",
      hint: trimText(
        `${latestFeedback.summary} Action proposee : ${getInterviewNextActionLabel(latestFeedback.next_action)}.`
      ),
      tone: "primary",
      priority: 280
    };
  }

  if (latestFeedback.recommendation === "mixed") {
    return {
      application,
      badge: "Arbitrage",
      title: "Organiser un debrief interne",
      hint: trimText(
        `${latestFeedback.summary} Action proposee : ${getInterviewNextActionLabel(latestFeedback.next_action)}.`
      ),
      tone: "warning",
      priority: 220
    };
  }

  if (latestFeedback.recommendation === "no") {
    return {
      application,
      badge: "Decision",
      title: "Confirmer la suite du dossier",
      hint: trimText(
        `${latestFeedback.summary} Action proposee : ${getInterviewNextActionLabel(latestFeedback.next_action)}.`
      ),
      tone: "warning",
      priority: 210
    };
  }

  if (hasFavorableInterviewFeedback(application)) {
    return {
      application,
      badge: "Suivi",
      title: "Capitaliser sur un feedback favorable",
      hint: trimText(
        `${latestFeedback.summary} Action proposee : ${getInterviewNextActionLabel(latestFeedback.next_action)}.`
      ),
      tone: "primary",
      priority: 180
    };
  }

  return null;
}

export function getInterviewDashboardActionItems(
  applications: RecruiterApplication[]
): InterviewDashboardActionItem[] {
  return applications
    .map(buildInterviewActionItem)
    .filter((item): item is InterviewDashboardActionItem => item !== null)
    .sort((left, right) => {
      if (left.priority !== right.priority) {
        return right.priority - left.priority;
      }

      const leftUpdated = new Date(
        left.application.updated_at ?? left.application.created_at
      ).getTime();
      const rightUpdated = new Date(
        right.application.updated_at ?? right.application.created_at
      ).getTime();

      return rightUpdated - leftUpdated;
    });
}
