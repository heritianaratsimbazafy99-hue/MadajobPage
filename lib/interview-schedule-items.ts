import { mapApplicationInterviewRecord } from "@/lib/interview-record-mappers";
import { normalizeSupabaseRelation } from "@/lib/supabase-relations";
import type { InterviewScheduleItem } from "@/lib/types";

export type InterviewContextApplicationRow = {
  id?: string | null;
  status?: string | null;
  candidate_id?: string | null;
  candidate?: { full_name?: string | null; email?: string | null } | null;
  job_posts?: Record<string, unknown> | Array<Record<string, unknown>> | null;
};

export type InterviewSchedulerRecord = {
  full_name?: string | null;
  email?: string | null;
};

export function buildInterviewScheduleItems(
  interviewRows: Record<string, unknown>[],
  applicationRows: InterviewContextApplicationRow[],
  schedulerMap: Map<string, InterviewSchedulerRecord>
): InterviewScheduleItem[] {
  const applicationMap = new Map(applicationRows.map((row) => [String(row.id ?? ""), row]));

  const items: InterviewScheduleItem[] = [];

  for (const row of interviewRows) {
    const application = applicationMap.get(String(row.application_id ?? ""));

    if (!application) {
      continue;
    }

    const job = normalizeSupabaseRelation(application.job_posts) as Record<string, unknown> | null;
    const organization = normalizeSupabaseRelation(
      (job as { organization?: Record<string, unknown> | Array<Record<string, unknown>> | null } | null)
        ?.organization ?? null
    ) as Record<string, unknown> | null;
    const schedulerId = typeof row.scheduled_by === "string" ? row.scheduled_by : "";
    const scheduler = schedulerMap.get(schedulerId) ?? null;
    const interview = mapApplicationInterviewRecord(row, scheduler);
    const candidate = application.candidate ?? null;

    items.push({
      ...interview,
      application_status: String(application.status ?? "submitted"),
      candidate_id: typeof application.candidate_id === "string" ? application.candidate_id : null,
      candidate_name: candidate?.full_name || candidate?.email || "Candidat Madajob",
      candidate_email: candidate?.email || "email non renseigne",
      job_id: typeof job?.id === "string" ? job.id : null,
      job_title: String(job?.title ?? "Offre Madajob"),
      job_location: String(job?.location ?? "Lieu a definir"),
      organization_name: typeof organization?.name === "string" ? organization.name : "Madajob"
    });
  }

  return items.sort((left, right) => new Date(left.starts_at).getTime() - new Date(right.starts_at).getTime());
}
