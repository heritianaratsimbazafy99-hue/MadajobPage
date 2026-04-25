import type {
  ApplicationInterview,
  ApplicationInterviewFeedback,
  CandidateApplicationInterviewSignal,
  RecruiterApplicationInterviewSignal
} from "@/lib/types";
import { getSafeExternalUrl } from "@/lib/safe-url";

export function mapApplicationInterviewFeedbackRecord(
  record: Record<string, unknown>
): ApplicationInterviewFeedback {
  const author =
    (record.author as { full_name?: string | null; email?: string | null } | null) ?? null;

  return {
    id: String(record.id),
    interview_id: String(record.interview_id ?? ""),
    application_id: String(record.application_id ?? ""),
    summary: String(record.summary ?? ""),
    strengths: String(record.strengths ?? ""),
    concerns: String(record.concerns ?? ""),
    recommendation:
      (String(record.recommendation ?? "mixed") as ApplicationInterviewFeedback["recommendation"]) ??
      "mixed",
    proposed_decision:
      (String(record.proposed_decision ?? "hold") as ApplicationInterviewFeedback["proposed_decision"]) ??
      "hold",
    next_action:
      (String(record.next_action ?? "team_debrief") as ApplicationInterviewFeedback["next_action"]) ??
      "team_debrief",
    author_name: author?.full_name || author?.email || "Equipe Madajob",
    author_email: author?.email ?? null,
    created_at: String(record.created_at ?? ""),
    updated_at: String(record.updated_at ?? "")
  };
}

export function mapApplicationInterviewRecord(
  record: Record<string, unknown>,
  scheduler?: { full_name?: string | null; email?: string | null } | null
): ApplicationInterview {
  const rawFeedback = record.feedback;
  const feedbackRecord =
    Array.isArray(rawFeedback)
      ? rawFeedback.find((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object") ?? null
      : rawFeedback && typeof rawFeedback === "object"
        ? (rawFeedback as Record<string, unknown>)
        : null;

  return {
    id: String(record.id),
    application_id: String(record.application_id ?? ""),
    status: (String(record.status ?? "scheduled") as ApplicationInterview["status"]) ?? "scheduled",
    format: (String(record.format ?? "video") as ApplicationInterview["format"]) ?? "video",
    starts_at: String(record.starts_at ?? ""),
    ends_at: typeof record.ends_at === "string" ? record.ends_at : null,
    timezone: String(record.timezone ?? "UTC"),
    location: typeof record.location === "string" ? record.location : null,
    meeting_url: typeof record.meeting_url === "string" ? getSafeExternalUrl(record.meeting_url) : null,
    notes: typeof record.notes === "string" ? record.notes : null,
    interviewer_name: String(record.interviewer_name ?? "Equipe Madajob"),
    interviewer_email: typeof record.interviewer_email === "string" ? record.interviewer_email : null,
    scheduled_by_name:
      scheduler?.full_name || scheduler?.email || String(record.interviewer_name ?? "Equipe Madajob"),
    scheduled_by_email: scheduler?.email ?? null,
    created_at: String(record.created_at ?? ""),
    updated_at: String(record.updated_at ?? ""),
    feedback: feedbackRecord ? mapApplicationInterviewFeedbackRecord(feedbackRecord) : null
  };
}

export function createEmptyRecruiterApplicationInterviewSignal(): RecruiterApplicationInterviewSignal {
  return {
    interviews_count: 0,
    feedback_count: 0,
    latest_interview_at: null,
    latest_interview_status: null,
    next_interview_at: null,
    pending_feedback: false,
    latest_feedback: null
  };
}

export function buildRecruiterApplicationInterviewSignalMap(
  interviewRows: Record<string, unknown>[]
): Map<string, RecruiterApplicationInterviewSignal> {
  const signalMap = new Map<string, RecruiterApplicationInterviewSignal>();
  const now = Date.now();

  for (const row of interviewRows) {
    const interview = mapApplicationInterviewRecord(row);
    const applicationId = interview.application_id;

    if (!applicationId) {
      continue;
    }

    const current = signalMap.get(applicationId) ?? createEmptyRecruiterApplicationInterviewSignal();
    current.interviews_count += 1;

    const interviewTime = interview.starts_at ? new Date(interview.starts_at).getTime() : 0;
    const latestInterviewTime = current.latest_interview_at
      ? new Date(current.latest_interview_at).getTime()
      : 0;

    if (!current.latest_interview_at || interviewTime >= latestInterviewTime) {
      current.latest_interview_at = interview.starts_at || null;
      current.latest_interview_status = interview.status;
    }

    if (interview.status === "scheduled" && interviewTime >= now) {
      const nextInterviewTime = current.next_interview_at
        ? new Date(current.next_interview_at).getTime()
        : Number.POSITIVE_INFINITY;

      if (!current.next_interview_at || interviewTime < nextInterviewTime) {
        current.next_interview_at = interview.starts_at || null;
      }
    }

    if (interview.feedback) {
      current.feedback_count += 1;

      const currentFeedbackTime = current.latest_feedback
        ? new Date(current.latest_feedback.updated_at).getTime()
        : 0;
      const interviewFeedbackTime = new Date(interview.feedback.updated_at).getTime();

      if (!current.latest_feedback || interviewFeedbackTime >= currentFeedbackTime) {
        current.latest_feedback = interview.feedback;
      }
    } else if (interview.status === "completed") {
      current.pending_feedback = true;
    }

    signalMap.set(applicationId, current);
  }

  return signalMap;
}

export function createEmptyCandidateApplicationInterviewSignal(): CandidateApplicationInterviewSignal {
  return {
    interviews_count: 0,
    latest_interview_at: null,
    latest_interview_status: null,
    next_interview_at: null,
    next_interview_format: null,
    next_interview_location: null,
    next_interview_meeting_url: null,
    next_interview_timezone: null
  };
}

export function buildCandidateApplicationInterviewSignalMap(
  interviewRows: Record<string, unknown>[]
): Map<string, CandidateApplicationInterviewSignal> {
  const signalMap = new Map<string, CandidateApplicationInterviewSignal>();
  const now = Date.now();

  for (const row of interviewRows) {
    const interview = mapApplicationInterviewRecord(row);
    const applicationId = interview.application_id;

    if (!applicationId) {
      continue;
    }

    const current = signalMap.get(applicationId) ?? createEmptyCandidateApplicationInterviewSignal();
    current.interviews_count += 1;

    const interviewTime = interview.starts_at ? new Date(interview.starts_at).getTime() : 0;
    const latestInterviewTime = current.latest_interview_at
      ? new Date(current.latest_interview_at).getTime()
      : 0;

    if (!current.latest_interview_at || interviewTime >= latestInterviewTime) {
      current.latest_interview_at = interview.starts_at || null;
      current.latest_interview_status = interview.status;
    }

    if (interview.status === "scheduled" && interviewTime >= now) {
      const nextInterviewTime = current.next_interview_at
        ? new Date(current.next_interview_at).getTime()
        : Number.POSITIVE_INFINITY;

      if (!current.next_interview_at || interviewTime < nextInterviewTime) {
        current.next_interview_at = interview.starts_at || null;
        current.next_interview_format = interview.format;
        current.next_interview_location = interview.location;
        current.next_interview_meeting_url = interview.meeting_url;
        current.next_interview_timezone = interview.timezone;
      }
    }

    signalMap.set(applicationId, current);
  }

  return signalMap;
}
