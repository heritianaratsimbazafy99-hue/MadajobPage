export const APPLICATION_INTERVIEW_BASIC_SELECT =
  "id, application_id, status, format, starts_at, ends_at, timezone, location, meeting_url, notes, interviewer_name, interviewer_email, created_at, updated_at";

const APPLICATION_INTERVIEW_FEEDBACK_SELECT =
  "feedback:application_interview_feedback(id, interview_id, application_id, summary, strengths, concerns, recommendation, proposed_decision, next_action, created_at, updated_at, author:profiles!application_interview_feedback_author_id_fkey(full_name, email))";

export const APPLICATION_INTERVIEW_WITH_FEEDBACK_SELECT =
  `${APPLICATION_INTERVIEW_BASIC_SELECT}, ${APPLICATION_INTERVIEW_FEEDBACK_SELECT}`;

export const APPLICATION_INTERVIEW_SCHEDULE_WITH_FEEDBACK_SELECT =
  `id, application_id, scheduled_by, status, format, starts_at, ends_at, timezone, location, meeting_url, notes, interviewer_name, interviewer_email, created_at, updated_at, ${APPLICATION_INTERVIEW_FEEDBACK_SELECT}`;

export const APPLICATION_INTERVIEW_WITH_SCHEDULER_AND_FEEDBACK_SELECT =
  `${APPLICATION_INTERVIEW_BASIC_SELECT}, scheduler:profiles!application_interviews_scheduled_by_fkey(full_name, email), ${APPLICATION_INTERVIEW_FEEDBACK_SELECT}`;
