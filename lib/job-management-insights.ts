import { isFinalApplicationStatus } from "@/lib/application-status";
import type { RecruiterApplication } from "@/lib/types";

export type JobManagementApplicationsSummary = {
  activeCount: number;
  advancedCount: number;
  applicationsWithCv: number;
  upcomingInterviewCount: number;
  pendingFeedbackCount: number;
  readyDecisionCount: number;
  favorableFeedbackCount: number;
  prioritizedApplications: RecruiterApplication[];
  topApplication: RecruiterApplication | null;
};

function getApplicationPriorityScore(application: RecruiterApplication) {
  let score = 0;
  const latestFeedback = application.interview_signal.latest_feedback;

  if (application.interview_signal.pending_feedback) {
    score += 320;
  }

  if (latestFeedback && !isFinalApplicationStatus(application.status)) {
    score += 280;
  }

  if (application.interview_signal.next_interview_at) {
    score += 220;
  }

  if (application.status === "interview") {
    score += 180;
  } else if (application.status === "shortlist") {
    score += 120;
  } else if (application.status === "screening") {
    score += 70;
  }

  if (latestFeedback?.recommendation === "strong_yes" || latestFeedback?.recommendation === "yes") {
    score += 35;
  }

  if (!application.has_cv) {
    score += 20;
  }

  if (isFinalApplicationStatus(application.status)) {
    score -= 120;
  }

  return score;
}

export function summarizeJobManagementApplications(
  applications: RecruiterApplication[]
): JobManagementApplicationsSummary {
  const prioritizedApplications = [...applications].sort((left, right) => {
    const leftScore = getApplicationPriorityScore(left);
    const rightScore = getApplicationPriorityScore(right);

    if (leftScore !== rightScore) {
      return rightScore - leftScore;
    }

    const leftDate = new Date(left.updated_at ?? left.created_at).getTime();
    const rightDate = new Date(right.updated_at ?? right.created_at).getTime();

    return rightDate - leftDate;
  });

  return {
    activeCount: applications.filter((application) => !isFinalApplicationStatus(application.status)).length,
    advancedCount: applications.filter((application) =>
      ["shortlist", "interview", "hired"].includes(application.status)
    ).length,
    applicationsWithCv: applications.filter((application) => application.has_cv).length,
    upcomingInterviewCount: applications.filter((application) =>
      Boolean(application.interview_signal.next_interview_at)
    ).length,
    pendingFeedbackCount: applications.filter((application) => application.interview_signal.pending_feedback).length,
    readyDecisionCount: applications.filter(
      (application) =>
        Boolean(application.interview_signal.latest_feedback) &&
        !isFinalApplicationStatus(application.status)
    ).length,
    favorableFeedbackCount: applications.filter((application) => {
      const recommendation = application.interview_signal.latest_feedback?.recommendation;
      return recommendation === "strong_yes" || recommendation === "yes";
    }).length,
    prioritizedApplications,
    topApplication: prioritizedApplications[0] ?? null
  };
}
