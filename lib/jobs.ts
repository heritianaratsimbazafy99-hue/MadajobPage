import { unstable_noStore as noStore } from "next/cache";

import { getCandidateProfileInsights } from "@/lib/candidate-profile";
import { isSupabaseConfigured } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type {
  AdminAuditEvent,
  ApplicationCommunicationEvent,
  ApplicationDetail,
  ApplicationInterview,
  ApplicationInterviewFeedback,
  ApplicationStatusHistoryEntry,
  CandidateApplicationDetail,
  CandidateApplicationHistoryEntry,
  CandidateApplicationInterviewSignal,
  CandidateInterviewScheduleItem,
  CandidateApplicationSummary,
  CandidateApplication,
  CandidateDetail,
  CandidateDocumentData,
  CandidateInterviewInsight,
  CandidatePipelineSummary,
  CandidateProfileData,
  InterviewScheduleItem,
  InternalApplicationNote,
  Job,
  JobAuditEvent,
  ManagedJob,
  ManagedCandidateSummary,
  ManagedOrganizationDetail,
  ManagedOrganizationSummary,
  ManagedUserDetail,
  ManagedUserSummary,
  OrganizationOption,
  Profile,
  RecruiterApplication,
  RecruiterApplicationInterviewSignal
} from "@/lib/types";

const fallbackJobs: Job[] = [
  {
    id: "job-1",
    title: "Responsable recrutement multi-sites",
    slug: "responsable-recrutement-multi-sites",
    location: "Antananarivo",
    contract_type: "CDI",
    work_mode: "Presentiel",
    sector: "RH",
    summary:
      "Piloter les recrutements sur plusieurs entites, coordonner les managers et fiabiliser l'experience candidat.",
    status: "published",
    is_featured: true,
    published_at: "2026-04-19T08:00:00.000Z",
    organization_name: "Madajob"
  },
  {
    id: "job-2",
    title: "Commercial B2B grands comptes",
    slug: "commercial-b2b-grands-comptes",
    location: "Antananarivo",
    contract_type: "CDI",
    work_mode: "Hybride",
    sector: "Commercial",
    summary:
      "Developper des comptes strategiques et accelerer la croissance commerciale sur le marche malgache.",
    status: "published",
    is_featured: true,
    published_at: "2026-04-18T10:00:00.000Z",
    organization_name: "Madajob"
  },
  {
    id: "job-3",
    title: "Responsable administratif et financier",
    slug: "responsable-administratif-financier",
    location: "Toamasina",
    contract_type: "CDI",
    work_mode: "Presentiel",
    sector: "Finance",
    summary:
      "Structurer les processus financiers et accompagner la croissance d'une organisation en forte activite.",
    status: "published",
    is_featured: false,
    published_at: "2026-04-16T08:00:00.000Z",
    organization_name: "Madajob"
  },
  {
    id: "job-4",
    title: "Charge(e) relation candidat",
    slug: "charge-relation-candidat",
    location: "Antananarivo",
    contract_type: "CDD",
    work_mode: "Presentiel",
    sector: "Service client",
    summary:
      "Assurer le suivi des dossiers candidats, fiabiliser les echanges et accompagner les parcours de recrutement.",
    status: "published",
    is_featured: false,
    published_at: "2026-04-15T08:00:00.000Z",
    organization_name: "Madajob"
  }
];

const fallbackApplications: CandidateApplication[] = [
  {
    id: "app-1",
    status: "screening",
    created_at: "2026-04-18T12:30:00.000Z",
    job_title: "Commercial B2B grands comptes",
    organization_name: "Madajob"
  },
  {
    id: "app-2",
    status: "submitted",
    created_at: "2026-04-17T10:15:00.000Z",
    job_title: "Charge(e) relation candidat",
    organization_name: "Madajob"
  }
];

const fallbackRecruiterApplications: RecruiterApplication[] = [
  {
    id: "recruiter-app-1",
    status: "interview",
    created_at: "2026-04-18T12:30:00.000Z",
    updated_at: "2026-04-18T12:30:00.000Z",
    candidate_id: "candidate-1",
    job_id: "job-2",
    cover_letter: "Disponible rapidement pour un entretien et motive par un environnement B2B exigeant.",
    has_cv: true,
    candidate_name: "Miora Randriam",
    candidate_email: "miora@example.com",
    job_title: "Commercial B2B grands comptes",
    job_location: "Antananarivo",
    interview_signal: {
      interviews_count: 1,
      feedback_count: 1,
      latest_interview_at: "2026-04-25T06:00:00.000Z",
      latest_interview_status: "scheduled",
      next_interview_at: "2026-04-25T06:00:00.000Z",
      pending_feedback: false,
      latest_feedback: {
        id: "interview-feedback-1",
        interview_id: "interview-1",
        application_id: "recruiter-app-1",
        summary:
          "Echange fluide, bonne maitrise du cycle commercial B2B et capacite a structurer un pipe grands comptes.",
        strengths: "Prospection structuree, ecoute active, exemples concrets de closing.",
        concerns: "Besoin d'aligner davantage le discours sur les KPI de pilotage d'equipe.",
        recommendation: "yes",
        proposed_decision: "advance",
        next_action: "schedule_next_interview",
        author_name: "Admin Madajob",
        author_email: "admin@madajob.com",
        created_at: "2026-04-25T07:10:00.000Z",
        updated_at: "2026-04-25T07:10:00.000Z"
      }
    }
  },
  {
    id: "recruiter-app-2",
    status: "submitted",
    created_at: "2026-04-17T10:15:00.000Z",
    updated_at: "2026-04-17T10:15:00.000Z",
    candidate_id: "candidate-2",
    job_id: "job-4",
    cover_letter: "Experience confirmee en relation candidat et gestion de dossier.",
    has_cv: false,
    candidate_name: "Hery Ranaivo",
    candidate_email: "hery@example.com",
    job_title: "Charge(e) relation candidat",
    job_location: "Antananarivo",
    interview_signal: {
      interviews_count: 0,
      feedback_count: 0,
      latest_interview_at: null,
      latest_interview_status: null,
      next_interview_at: null,
      pending_feedback: false,
      latest_feedback: null
    }
  }
];

const fallbackInterviews: InterviewScheduleItem[] = [
  {
    id: "interview-1",
    application_id: "recruiter-app-1",
    status: "scheduled",
    format: "video",
    starts_at: "2026-04-25T06:00:00.000Z",
    ends_at: "2026-04-25T06:45:00.000Z",
    timezone: "Indian/Antananarivo",
    location: null,
    meeting_url: "https://meet.google.com/demo-madajob",
    notes: "Premier entretien de qualification commerciale avec focus sur la prospection B2B.",
    interviewer_name: "Equipe recrutement Madajob",
    interviewer_email: "talent@madajob.com",
    scheduled_by_name: "Admin Madajob",
    scheduled_by_email: "admin@madajob.com",
    created_at: "2026-04-23T09:00:00.000Z",
    updated_at: "2026-04-23T09:00:00.000Z",
    feedback: {
      id: "interview-feedback-1",
      interview_id: "interview-1",
      application_id: "recruiter-app-1",
      summary:
        "Echange fluide, bonne maitrise du cycle commercial B2B et capacite a structurer un pipe grands comptes.",
      strengths: "Prospection structuree, ecoute active, exemples concrets de closing.",
      concerns: "Besoin d'aligner davantage le discours sur les KPI de pilotage d'equipe.",
      recommendation: "yes",
      proposed_decision: "advance",
      next_action: "schedule_next_interview",
      author_name: "Admin Madajob",
      author_email: "admin@madajob.com",
      created_at: "2026-04-25T07:10:00.000Z",
      updated_at: "2026-04-25T07:10:00.000Z"
    },
    application_status: "interview",
    candidate_id: "candidate-1",
    candidate_name: "Miora Randriam",
    candidate_email: "miora@example.com",
    job_id: "job-2",
    job_title: "Commercial B2B grands comptes",
    job_location: "Antananarivo",
    organization_name: "Madajob"
  }
];

const fallbackCandidateProfile: CandidateProfileData = {
  full_name: "",
  email: "",
  phone: "",
  headline: "",
  city: "",
  country: "Madagascar",
  bio: "",
  experience_years: null,
  current_position: "",
  desired_position: "",
  desired_contract_type: "",
  desired_work_mode: "",
  desired_salary_min: null,
  desired_salary_currency: "MGA",
  skills_text: "",
  cv_text: "",
  profile_completion: 0,
  primary_cv: null,
  recent_documents: []
};

function getNumericRecordValue(record: Record<string, unknown> | null | undefined, key: string) {
  const value = record?.[key];

  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function mapJobRecord(record: Record<string, unknown>): Job {
  const salaryMin =
    typeof record.salary_min === "number"
      ? record.salary_min
      : typeof record.salary_min === "string"
        ? Number(record.salary_min)
        : null;
  const salaryMax =
    typeof record.salary_max === "number"
      ? record.salary_max
      : typeof record.salary_max === "string"
        ? Number(record.salary_max)
        : null;

  return {
    id: String(record.id),
    title: String(record.title ?? ""),
    slug: String(record.slug ?? ""),
    department: typeof record.department === "string" ? record.department : "",
    location: String(record.location ?? ""),
    contract_type: String(record.contract_type ?? ""),
    work_mode: String(record.work_mode ?? ""),
    sector: String(record.sector ?? ""),
    summary: String(record.summary ?? ""),
    responsibilities:
      typeof record.responsibilities === "string" ? record.responsibilities : "",
    requirements: typeof record.requirements === "string" ? record.requirements : "",
    benefits: typeof record.benefits === "string" ? record.benefits : "",
    salary_min: Number.isFinite(salaryMin) ? salaryMin : null,
    salary_max: Number.isFinite(salaryMax) ? salaryMax : null,
    salary_currency: typeof record.salary_currency === "string" ? record.salary_currency : "MGA",
    salary_period: typeof record.salary_period === "string" ? record.salary_period : "month",
    salary_is_visible: Boolean(record.salary_is_visible),
    status: (record.status as Job["status"]) ?? "draft",
    is_featured: Boolean(record.is_featured),
    published_at: (record.published_at as string | null) ?? null,
    closing_at: typeof record.closing_at === "string" ? record.closing_at : null,
    organization_name:
      typeof record.organization_name === "string"
        ? record.organization_name
        : "Madajob"
  };
}

function mapManagedJobRecord(record: Record<string, unknown>): ManagedJob {
  const salaryMin =
    typeof record.salary_min === "number"
      ? record.salary_min
      : typeof record.salary_min === "string"
        ? Number(record.salary_min)
        : null;
  const salaryMax =
    typeof record.salary_max === "number"
      ? record.salary_max
      : typeof record.salary_max === "string"
        ? Number(record.salary_max)
        : null;

  return {
    ...mapJobRecord(record),
    organization_id: typeof record.organization_id === "string" ? record.organization_id : null,
    department: typeof record.department === "string" ? record.department : "",
    responsibilities:
      typeof record.responsibilities === "string" ? record.responsibilities : "",
    requirements: typeof record.requirements === "string" ? record.requirements : "",
    benefits: typeof record.benefits === "string" ? record.benefits : "",
    salary_min: Number.isFinite(salaryMin) ? salaryMin : null,
    salary_max: Number.isFinite(salaryMax) ? salaryMax : null,
    salary_currency: typeof record.salary_currency === "string" ? record.salary_currency : "MGA",
    salary_period: typeof record.salary_period === "string" ? record.salary_period : "month",
    salary_is_visible: Boolean(record.salary_is_visible),
    created_at: String(record.created_at ?? ""),
    updated_at: String(record.updated_at ?? ""),
    closing_at: typeof record.closing_at === "string" ? record.closing_at : null,
    applications_count:
      typeof record.applications_count === "number" ? record.applications_count : 0
  };
}

function mapCandidateDocumentRecord(record: Record<string, unknown>): CandidateDocumentData {
  return {
    id: String(record.id),
    document_type: String(record.document_type ?? "cv"),
    bucket_id: String(record.bucket_id ?? "candidate-cv"),
    storage_path: String(record.storage_path ?? ""),
    file_name: String(record.file_name ?? "cv"),
    mime_type: typeof record.mime_type === "string" ? record.mime_type : null,
    file_size: typeof record.file_size === "number" ? record.file_size : null,
    is_primary: Boolean(record.is_primary),
    created_at: String(record.created_at ?? "")
  };
}

function mapApplicationInterviewFeedbackRecord(
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

function mapApplicationInterviewRecord(
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
    meeting_url: typeof record.meeting_url === "string" ? record.meeting_url : null,
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

function createEmptyRecruiterApplicationInterviewSignal(): RecruiterApplicationInterviewSignal {
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

function buildRecruiterApplicationInterviewSignalMap(
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

function createEmptyCandidateApplicationInterviewSignal(): CandidateApplicationInterviewSignal {
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

function buildCandidateApplicationInterviewSignalMap(
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

async function createSignedUrlForDocument(
  adminClient: ReturnType<typeof createAdminClient>,
  document: CandidateDocumentData | null
) {
  if (!adminClient || !document?.storage_path || !document.bucket_id) {
    return null;
  }

  const { data } = await adminClient.storage
    .from(document.bucket_id)
    .createSignedUrl(document.storage_path, 60 * 20);

  return data?.signedUrl ?? null;
}

type PublicJobsOptions = {
  limit?: number;
  sort?: "featured" | "recent";
};

export async function getPublicJobs(options: PublicJobsOptions = {}) {
  noStore();
  const { limit, sort = "featured" } = options;

  if (!isSupabaseConfigured) {
    const jobs = [...fallbackJobs];

    if (sort === "recent") {
      jobs.sort((left, right) => {
        const leftDate = left.published_at ? new Date(left.published_at).getTime() : 0;
        const rightDate = right.published_at ? new Date(right.published_at).getTime() : 0;
        return rightDate - leftDate;
      });
    }

    return typeof limit === "number" ? jobs.slice(0, limit) : jobs;
  }

  const supabase = createAdminClient() ?? (await createClient());
  let query = supabase
    .from("job_posts")
    .select(
      "id, title, slug, department, location, contract_type, work_mode, sector, summary, responsibilities, requirements, benefits, salary_min, salary_max, salary_currency, salary_period, salary_is_visible, status, is_featured, published_at, closing_at, created_at"
    )
    .eq("status", "published");

  if (sort === "recent") {
    query = query
      .order("published_at", { ascending: false })
      .order("created_at", { ascending: false });
  } else {
    query = query
      .order("is_featured", { ascending: false })
      .order("published_at", { ascending: false })
      .order("created_at", { ascending: false });
  }

  if (typeof limit === "number") {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    return [];
  }

  return data.map((item) => mapJobRecord(item));
}

export async function getPublicJobBySlug(slug: string) {
  noStore();
  if (!isSupabaseConfigured) {
    return fallbackJobs.find((job) => job.slug === slug) ?? null;
  }

  const supabase = createAdminClient() ?? (await createClient());
  const { data, error } = await supabase
    .from("job_posts")
    .select(
      "id, title, slug, department, location, contract_type, work_mode, sector, summary, responsibilities, requirements, benefits, salary_min, salary_max, salary_currency, salary_period, salary_is_visible, status, is_featured, published_at, closing_at, created_at"
    )
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapJobRecord(data);
}

export async function getRecentPublicJobs(limit = 10) {
  noStore();
  return getPublicJobs({ limit, sort: "recent" });
}

export async function getPublishedJobById(jobId: string) {
  noStore();
  if (!isSupabaseConfigured) {
    return fallbackJobs.find((job) => job.id === jobId && job.status === "published") ?? null;
  }

  const supabase = createAdminClient() ?? (await createClient());
  const { data, error } = await supabase
    .from("job_posts")
    .select(
      "id, title, slug, department, location, contract_type, work_mode, sector, summary, responsibilities, requirements, benefits, salary_min, salary_max, salary_currency, salary_period, salary_is_visible, status, is_featured, published_at, closing_at, created_at"
    )
    .eq("id", jobId)
    .eq("status", "published")
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapJobRecord(data);
}

export async function getCandidateApplicationForJob(candidateId: string, jobId: string) {
  if (!isSupabaseConfigured) {
    void candidateId;
    void jobId;
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("applications")
    .select("id, status, created_at")
    .eq("candidate_id", candidateId)
    .eq("job_post_id", jobId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return {
    id: String(data.id),
    status: String(data.status ?? "submitted"),
    created_at: String(data.created_at ?? ""),
    job_title: "",
    organization_name: null
  } satisfies CandidateApplication;
}

export async function getCandidateApplications(_candidateId: string) {
  if (!isSupabaseConfigured) {
    return fallbackApplications;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("applications")
    .select("id, status, created_at, job_posts(title)")
    .eq("candidate_id", _candidateId)
    .order("created_at", { ascending: false });

  if (error || !data) {
    return fallbackApplications;
  }

  return data.map((item: Record<string, unknown>) => {
    const job = item.job_posts as { title?: string } | null;

    return {
      id: String(item.id),
      status: String(item.status ?? "submitted"),
      created_at: String(item.created_at ?? ""),
      job_title: job?.title ?? "Offre Madajob",
      organization_name: "Madajob"
    };
  });
}

export async function getCandidateApplicationSummaries(candidateId: string) {
  noStore();

  if (!isSupabaseConfigured) {
    const fallbackInterviewSignalMap = buildCandidateApplicationInterviewSignalMap(
      fallbackInterviews
        .filter((interview) => interview.candidate_id === candidateId)
        .map((interview) => interview as unknown as Record<string, unknown>)
    );

    return fallbackApplications.map((application) => {
      const fallbackJob =
        fallbackJobs.find((job) => job.title === application.job_title) ?? fallbackJobs[0];

      return {
        id: application.id,
        status: application.status,
        created_at: application.created_at,
        updated_at: application.created_at,
        cover_letter: null,
        has_cv: false,
        job_id: fallbackJob?.id ?? "",
        job_title: application.job_title,
        job_slug: fallbackJob?.slug ?? "",
        job_location: fallbackJob?.location ?? "",
        contract_type: fallbackJob?.contract_type ?? "",
        work_mode: fallbackJob?.work_mode ?? "",
        sector: fallbackJob?.sector ?? "",
        organization_name: application.organization_name ?? "Madajob",
        notes_count: 0,
        interview_signal:
          fallbackInterviewSignalMap.get(application.id) ?? createEmptyCandidateApplicationInterviewSignal()
      } satisfies CandidateApplicationSummary;
    });
  }

  const adminClient = createAdminClient();
  const supabase = adminClient ?? (await createClient());
  const { data, error } = await supabase
    .from("applications")
    .select(
      `
      id,
      status,
      created_at,
      updated_at,
      cover_letter,
      cv_document_id,
      job_posts!inner(
        id,
        slug,
        title,
        location,
        contract_type,
        work_mode,
        sector,
        organization_id
      )
    `
    )
    .eq("candidate_id", candidateId)
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [] as CandidateApplicationSummary[];
  }

  const organizationIds = Array.from(
    new Set(
      data
        .map((row) => String(normalizeJobRelation(row.job_posts as ApplicationAccessRow["job_posts"])?.organization_id ?? ""))
        .filter(Boolean)
    )
  );
  const applicationIds = data.map((row) => String(row.id ?? "")).filter(Boolean);

  const [organizations, interviewRows] = await Promise.all([
    adminClient && organizationIds.length
      ? adminClient
          .from("organizations")
          .select("id, name")
          .in("id", organizationIds)
      : Promise.resolve({ data: [] as Array<{ id?: string | null; name?: string | null }> }),
    applicationIds.length
      ? (adminClient ?? supabase)
          .from("application_interviews")
          .select(
            "id, application_id, status, format, starts_at, ends_at, timezone, location, meeting_url, notes, interviewer_name, interviewer_email, created_at, updated_at"
          )
          .in("application_id", applicationIds)
          .order("starts_at", { ascending: false })
      : Promise.resolve({ data: [] as Array<Record<string, unknown>> })
  ]);

  const organizationMap = new Map(
    (organizations.data ?? []).map((row) => [String(row.id ?? ""), String(row.name ?? "Madajob")])
  );
  const interviewSignalMap = buildCandidateApplicationInterviewSignalMap(
    (interviewRows.data ?? []) as Record<string, unknown>[]
  );

  return data.map((row: Record<string, unknown>) => {
    const job = normalizeJobRelation(row.job_posts as ApplicationAccessRow["job_posts"]);
    const organizationId = String(job?.organization_id ?? "");

    return {
      id: String(row.id),
      status: String(row.status ?? "submitted"),
      created_at: String(row.created_at ?? ""),
      updated_at: String(row.updated_at ?? row.created_at ?? ""),
      cover_letter: typeof row.cover_letter === "string" ? row.cover_letter : null,
      has_cv: Boolean(row.cv_document_id),
      job_id: String(job?.id ?? ""),
      job_title: String(job?.title ?? "Offre Madajob"),
      job_slug: String(job?.slug ?? ""),
      job_location: String(job?.location ?? ""),
      contract_type: String(job?.contract_type ?? ""),
      work_mode: String(job?.work_mode ?? ""),
      sector: String(job?.sector ?? ""),
      organization_name: organizationMap.get(organizationId) ?? "Madajob",
      notes_count: 0,
      interview_signal:
        interviewSignalMap.get(String(row.id)) ?? createEmptyCandidateApplicationInterviewSignal()
    } satisfies CandidateApplicationSummary;
  });
}

export async function getCandidateInterviews(
  candidateId: string,
  options: { limit?: number } = {}
) {
  noStore();
  const { limit = 12 } = options;

  if (!isSupabaseConfigured) {
    return fallbackInterviews
      .filter((interview) => interview.candidate_id === candidateId)
      .map((interview) => ({
        id: interview.id,
        application_id: interview.application_id,
        status: interview.status,
        format: interview.format,
        starts_at: interview.starts_at,
        ends_at: interview.ends_at,
        timezone: interview.timezone,
        location: interview.location,
        meeting_url: interview.meeting_url,
        notes: interview.notes,
        interviewer_name: interview.interviewer_name,
        interviewer_email: interview.interviewer_email,
        scheduled_by_name: interview.scheduled_by_name,
        scheduled_by_email: interview.scheduled_by_email,
        created_at: interview.created_at,
        updated_at: interview.updated_at,
        feedback: null,
        job_title: interview.job_title,
        job_slug:
          fallbackJobs.find((job) => job.id === interview.job_id)?.slug ??
          fallbackJobs.find((job) => job.title === interview.job_title)?.slug ??
          "",
        organization_name: interview.organization_name ?? "Madajob"
      })) satisfies CandidateInterviewScheduleItem[];
  }

  const supabase = await createClient();
  const { data: applicationRows, error: applicationError } = await supabase
    .from("applications")
    .select(
      `
      id,
      candidate_id,
      job_posts!inner(
        title,
        slug,
        organization_id
      )
    `
    )
    .eq("candidate_id", candidateId);

  if (applicationError || !applicationRows?.length) {
    return [] as CandidateInterviewScheduleItem[];
  }

  const applicationIds = Array.from(
    new Set(applicationRows.map((row) => String(row.id ?? "")).filter(Boolean))
  );

  let interviewsQuery = supabase
    .from("application_interviews")
    .select(
      "id, application_id, status, format, starts_at, ends_at, timezone, location, meeting_url, notes, interviewer_name, interviewer_email, created_at, updated_at"
    )
    .in("application_id", applicationIds)
    .order("starts_at", { ascending: true });

  if (typeof limit === "number") {
    interviewsQuery = interviewsQuery.limit(limit);
  }

  const { data: interviewRows, error: interviewError } = await interviewsQuery;

  if (interviewError || !interviewRows?.length) {
    return [] as CandidateInterviewScheduleItem[];
  }

  const jobRelations = applicationRows.map((row) =>
    normalizeJobRelation(row.job_posts as ApplicationAccessRow["job_posts"])
  );
  const organizationIds = Array.from(
    new Set(jobRelations.map((job) => String(job?.organization_id ?? "")).filter(Boolean))
  );

  const adminClient = createAdminClient();
  const organizations =
    adminClient && organizationIds.length
      ? await adminClient.from("organizations").select("id, name").in("id", organizationIds)
      : { data: [] as Array<{ id?: string | null; name?: string | null }> };
  const organizationMap = new Map(
    (organizations.data ?? []).map((row) => [String(row.id ?? ""), String(row.name ?? "Madajob")])
  );
  const applicationMap = new Map(applicationRows.map((row) => [String(row.id ?? ""), row]));

  return interviewRows
    .map((row) => {
      const application = applicationMap.get(String(row.application_id ?? ""));

      if (!application) {
        return null;
      }

      const job = normalizeJobRelation(application.job_posts as ApplicationAccessRow["job_posts"]);
      const interview = mapApplicationInterviewRecord(row);

      return {
        ...interview,
        job_title: String(job?.title ?? "Offre Madajob"),
        job_slug: String(job?.slug ?? ""),
        organization_name: organizationMap.get(String(job?.organization_id ?? "")) ?? "Madajob"
      } satisfies CandidateInterviewScheduleItem;
    })
    .filter((item): item is CandidateInterviewScheduleItem => Boolean(item));
}

export async function getCandidateApplicationDetail(
  profile: Profile,
  applicationId: string
) {
  noStore();

  if (!isSupabaseConfigured) {
    const fallbackApplication =
      fallbackApplications.find((item) => item.id === applicationId) ?? fallbackApplications[0] ?? null;
    const fallbackJob =
      fallbackJobs.find((job) => job.title === fallbackApplication?.job_title) ??
      fallbackJobs[0] ??
      null;

    if (!fallbackApplication || !fallbackJob) {
      return null;
    }

    return {
      id: fallbackApplication.id,
      status: fallbackApplication.status,
      created_at: fallbackApplication.created_at,
      updated_at: fallbackApplication.created_at,
      cover_letter: null,
      has_cv: false,
      job: {
        id: fallbackJob.id,
        title: fallbackJob.title,
        slug: fallbackJob.slug,
        location: fallbackJob.location,
        contract_type: fallbackJob.contract_type,
        work_mode: fallbackJob.work_mode,
        sector: fallbackJob.sector,
        summary: fallbackJob.summary,
        organization_name: fallbackApplication.organization_name ?? "Madajob"
      },
      cv_document: null,
      cv_download_url: null,
      status_history: [],
      interviews: fallbackInterviews
        .filter((interview) => interview.application_id === fallbackApplication.id)
        .map(
          ({
            application_status: _applicationStatus,
            candidate_id: _candidateId,
            candidate_name: _candidateName,
            candidate_email: _candidateEmail,
            job_id: _jobId,
            job_title: _jobTitle,
            job_location: _jobLocation,
            organization_name: _organizationName,
            ...interview
          }) => interview
        )
    } satisfies CandidateApplicationDetail;
  }

  const adminClient = createAdminClient();
  const supabase = adminClient ?? (await createClient());
  const { data: applicationRow, error: applicationError } = await supabase
    .from("applications")
    .select(
      `
      id,
      status,
      created_at,
      updated_at,
      cover_letter,
      cv_document_id,
      job_posts!inner(
        id,
        slug,
        title,
        location,
        contract_type,
        work_mode,
        sector,
        summary,
        organization_id
      )
    `
    )
    .eq("id", applicationId)
    .eq("candidate_id", profile.id)
    .maybeSingle();

  if (applicationError || !applicationRow) {
    return null;
  }

  const job = normalizeJobRelation(
    applicationRow.job_posts as ApplicationAccessRow["job_posts"]
  );

  if (!job) {
    return null;
  }

  const cvDocumentId =
    typeof applicationRow.cv_document_id === "string" ? applicationRow.cv_document_id : null;

  const [{ data: organizationData }, { data: historyRows }, { data: cvDocumentRow }, { data: interviewRows }] =
    await Promise.all([
      adminClient
        ? adminClient
            .from("organizations")
            .select("name")
            .eq("id", String(job.organization_id ?? ""))
            .maybeSingle()
        : Promise.resolve({ data: null }),
      supabase
        .from("application_status_history")
        .select("id, from_status, to_status, note, created_at")
        .eq("application_id", applicationId)
        .order("created_at", { ascending: false }),
      cvDocumentId
        ? supabase
            .from("candidate_documents")
            .select("id, bucket_id, storage_path, file_name, mime_type, file_size, is_primary, created_at")
            .eq("id", cvDocumentId)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      supabase
        .from("application_interviews")
        .select(
          "id, application_id, status, format, starts_at, ends_at, timezone, location, meeting_url, notes, interviewer_name, interviewer_email, created_at, updated_at"
        )
        .eq("application_id", applicationId)
        .order("starts_at", { ascending: true })
    ]);

  const cvDocument = cvDocumentRow ? mapCandidateDocumentRecord(cvDocumentRow) : null;
  const cvDownloadUrl = await createSignedUrlForDocument(adminClient, cvDocument);
  const statusHistory = (historyRows ?? []).map((item: Record<string, unknown>) => ({
    id: String(item.id),
    from_status: typeof item.from_status === "string" ? item.from_status : null,
    to_status: String(item.to_status ?? "submitted"),
    note: typeof item.note === "string" ? item.note : null,
    created_at: String(item.created_at ?? "")
  })) satisfies CandidateApplicationHistoryEntry[];
  const interviews = (interviewRows ?? []).map((item: Record<string, unknown>) =>
    mapApplicationInterviewRecord(item)
  );

  return {
    id: String(applicationRow.id),
    status: String(applicationRow.status ?? "submitted"),
    created_at: String(applicationRow.created_at ?? ""),
    updated_at: String(applicationRow.updated_at ?? applicationRow.created_at ?? ""),
    cover_letter:
      typeof applicationRow.cover_letter === "string" ? applicationRow.cover_letter : null,
    has_cv: Boolean(cvDocument),
    job: {
      id: String(job.id ?? ""),
      title: String(job.title ?? "Offre Madajob"),
      slug: String(job.slug ?? ""),
      location: String(job.location ?? ""),
      contract_type: String(job.contract_type ?? ""),
      work_mode: String(job.work_mode ?? ""),
      sector: String(job.sector ?? ""),
      summary: String(job.summary ?? ""),
      organization_name: String(organizationData?.name ?? "Madajob")
    },
    cv_document: cvDocument,
    cv_download_url: cvDownloadUrl,
    status_history: statusHistory,
    interviews
  } satisfies CandidateApplicationDetail;
}

export async function getCandidatePrimaryDocument(candidateId: string) {
  if (!isSupabaseConfigured) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("candidate_documents")
    .select("id, document_type, bucket_id, storage_path, file_name, mime_type, file_size, is_primary, created_at")
    .eq("candidate_id", candidateId)
    .order("is_primary", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapCandidateDocumentRecord(data);
}

export async function getCandidateDocuments(
  candidateId: string,
  options: { limit?: number; documentType?: string } = {}
) {
  const { limit = 6, documentType } = options;

  if (!isSupabaseConfigured) {
    return [] as CandidateDocumentData[];
  }

  const supabase = await createClient();
  let query = supabase
    .from("candidate_documents")
    .select("id, document_type, bucket_id, storage_path, file_name, mime_type, file_size, is_primary, created_at")
    .eq("candidate_id", candidateId)
    .order("is_primary", { ascending: false })
    .order("created_at", { ascending: false });

  if (documentType) {
    query = query.eq("document_type", documentType);
  }

  const { data, error } = await query.limit(limit);

  if (error || !data) {
    return [] as CandidateDocumentData[];
  }

  return data.map((item) => mapCandidateDocumentRecord(item));
}

async function getApplicationCountsByJobIds(jobIds: string[]) {
  if (!jobIds.length) {
    return new Map<string, number>();
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("applications")
    .select("job_post_id")
    .in("job_post_id", jobIds);

  if (error || !data) {
    return new Map<string, number>();
  }

  const counts = new Map<string, number>();

  for (const item of data) {
    const jobId = String(item.job_post_id ?? "");

    if (!jobId) {
      continue;
    }

    counts.set(jobId, (counts.get(jobId) ?? 0) + 1);
  }

  return counts;
}

function buildManagedJobs(
  rows: Array<Record<string, unknown>>,
  countsByJobId: Map<string, number>
) {
  return rows.map((row) =>
    mapManagedJobRecord({
      ...row,
      applications_count: countsByJobId.get(String(row.id ?? "")) ?? 0
    })
  );
}

export async function getCandidateWorkspace(profile: Profile): Promise<CandidateProfileData> {
  if (!isSupabaseConfigured) {
    return {
      ...fallbackCandidateProfile,
      full_name: profile.full_name ?? "",
      email: profile.email ?? "",
      phone: profile.phone ?? ""
    };
  }

  const supabase = await createClient();
  const [{ data: profileData }, { data: candidateData }, primaryCv, recentDocuments] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, email, phone")
      .eq("id", profile.id)
      .maybeSingle(),
    supabase
      .from("candidate_profiles")
      .select(
        "headline, city, country, bio, experience_years, current_position, desired_position, desired_contract_type, desired_work_mode, desired_salary_min, desired_salary_currency, skills_text, cv_text, profile_completion"
      )
      .eq("user_id", profile.id)
      .maybeSingle(),
    getCandidatePrimaryDocument(profile.id),
    getCandidateDocuments(profile.id, { documentType: "cv" })
  ]);

  const profileInsights = getCandidateProfileInsights({
    full_name: String(profileData?.full_name ?? profile.full_name ?? ""),
    phone: String(profileData?.phone ?? profile.phone ?? ""),
    headline: String(candidateData?.headline ?? ""),
    city: String(candidateData?.city ?? ""),
    bio: String(candidateData?.bio ?? ""),
    experience_years:
      typeof candidateData?.experience_years === "number"
        ? candidateData.experience_years
        : null,
    current_position: String(candidateData?.current_position ?? ""),
    desired_position: String(candidateData?.desired_position ?? ""),
    desired_contract_type: String(candidateData?.desired_contract_type ?? ""),
    desired_work_mode: String(candidateData?.desired_work_mode ?? ""),
    desired_salary_min: getNumericRecordValue(candidateData, "desired_salary_min"),
    skills_text: String(candidateData?.skills_text ?? ""),
    cv_text: String(candidateData?.cv_text ?? ""),
    primary_cv: primaryCv ? { id: primaryCv.id } : null
  });

  return {
    full_name: String(profileData?.full_name ?? profile.full_name ?? ""),
    email: String(profileData?.email ?? profile.email ?? ""),
    phone: String(profileData?.phone ?? profile.phone ?? ""),
    headline: String(candidateData?.headline ?? ""),
    city: String(candidateData?.city ?? ""),
    country: String(candidateData?.country ?? "Madagascar"),
    bio: String(candidateData?.bio ?? ""),
    experience_years:
      typeof candidateData?.experience_years === "number"
        ? candidateData.experience_years
        : null,
    current_position: String(candidateData?.current_position ?? ""),
    desired_position: String(candidateData?.desired_position ?? ""),
    desired_contract_type: String(candidateData?.desired_contract_type ?? ""),
    desired_work_mode: String(candidateData?.desired_work_mode ?? ""),
    desired_salary_min: getNumericRecordValue(candidateData, "desired_salary_min"),
    desired_salary_currency: String(candidateData?.desired_salary_currency ?? "MGA"),
    skills_text: String(candidateData?.skills_text ?? ""),
    cv_text: String(candidateData?.cv_text ?? ""),
    profile_completion: profileInsights.completion,
    primary_cv: primaryCv,
    recent_documents: recentDocuments
  };
}

export async function getRecruiterSnapshot(profile: Profile) {
  if (!isSupabaseConfigured) {
    return {
      jobs: fallbackJobs.slice(0, 3),
      metrics: {
        activeJobs: 3,
        applications: 24,
        pipeline: 8
      }
    };
  }

  if (!profile.organization_id) {
    return {
      jobs: [],
      metrics: {
        activeJobs: 0,
        applications: 0,
        pipeline: 0
      }
    };
  }

  const supabase = await createClient();
  const { data: jobsData, error: jobsError } = await supabase
    .from("job_posts")
    .select("id, title, slug, location, contract_type, work_mode, sector, summary, salary_min, salary_max, salary_currency, salary_period, salary_is_visible, status, is_featured, published_at")
    .eq("organization_id", profile.organization_id)
    .order("created_at", { ascending: false })
    .limit(6);

  if (jobsError) {
    return {
      jobs: [],
      metrics: {
        activeJobs: 0,
        applications: 0,
        pipeline: 0
      }
    };
  }

  const jobs = (jobsData ?? []).map((item) => mapJobRecord(item));
  const jobIds = jobs.map((job) => job.id);

  let applicationsCount = 0;

  if (jobIds.length > 0) {
    const { count } = await supabase
      .from("applications")
      .select("id", { count: "exact", head: true })
      .in("job_post_id", jobIds);

    applicationsCount = count ?? 0;
  }

  return {
    jobs,
    metrics: {
      activeJobs: jobs.filter((job) => job.status === "published").length,
      applications: applicationsCount ?? 0,
      pipeline: Math.max(3, Math.floor((applicationsCount ?? 0) / 2))
    }
  };
}

export async function getManagedJobs(profile: Profile, options: { limit?: number } = {}) {
  const { limit = 50 } = options;
  if (!isSupabaseConfigured) {
    return fallbackJobs.map((job, index) =>
      mapManagedJobRecord({
        ...job,
        created_at: job.published_at ?? new Date(Date.now() - index * 86400000).toISOString(),
        updated_at: job.published_at ?? new Date().toISOString(),
        closing_at: null,
        responsibilities: "",
        requirements: "",
        benefits: "",
        department: "",
        applications_count: index + 2
      })
    );
  }

  if (profile.role === "recruteur" && !profile.organization_id) {
    return [];
  }

  const supabase = await createClient();
  let query = supabase
    .from("job_posts")
    .select(
      "id, title, slug, organization_id, department, location, contract_type, work_mode, sector, summary, responsibilities, requirements, benefits, salary_min, salary_max, salary_currency, salary_period, salary_is_visible, status, is_featured, published_at, closing_at, created_at, updated_at"
    )
    .order("created_at", { ascending: false });

  if (profile.role === "recruteur") {
    query = query.eq("organization_id", profile.organization_id);
  }

  const finalQuery = typeof limit === "number" ? query.limit(limit) : query;
  const { data, error } = await finalQuery;

  if (error || !data) {
    return [];
  }

  const organizationIds = Array.from(
    new Set(
      data
        .map((item) => String(item.organization_id ?? ""))
        .filter(Boolean)
    )
  );

  const organizationMap =
    profile.role === "admin" && organizationIds.length > 0
      ? new Map(
          (
            (
              await (createAdminClient() ?? supabase)
                .from("organizations")
                .select("id, name")
                .in("id", organizationIds)
            ).data ?? []
          ).map((row) => [String(row.id ?? ""), String(row.name ?? "Madajob")])
        )
      : new Map<string, string>();

  const countsByJobId = await getApplicationCountsByJobIds(
    data.map((item) => String(item.id))
  );

  return buildManagedJobs(
    data.map((item) => ({
      ...item,
      organization_name:
        typeof item.organization_id === "string"
          ? organizationMap.get(item.organization_id) ?? "Madajob"
          : "Madajob"
    })),
    countsByJobId
  );
}

export async function getManagedJobById(profile: Profile, jobId: string) {
  if (!isSupabaseConfigured) {
    const fallback = fallbackJobs.find((job) => job.id === jobId) ?? fallbackJobs[0] ?? null;

    if (!fallback) {
      return null;
    }

    return mapManagedJobRecord({
      ...fallback,
      created_at: fallback.published_at ?? new Date().toISOString(),
      updated_at: fallback.published_at ?? new Date().toISOString(),
      closing_at: fallback.status === "closed" ? new Date().toISOString() : null,
      responsibilities: "",
      requirements: "",
      benefits: "",
      department: "",
      applications_count: 4
    });
  }

  if (profile.role === "recruteur" && !profile.organization_id) {
    return null;
  }

  const supabase = await createClient();
  let query = supabase
    .from("job_posts")
    .select(
      "id, title, slug, organization_id, department, location, contract_type, work_mode, sector, summary, responsibilities, requirements, benefits, salary_min, salary_max, salary_currency, salary_period, salary_is_visible, status, is_featured, published_at, closing_at, created_at, updated_at"
    )
    .eq("id", jobId);

  if (profile.role === "recruteur") {
    query = query.eq("organization_id", profile.organization_id);
  }

  const { data, error } = await query.maybeSingle();

  if (error || !data) {
    return null;
  }

  const countsByJobId = await getApplicationCountsByJobIds([jobId]);

  let organizationName = "Madajob";

  if (typeof data.organization_id === "string" && data.organization_id) {
    const organizationClient = createAdminClient() ?? supabase;
    const { data: organizationRow } = await organizationClient
      .from("organizations")
      .select("name")
      .eq("id", data.organization_id)
      .maybeSingle();

    organizationName =
      typeof organizationRow?.name === "string" ? organizationRow.name : "Madajob";
  }

  return mapManagedJobRecord({
    ...data,
    organization_name: organizationName,
    applications_count: countsByJobId.get(jobId) ?? 0
  });
}

export async function getJobAuditEvents(profile: Profile, jobId: string) {
  const job = await getManagedJobById(profile, jobId);

  if (!job) {
    return [];
  }

  const adminClient = createAdminClient();

  if (!adminClient) {
    return [];
  }

  const { data, error } = await adminClient
    .from("audit_events")
    .select(
      "id, action, entity_type, entity_id, metadata, created_at, actor:profiles(full_name, email)"
    )
    .eq("entity_type", "job_post")
    .eq("entity_id", jobId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error || !data) {
    return [];
  }

  return data.map((item: Record<string, unknown>) => {
    const actor =
      (item.actor as { full_name?: string | null; email?: string | null } | null) ?? null;

    return {
      id: String(item.id),
      action: String(item.action ?? ""),
      entity_type: String(item.entity_type ?? ""),
      entity_id: String(item.entity_id ?? ""),
      metadata:
        typeof item.metadata === "object" && item.metadata !== null
          ? (item.metadata as Record<string, unknown>)
          : {},
      created_at: String(item.created_at ?? ""),
      actor_name: actor?.full_name || actor?.email || "Madajob",
      actor_email: actor?.email ?? null
    } satisfies JobAuditEvent;
  });
}

export async function getInternalNotesByApplicationIds(
  _profile: Profile,
  applicationIds: string[]
) {
  if (!applicationIds.length) {
    return new Map<string, InternalApplicationNote[]>();
  }

  if (!isSupabaseConfigured) {
    return new Map<string, InternalApplicationNote[]>();
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("internal_notes")
    .select(
      "id, application_id, body, created_at, author:profiles(full_name, email)"
    )
    .in("application_id", applicationIds)
    .order("created_at", { ascending: false });

  if (error || !data) {
    return new Map<string, InternalApplicationNote[]>();
  }

  const notesByApplicationId = new Map<string, InternalApplicationNote[]>();

  for (const item of data) {
    const author =
      (item.author as { full_name?: string | null; email?: string | null } | null) ?? null;
    const note = {
      id: String(item.id),
      application_id: String(item.application_id),
      body: String(item.body ?? ""),
      created_at: String(item.created_at ?? ""),
      author_name: author?.full_name || author?.email || "Equipe Madajob",
      author_email: author?.email ?? null
    } satisfies InternalApplicationNote;

    const applicationId = note.application_id;
    const existing = notesByApplicationId.get(applicationId) ?? [];
    existing.push(note);
    notesByApplicationId.set(applicationId, existing);
  }

  return notesByApplicationId;
}

export async function getApplicationDetail(profile: Profile, applicationId: string) {
  if (!isSupabaseConfigured) {
    const fallbackApplication = fallbackRecruiterApplications[0];
    const fallbackJob = fallbackJobs[0];

    if (!fallbackApplication || !fallbackJob) {
      return null;
    }

    return {
      id: fallbackApplication.id,
      status: fallbackApplication.status,
      created_at: fallbackApplication.created_at,
      updated_at: fallbackApplication.created_at,
      cover_letter: fallbackApplication.cover_letter,
      has_cv: fallbackApplication.has_cv,
      job: {
        id: fallbackJob.id,
        title: fallbackJob.title,
        slug: fallbackJob.slug,
        location: fallbackJob.location,
        contract_type: fallbackJob.contract_type,
        work_mode: fallbackJob.work_mode,
        sector: fallbackJob.sector,
        summary: fallbackJob.summary,
        organization_name: fallbackJob.organization_name ?? "Madajob"
      },
      candidate: {
        id: "candidate-demo",
        full_name: fallbackApplication.candidate_name,
        email: fallbackApplication.candidate_email,
        phone: null,
        headline: "Profil demo",
        city: "Antananarivo",
        country: "Madagascar",
        bio: "",
        experience_years: 4,
        current_position: "",
        desired_position: "",
        desired_contract_type: "",
        desired_work_mode: "",
        desired_salary_min: null,
        desired_salary_currency: "MGA",
        skills_text: "",
        cv_text: "",
        profile_completion: 72
      },
      cv_document: null,
      cv_download_url: null,
      notes: [],
      status_history: [],
      communications: [],
      interviews: fallbackInterviews
        .filter((interview) => interview.application_id === fallbackApplication.id)
        .map(
          ({
            application_status: _applicationStatus,
            candidate_id: _candidateId,
            candidate_name: _candidateName,
            candidate_email: _candidateEmail,
            job_id: _jobId,
            job_title: _jobTitle,
            job_location: _jobLocation,
            organization_name: _organizationName,
            ...interview
          }) => interview
        )
    } satisfies ApplicationDetail;
  }

  const supabase = await createClient();
  let accessQuery = supabase
    .from("applications")
    .select(
      `
      id,
      status,
      created_at,
      updated_at,
      cover_letter,
      candidate_id,
      cv_document_id,
      job_posts!inner(
        id,
        slug,
        title,
        location,
        contract_type,
        work_mode,
        sector,
        summary,
        organization_id
      )
    `
    )
    .eq("id", applicationId);

  if (profile.role === "recruteur") {
    accessQuery = accessQuery.eq("job_posts.organization_id", profile.organization_id);
  }

  const { data: accessData, error: accessError } = await accessQuery.maybeSingle();

  if (accessError || !accessData) {
    return null;
  }

  const rawJobAccess = accessData.job_posts;
  const jobAccess = (
    Array.isArray(rawJobAccess) ? rawJobAccess[0] : rawJobAccess
  ) as Record<string, unknown> | null;

  if (!jobAccess) {
    return null;
  }

  const adminClient = createAdminClient();

  if (!adminClient) {
    return {
      id: String(accessData.id),
      status: String(accessData.status ?? "submitted"),
      created_at: String(accessData.created_at ?? ""),
      updated_at: String(accessData.updated_at ?? ""),
      cover_letter: typeof accessData.cover_letter === "string" ? accessData.cover_letter : null,
      has_cv: Boolean(accessData.cv_document_id),
      job: {
        id: String(jobAccess.id),
        title: String(jobAccess.title ?? "Offre Madajob"),
        slug: String(jobAccess.slug ?? ""),
        location: String(jobAccess.location ?? ""),
        contract_type: String(jobAccess.contract_type ?? ""),
        work_mode: String(jobAccess.work_mode ?? ""),
        sector: String(jobAccess.sector ?? ""),
        summary: String(jobAccess.summary ?? ""),
        organization_name: "Madajob"
      },
      candidate: {
        id: String(accessData.candidate_id ?? ""),
        full_name: "Candidat Madajob",
        email: null,
        phone: null,
        headline: "",
        city: "",
        country: "Madagascar",
        bio: "",
        experience_years: null,
        current_position: "",
        desired_position: "",
        desired_contract_type: "",
        desired_work_mode: "",
        desired_salary_min: null,
        desired_salary_currency: "MGA",
        skills_text: "",
        cv_text: "",
        profile_completion: 0
      },
      cv_document: null,
      cv_download_url: null,
      notes: [],
      status_history: [],
      communications: [],
      interviews: []
    } satisfies ApplicationDetail;
  }

  const candidateId = String(accessData.candidate_id ?? "");
  const cvDocumentId =
    typeof accessData.cv_document_id === "string" ? accessData.cv_document_id : null;

  const [
    { data: candidateProfileData },
    { data: candidateExtendedData },
    { data: organizationData },
    { data: noteRows },
    { data: historyRows },
    { data: cvDocumentRow },
    { data: interviewRows },
    { data: notificationRows },
    { data: emailRows }
  ] = await Promise.all([
    adminClient
      .from("profiles")
      .select("id, full_name, email, phone")
      .eq("id", candidateId)
      .maybeSingle(),
    adminClient
      .from("candidate_profiles")
      .select(
        "headline, city, country, bio, experience_years, current_position, desired_position, desired_contract_type, desired_work_mode, desired_salary_min, desired_salary_currency, skills_text, cv_text, profile_completion"
      )
      .eq("user_id", candidateId)
      .maybeSingle(),
    adminClient
      .from("organizations")
      .select("name")
      .eq("id", String(jobAccess.organization_id ?? ""))
      .maybeSingle(),
    adminClient
      .from("internal_notes")
      .select("id, application_id, body, created_at, author:profiles(full_name, email)")
      .eq("application_id", applicationId)
      .order("created_at", { ascending: false }),
    adminClient
      .from("application_status_history")
      .select("id, from_status, to_status, note, created_at, actor:profiles(full_name, email)")
      .eq("application_id", applicationId)
      .order("created_at", { ascending: false }),
    cvDocumentId
      ? adminClient
          .from("candidate_documents")
          .select("id, bucket_id, storage_path, file_name, mime_type, file_size, is_primary, created_at")
          .eq("id", cvDocumentId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    adminClient
      .from("application_interviews")
      .select(
        "id, application_id, status, format, starts_at, ends_at, timezone, location, meeting_url, notes, interviewer_name, interviewer_email, created_at, updated_at, scheduler:profiles!application_interviews_scheduled_by_fkey(full_name, email), feedback:application_interview_feedback(id, interview_id, application_id, summary, strengths, concerns, recommendation, proposed_decision, next_action, created_at, updated_at, author:profiles!application_interview_feedback_author_id_fkey(full_name, email))"
      )
      .eq("application_id", applicationId)
      .order("starts_at", { ascending: true }),
    adminClient
      .from("notifications")
      .select("id, kind, title, body, link_href, is_read, created_at, recipient:profiles(full_name, email, role)")
      .in("link_href", [
        `/app/candidat/candidatures/${applicationId}`,
        `/app/recruteur/candidatures/${applicationId}`,
        `/app/admin/candidatures/${applicationId}`
      ])
      .order("created_at", { ascending: false }),
    adminClient
      .from("transactional_emails")
      .select(
        "id, template_key, subject, preview_text, link_href, status, recipient_name, recipient_email, created_at"
      )
      .eq("link_href", `/app/candidat/candidatures/${applicationId}`)
      .order("created_at", { ascending: false })
  ]);

  const cvDownloadUrl = await createSignedUrlForDocument(
    adminClient,
    cvDocumentRow ? mapCandidateDocumentRecord(cvDocumentRow) : null
  );
  const interviews = (interviewRows ?? []).map((item: Record<string, unknown>) => {
    const scheduler =
      (item.scheduler as { full_name?: string | null; email?: string | null } | null) ?? null;

    return mapApplicationInterviewRecord(item, scheduler);
  });

  const notes = (noteRows ?? []).map((item: Record<string, unknown>) => {
    const author =
      (item.author as { full_name?: string | null; email?: string | null } | null) ?? null;

    return {
      id: String(item.id),
      application_id: String(item.application_id),
      body: String(item.body ?? ""),
      created_at: String(item.created_at ?? ""),
      author_name: author?.full_name || author?.email || "Equipe Madajob",
      author_email: author?.email ?? null
    } satisfies InternalApplicationNote;
  });

  const statusHistory = (historyRows ?? []).map((item: Record<string, unknown>) => {
    const actor =
      (item.actor as { full_name?: string | null; email?: string | null } | null) ?? null;

    return {
      id: String(item.id),
      from_status: typeof item.from_status === "string" ? item.from_status : null,
      to_status: String(item.to_status ?? "submitted"),
      note: typeof item.note === "string" ? item.note : null,
      created_at: String(item.created_at ?? ""),
      changed_by_name: actor?.full_name || actor?.email || "Equipe Madajob",
      changed_by_email: actor?.email ?? null
    } satisfies ApplicationStatusHistoryEntry;
  });

  const communications: ApplicationCommunicationEvent[] = [
    ...(notificationRows ?? []).map((item: Record<string, unknown>) => {
      const recipient =
        (item.recipient as { full_name?: string | null; email?: string | null; role?: string | null } | null) ??
        null;

      return {
        id: `notification:${String(item.id)}`,
        channel: "notification",
        event_key: String(item.kind ?? "notification"),
        title: String(item.title ?? "Notification Madajob"),
        body: String(item.body ?? ""),
        recipient_label:
          recipient?.full_name || recipient?.email || String(recipient?.role ?? "Utilisateur cible"),
        status: Boolean(item.is_read) ? "read" : "unread",
        created_at: String(item.created_at ?? ""),
        link_href: typeof item.link_href === "string" ? item.link_href : null,
        management_href: null
      } satisfies ApplicationCommunicationEvent;
    }),
    ...(emailRows ?? []).map((item: Record<string, unknown>) => {
      return {
        id: `email:${String(item.id)}`,
        channel: "email",
        event_key: String(item.template_key ?? "transactional_email"),
        title: String(item.subject ?? "Email Madajob"),
        body: String(item.preview_text ?? ""),
        recipient_label:
          (typeof item.recipient_name === "string" && item.recipient_name) ||
          String(item.recipient_email ?? "Destinataire"),
        status: String(item.status ?? "queued"),
        created_at: String(item.created_at ?? ""),
        link_href: typeof item.link_href === "string" ? item.link_href : null,
        management_href: profile.role === "admin" ? `/app/admin/emails/${String(item.id)}` : null
      } satisfies ApplicationCommunicationEvent;
    })
  ].sort((left, right) => {
    const leftTime = new Date(left.created_at).getTime();
    const rightTime = new Date(right.created_at).getTime();
    return rightTime - leftTime;
  });

  return {
    id: String(accessData.id),
    status: String(accessData.status ?? "submitted"),
    created_at: String(accessData.created_at ?? ""),
    updated_at: String(accessData.updated_at ?? ""),
    cover_letter: typeof accessData.cover_letter === "string" ? accessData.cover_letter : null,
    has_cv: Boolean(cvDocumentRow),
    job: {
      id: String(jobAccess.id),
      title: String(jobAccess.title ?? "Offre Madajob"),
      slug: String(jobAccess.slug ?? ""),
      location: String(jobAccess.location ?? ""),
      contract_type: String(jobAccess.contract_type ?? ""),
      work_mode: String(jobAccess.work_mode ?? ""),
      sector: String(jobAccess.sector ?? ""),
      summary: String(jobAccess.summary ?? ""),
      organization_name: String(organizationData?.name ?? "Madajob")
    },
    candidate: {
      id: String(candidateProfileData?.id ?? candidateId),
      full_name:
        String(candidateProfileData?.full_name ?? candidateProfileData?.email ?? "Candidat Madajob"),
      email: candidateProfileData?.email ?? null,
      phone: candidateProfileData?.phone ?? null,
      headline: String(candidateExtendedData?.headline ?? ""),
      city: String(candidateExtendedData?.city ?? ""),
      country: String(candidateExtendedData?.country ?? "Madagascar"),
      bio: String(candidateExtendedData?.bio ?? ""),
      experience_years:
        typeof candidateExtendedData?.experience_years === "number"
          ? candidateExtendedData.experience_years
          : null,
      current_position: String(candidateExtendedData?.current_position ?? ""),
      desired_position: String(candidateExtendedData?.desired_position ?? ""),
      desired_contract_type: String(candidateExtendedData?.desired_contract_type ?? ""),
      desired_work_mode: String(candidateExtendedData?.desired_work_mode ?? ""),
      desired_salary_min: getNumericRecordValue(candidateExtendedData, "desired_salary_min"),
      desired_salary_currency: String(candidateExtendedData?.desired_salary_currency ?? "MGA"),
      skills_text: String(candidateExtendedData?.skills_text ?? ""),
      cv_text: String(candidateExtendedData?.cv_text ?? ""),
      profile_completion:
        typeof candidateExtendedData?.profile_completion === "number"
          ? candidateExtendedData.profile_completion
          : 0
    },
    cv_document: cvDocumentRow ? mapCandidateDocumentRecord(cvDocumentRow) : null,
    cv_download_url: cvDownloadUrl,
    notes,
    status_history: statusHistory,
    communications,
    interviews
  } satisfies ApplicationDetail;
}

type ApplicationAccessRow = {
  id: string;
  candidate_id: string | null;
  status: string | null;
  created_at: string | null;
  updated_at?: string | null;
  cover_letter?: string | null;
  cv_document_id?: string | null;
  job_posts:
    | {
        id?: string | null;
        slug?: string | null;
        title?: string | null;
        location?: string | null;
        contract_type?: string | null;
        work_mode?: string | null;
        sector?: string | null;
        summary?: string | null;
        organization_id?: string | null;
      }
    | Array<{
        id?: string | null;
        slug?: string | null;
        title?: string | null;
        location?: string | null;
        contract_type?: string | null;
        work_mode?: string | null;
        sector?: string | null;
        summary?: string | null;
        organization_id?: string | null;
      }>
    | null;
};

function normalizeJobRelation(
  relation: ApplicationAccessRow["job_posts"]
): Record<string, unknown> | null {
  if (!relation) {
    return null;
  }

  return (Array.isArray(relation) ? relation[0] : relation) as Record<string, unknown> | null;
}

async function getAccessibleApplicationRows(profile: Profile) {
  if (!isSupabaseConfigured) {
    return [] as ApplicationAccessRow[];
  }

  const supabase = await createClient();
  let query = supabase
    .from("applications")
    .select(
      `
      id,
      candidate_id,
      status,
      created_at,
      updated_at,
      cover_letter,
      cv_document_id,
      job_posts!inner(
        id,
        slug,
        title,
        location,
        contract_type,
        work_mode,
        sector,
        summary,
        organization_id
      )
    `
    )
    .order("created_at", { ascending: false });

  if (profile.role === "recruteur") {
    if (!profile.organization_id) {
      return [] as ApplicationAccessRow[];
    }

    query = query.eq("job_posts.organization_id", profile.organization_id);
  }

  const { data, error } = await query.limit(300);

  if (error || !data) {
    return [] as ApplicationAccessRow[];
  }

  return data as ApplicationAccessRow[];
}

export async function getManagedCandidates(
  profile: Profile,
  options: { limit?: number } = {}
) {
  const { limit = 120 } = options;
  if (!isSupabaseConfigured) {
    return fallbackRecruiterApplications.map((application, index) => ({
      id: `candidate-${index + 1}`,
      full_name: application.candidate_name,
      email: application.candidate_email,
      phone: null,
      headline: "",
      skills_text: "",
      city: "Antananarivo",
      country: "Madagascar",
      current_position: "",
      desired_position: "",
      desired_contract_type: "",
      desired_work_mode: "",
      desired_salary_min: null,
      desired_salary_currency: "MGA",
      profile_completion: 70,
      applications_count: 1,
      latest_application_at: application.created_at,
      latest_status: application.status,
      latest_job_title: application.job_title,
      latest_job_location: application.job_location,
      has_primary_cv: application.has_cv,
      primary_cv: null
    } satisfies ManagedCandidateSummary));
  }

  const applicationRows = await getAccessibleApplicationRows(profile);
  const adminClient = createAdminClient();

  if (!adminClient) {
    return [] as ManagedCandidateSummary[];
  }

  let candidateIds: string[] = [];

  if (profile.role === "admin") {
    const { data } = await adminClient
      .from("profiles")
      .select("id")
      .eq("role", "candidat")
      .order("updated_at", { ascending: false })
      .limit(limit);

    candidateIds = (data ?? []).map((item) => String(item.id));
  } else {
    candidateIds = Array.from(
      new Set(
        applicationRows
          .map((row) => String(row.candidate_id ?? ""))
          .filter(Boolean)
      )
    );
  }

  if (!candidateIds.length) {
    return [] as ManagedCandidateSummary[];
  }

  const [{ data: profileRows }, { data: candidateRows }, { data: documentRows }] = await Promise.all([
    adminClient
      .from("profiles")
      .select("id, full_name, email, phone")
      .in("id", candidateIds),
    adminClient
      .from("candidate_profiles")
      .select(
        "user_id, headline, skills_text, city, country, current_position, desired_position, desired_contract_type, desired_work_mode, desired_salary_min, desired_salary_currency, profile_completion"
      )
      .in("user_id", candidateIds),
    adminClient
      .from("candidate_documents")
      .select("id, candidate_id, bucket_id, storage_path, file_name, mime_type, file_size, is_primary, created_at")
      .in("candidate_id", candidateIds)
      .eq("is_primary", true)
  ]);

  const profileMap = new Map(
    (profileRows ?? []).map((row) => [String(row.id), row])
  );
  const candidateMap = new Map(
    (candidateRows ?? []).map((row) => [String(row.user_id), row])
  );
  const documentMap = new Map<string, CandidateDocumentData>();

  for (const row of documentRows ?? []) {
    const candidateId = String((row as Record<string, unknown>).candidate_id ?? "");

    if (!candidateId || documentMap.has(candidateId)) {
      continue;
    }

    documentMap.set(candidateId, mapCandidateDocumentRecord(row as Record<string, unknown>));
  }

  const applicationMap = new Map<string, ApplicationAccessRow[]>();

  for (const row of applicationRows) {
    const candidateId = String(row.candidate_id ?? "");

    if (!candidateId) {
      continue;
    }

    const existing = applicationMap.get(candidateId) ?? [];
    existing.push(row);
    applicationMap.set(candidateId, existing);
  }

  const summaries = candidateIds.map((candidateId) => {
    const profileRow = profileMap.get(candidateId);
    const candidateRow = candidateMap.get(candidateId);
    const primaryCv = documentMap.get(candidateId) ?? null;
    const candidateApplications = applicationMap.get(candidateId) ?? [];
    const latestApplication = candidateApplications[0];
    const latestJob = latestApplication ? normalizeJobRelation(latestApplication.job_posts) : null;

    return {
      id: candidateId,
      full_name: String(profileRow?.full_name ?? profileRow?.email ?? "Candidat Madajob"),
      email: profileRow?.email ?? null,
      phone: profileRow?.phone ?? null,
      headline: String(candidateRow?.headline ?? ""),
      skills_text: String(candidateRow?.skills_text ?? ""),
      city: String(candidateRow?.city ?? ""),
      country: String(candidateRow?.country ?? "Madagascar"),
      current_position: String(candidateRow?.current_position ?? ""),
      desired_position: String(candidateRow?.desired_position ?? ""),
      desired_contract_type: String(candidateRow?.desired_contract_type ?? ""),
      desired_work_mode: String(candidateRow?.desired_work_mode ?? ""),
      desired_salary_min: getNumericRecordValue(candidateRow, "desired_salary_min"),
      desired_salary_currency: String(candidateRow?.desired_salary_currency ?? "MGA"),
      profile_completion:
        typeof candidateRow?.profile_completion === "number"
          ? candidateRow.profile_completion
          : 0,
      applications_count: candidateApplications.length,
      latest_application_at: latestApplication?.created_at ?? null,
      latest_status: latestApplication?.status ?? null,
      latest_job_title: latestJob ? String(latestJob.title ?? "") : null,
      latest_job_location: latestJob ? String(latestJob.location ?? "") : null,
      has_primary_cv: Boolean(primaryCv),
      primary_cv: primaryCv
    } satisfies ManagedCandidateSummary;
  });

  summaries.sort((left, right) => {
    const leftDate = left.latest_application_at ? new Date(left.latest_application_at).getTime() : 0;
    const rightDate = right.latest_application_at ? new Date(right.latest_application_at).getTime() : 0;
    return rightDate - leftDate;
  });

  return summaries;
}

export async function getManagedCandidateDetail(profile: Profile, candidateId: string) {
  const summaries = await getManagedCandidates(profile);
  const summary = summaries.find((item) => item.id === candidateId);

  if (!summary) {
    return null;
  }

  if (!isSupabaseConfigured) {
    return {
      ...summary,
      bio: "",
      experience_years: null,
      skills_text: "",
      cv_text: "",
      primary_cv_download_url: null,
      pipeline_summary: {
        submitted: 0,
        screening: 0,
        shortlist: 0,
        interview: 0,
        hired: 0,
        rejected: 0,
        active: 0,
        final: 0
      },
      applications: [],
      recent_interviews: [],
      next_interview: null,
      latest_feedback: null,
      recent_notes: []
    } satisfies CandidateDetail;
  }

  const adminClient = createAdminClient();

  if (!adminClient) {
    return null;
  }

  const [{ data: candidateRow }, applicationRows] = await Promise.all([
    adminClient
      .from("candidate_profiles")
      .select(
        "bio, experience_years, skills_text, cv_text, headline, city, country, current_position, desired_position, desired_contract_type, desired_work_mode, desired_salary_min, desired_salary_currency, profile_completion"
      )
      .eq("user_id", candidateId)
      .maybeSingle(),
    getAccessibleApplicationRows(profile)
  ]);

  const candidateApplications = applicationRows.filter(
    (row) => String(row.candidate_id ?? "") === candidateId
  );

  const organizationIds = Array.from(
    new Set(
      candidateApplications
        .map((row) => String(normalizeJobRelation(row.job_posts)?.organization_id ?? ""))
        .filter(Boolean)
    )
  );

  const applicationIds = candidateApplications.map((row) => String(row.id));

  const [{ data: organizations }, { data: noteRows }, { data: interviewRows }] = await Promise.all([
    organizationIds.length
      ? adminClient
          .from("organizations")
          .select("id, name")
          .in("id", organizationIds)
      : Promise.resolve({ data: [] }),
    applicationIds.length
      ? adminClient
          .from("internal_notes")
          .select("id, application_id, body, created_at, author:profiles(full_name, email)")
          .in("application_id", applicationIds)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
    applicationIds.length
      ? adminClient
          .from("application_interviews")
          .select(
            "id, application_id, status, format, starts_at, ends_at, timezone, location, meeting_url, notes, interviewer_name, interviewer_email, created_at, updated_at, feedback:application_interview_feedback(id, interview_id, application_id, summary, strengths, concerns, recommendation, proposed_decision, next_action, created_at, updated_at, author:profiles!application_interview_feedback_author_id_fkey(full_name, email))"
          )
          .in("application_id", applicationIds)
          .order("starts_at", { ascending: false })
      : Promise.resolve({ data: [] })
  ]);

  const organizationMap = new Map(
    (organizations ?? []).map((row) => [String(row.id), String(row.name ?? "Madajob")])
  );

  const notes = (noteRows ?? []).map((item: Record<string, unknown>) => {
    const author =
      (item.author as { full_name?: string | null; email?: string | null } | null) ?? null;

    return {
      id: String(item.id),
      application_id: String(item.application_id),
      body: String(item.body ?? ""),
      created_at: String(item.created_at ?? ""),
      author_name: author?.full_name || author?.email || "Equipe Madajob",
      author_email: author?.email ?? null
    } satisfies InternalApplicationNote;
  });

  const notesCountMap = new Map<string, number>();
  for (const note of notes) {
    notesCountMap.set(note.application_id, (notesCountMap.get(note.application_id) ?? 0) + 1);
  }
  const applicationInterviewSignalMap = buildCandidateApplicationInterviewSignalMap(
    (interviewRows ?? []) as Record<string, unknown>[]
  );

  const primaryCvDownloadUrl = await createSignedUrlForDocument(adminClient, summary.primary_cv);
  const pipelineSummary = candidateApplications.reduce<CandidatePipelineSummary>(
    (accumulator, row) => {
      const status = String(row.status ?? "submitted");

      if (
        status === "submitted" ||
        status === "screening" ||
        status === "shortlist" ||
        status === "interview" ||
        status === "hired" ||
        status === "rejected"
      ) {
        accumulator[status] += 1;
      }

      if (status === "hired" || status === "rejected") {
        accumulator.final += 1;
      } else {
        accumulator.active += 1;
      }

      return accumulator;
    },
    {
      submitted: 0,
      screening: 0,
      shortlist: 0,
      interview: 0,
      hired: 0,
      rejected: 0,
      active: 0,
      final: 0
    }
  );

  const applications = candidateApplications.map((row) => {
    const job = normalizeJobRelation(row.job_posts);
    const organizationId = String(job?.organization_id ?? "");

    return {
      id: String(row.id),
      status: String(row.status ?? "submitted"),
      created_at: String(row.created_at ?? ""),
      updated_at: String(row.updated_at ?? row.created_at ?? ""),
      cover_letter: typeof row.cover_letter === "string" ? row.cover_letter : null,
      has_cv: Boolean(row.cv_document_id),
      job_id: String(job?.id ?? ""),
      job_title: String(job?.title ?? "Offre Madajob"),
      job_slug: String(job?.slug ?? ""),
      job_location: String(job?.location ?? ""),
      contract_type: String(job?.contract_type ?? ""),
      work_mode: String(job?.work_mode ?? ""),
      sector: String(job?.sector ?? ""),
      organization_name: organizationMap.get(organizationId) ?? "Madajob",
      notes_count: notesCountMap.get(String(row.id)) ?? 0,
      interview_signal:
        applicationInterviewSignalMap.get(String(row.id)) ?? createEmptyCandidateApplicationInterviewSignal()
    } satisfies CandidateApplicationSummary;
  });

  const applicationMap = new Map(candidateApplications.map((row) => [String(row.id), row]));
  const recentInterviews = (interviewRows ?? [])
    .map((item: Record<string, unknown>) => {
      const interview = mapApplicationInterviewRecord(item);
      const applicationRow = applicationMap.get(interview.application_id);
      const job = normalizeJobRelation(applicationRow?.job_posts ?? null);
      const organizationId = String(job?.organization_id ?? "");

      return {
        ...interview,
        job_title: String(job?.title ?? "Offre Madajob"),
        organization_name: organizationMap.get(organizationId) ?? "Madajob",
        application_status: String(applicationRow?.status ?? "submitted")
      } satisfies CandidateInterviewInsight;
    })
    .sort((left, right) => new Date(right.starts_at).getTime() - new Date(left.starts_at).getTime());

  const nextInterview =
    recentInterviews
      .filter(
        (interview) =>
          interview.status === "scheduled" && new Date(interview.starts_at).getTime() >= Date.now()
      )
      .sort((left, right) => new Date(left.starts_at).getTime() - new Date(right.starts_at).getTime())[0] ??
    null;

  const latestFeedback =
    recentInterviews
      .filter((interview) => Boolean(interview.feedback))
      .sort((left, right) => {
        const leftTime = new Date(left.feedback?.updated_at ?? left.updated_at).getTime();
        const rightTime = new Date(right.feedback?.updated_at ?? right.updated_at).getTime();
        return rightTime - leftTime;
      })[0]?.feedback ?? null;

  return {
    id: summary.id,
    full_name: summary.full_name,
    email: summary.email,
    phone: summary.phone,
    headline: String(candidateRow?.headline ?? summary.headline),
    city: String(candidateRow?.city ?? summary.city),
    country: String(candidateRow?.country ?? summary.country),
    bio: String(candidateRow?.bio ?? ""),
    experience_years:
      typeof candidateRow?.experience_years === "number"
        ? candidateRow.experience_years
        : null,
    current_position: String(candidateRow?.current_position ?? summary.current_position),
    desired_position: String(candidateRow?.desired_position ?? summary.desired_position),
    desired_contract_type: String(candidateRow?.desired_contract_type ?? summary.desired_contract_type),
    desired_work_mode: String(candidateRow?.desired_work_mode ?? summary.desired_work_mode),
    desired_salary_min:
      getNumericRecordValue(candidateRow, "desired_salary_min") ?? summary.desired_salary_min,
    desired_salary_currency: String(
      candidateRow?.desired_salary_currency ?? summary.desired_salary_currency
    ),
    skills_text: String(candidateRow?.skills_text ?? ""),
    cv_text: String(candidateRow?.cv_text ?? ""),
    profile_completion:
      typeof candidateRow?.profile_completion === "number"
        ? candidateRow.profile_completion
        : summary.profile_completion,
    primary_cv: summary.primary_cv,
    primary_cv_download_url: primaryCvDownloadUrl,
    pipeline_summary: pipelineSummary,
    applications,
    recent_interviews: recentInterviews.slice(0, 6),
    next_interview: nextInterview,
    latest_feedback: latestFeedback,
    recent_notes: notes.slice(0, 8)
  } satisfies CandidateDetail;
}

export async function getRecruiterApplications(
  profile: Profile,
  options: { limit?: number } = {}
) {
  const { limit = 8 } = options;
  if (!isSupabaseConfigured) {
    return fallbackRecruiterApplications;
  }

  if (!profile.organization_id) {
    return [] as RecruiterApplication[];
  }

  const supabase = await createClient();
  let query = supabase
    .from("applications")
    .select(
      `
      id,
      status,
      created_at,
      updated_at,
      candidate_id,
      job_post_id,
      cv_document_id,
      cover_letter,
      candidate:profiles!applications_candidate_id_fkey(full_name, email),
      job_posts!inner(title, location, organization_id)
    `
    )
    .eq("job_posts.organization_id", profile.organization_id)
    .order("created_at", { ascending: false });

  if (typeof limit === "number") {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error || !data) {
    return [] as RecruiterApplication[];
  }

  const applicationIds = data.map((item) => String(item.id ?? "")).filter(Boolean);
  let interviewRows: Record<string, unknown>[] = [];

  if (applicationIds.length) {
    const { data: fetchedInterviewRows } = await supabase
      .from("application_interviews")
      .select(
        "id, application_id, status, format, starts_at, ends_at, timezone, location, meeting_url, notes, interviewer_name, interviewer_email, created_at, updated_at, feedback:application_interview_feedback(id, interview_id, application_id, summary, strengths, concerns, recommendation, proposed_decision, next_action, created_at, updated_at, author:profiles!application_interview_feedback_author_id_fkey(full_name, email))"
      )
      .in("application_id", applicationIds);

    interviewRows = (fetchedInterviewRows ?? []) as Record<string, unknown>[];
  }

  const interviewSignalMap = buildRecruiterApplicationInterviewSignalMap(interviewRows);

  return data.map((item: Record<string, unknown>) => {
    const candidate = (item.candidate as { full_name?: string | null; email?: string | null } | null) ?? null;
    const job = (item.job_posts as { title?: string | null; location?: string | null } | null) ?? null;
    const applicationId = String(item.id);

    return {
      id: applicationId,
      status: String(item.status ?? "submitted"),
      created_at: String(item.created_at ?? ""),
      updated_at: typeof item.updated_at === "string" ? item.updated_at : null,
      candidate_id: typeof item.candidate_id === "string" ? item.candidate_id : null,
      job_id: typeof item.job_post_id === "string" ? item.job_post_id : null,
      cover_letter: typeof item.cover_letter === "string" ? item.cover_letter : null,
      has_cv: Boolean(item.cv_document_id),
      candidate_name: candidate?.full_name || candidate?.email || "Candidat Madajob",
      candidate_email: candidate?.email || "email non renseigne",
      job_title: job?.title || "Offre Madajob",
      job_location: job?.location || "Lieu a definir",
      interview_signal:
        interviewSignalMap.get(applicationId) ?? createEmptyRecruiterApplicationInterviewSignal()
    } satisfies RecruiterApplication;
  });
}

export async function getAdminApplications(options: { limit?: number } = {}) {
  const { limit = 8 } = options;
  if (!isSupabaseConfigured) {
    return fallbackRecruiterApplications;
  }

  const supabase = await createClient();
  let query = supabase
    .from("applications")
    .select(
      `
      id,
      status,
      created_at,
      updated_at,
      candidate_id,
      job_post_id,
      cv_document_id,
      cover_letter,
      candidate:profiles!applications_candidate_id_fkey(full_name, email),
      job_posts(title, location)
    `
    )
    .order("created_at", { ascending: false });

  if (typeof limit === "number") {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error || !data) {
    return fallbackRecruiterApplications;
  }

  const applicationIds = data.map((item) => String(item.id ?? "")).filter(Boolean);
  let interviewRows: Record<string, unknown>[] = [];

  if (applicationIds.length) {
    const { data: fetchedInterviewRows } = await supabase
      .from("application_interviews")
      .select(
        "id, application_id, status, format, starts_at, ends_at, timezone, location, meeting_url, notes, interviewer_name, interviewer_email, created_at, updated_at, feedback:application_interview_feedback(id, interview_id, application_id, summary, strengths, concerns, recommendation, proposed_decision, next_action, created_at, updated_at, author:profiles!application_interview_feedback_author_id_fkey(full_name, email))"
      )
      .in("application_id", applicationIds);

    interviewRows = (fetchedInterviewRows ?? []) as Record<string, unknown>[];
  }

  const interviewSignalMap = buildRecruiterApplicationInterviewSignalMap(interviewRows);

  return data.map((item: Record<string, unknown>) => {
    const candidate = (item.candidate as { full_name?: string | null; email?: string | null } | null) ?? null;
    const job = (item.job_posts as { title?: string | null; location?: string | null } | null) ?? null;
    const applicationId = String(item.id);

    return {
      id: applicationId,
      status: String(item.status ?? "submitted"),
      created_at: String(item.created_at ?? ""),
      updated_at: typeof item.updated_at === "string" ? item.updated_at : null,
      candidate_id: typeof item.candidate_id === "string" ? item.candidate_id : null,
      job_id: typeof item.job_post_id === "string" ? item.job_post_id : null,
      cover_letter: typeof item.cover_letter === "string" ? item.cover_letter : null,
      has_cv: Boolean(item.cv_document_id),
      candidate_name: candidate?.full_name || candidate?.email || "Candidat Madajob",
      candidate_email: candidate?.email || "email non renseigne",
      job_title: job?.title || "Offre Madajob",
      job_location: job?.location || "Lieu a definir",
      interview_signal:
        interviewSignalMap.get(applicationId) ?? createEmptyRecruiterApplicationInterviewSignal()
    } satisfies RecruiterApplication;
  });
}

type InterviewContextApplicationRow = {
  id?: string | null;
  status?: string | null;
  candidate_id?: string | null;
  candidate?: { full_name?: string | null; email?: string | null } | null;
  job_posts?: Record<string, unknown> | Array<Record<string, unknown>> | null;
};

function normalizeSingleRelation<T>(relation: T | T[] | null | undefined): T | null {
  if (!relation) {
    return null;
  }

  return Array.isArray(relation) ? relation[0] ?? null : relation;
}

function buildInterviewScheduleItems(
  interviewRows: Record<string, unknown>[],
  applicationRows: InterviewContextApplicationRow[],
  schedulerMap: Map<string, { full_name?: string | null; email?: string | null }>
): InterviewScheduleItem[] {
  const applicationMap = new Map(applicationRows.map((row) => [String(row.id ?? ""), row]));

  const items: InterviewScheduleItem[] = [];

  for (const row of interviewRows) {
    const application = applicationMap.get(String(row.application_id ?? ""));

    if (!application) {
      continue;
    }

    const job = normalizeSingleRelation(application.job_posts) as Record<string, unknown> | null;
    const organization = normalizeSingleRelation(
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

export async function getRecruiterInterviews(
  profile: Profile,
  options: { limit?: number } = {}
): Promise<InterviewScheduleItem[]> {
  const { limit = 50 } = options;

  if (!isSupabaseConfigured) {
    return fallbackInterviews;
  }

  if (!profile.organization_id) {
    return [] as InterviewScheduleItem[];
  }

  const supabase = await createClient();
  let interviewsQuery = supabase
    .from("application_interviews")
    .select(
      "id, application_id, scheduled_by, status, format, starts_at, ends_at, timezone, location, meeting_url, notes, interviewer_name, interviewer_email, created_at, updated_at, feedback:application_interview_feedback(id, interview_id, application_id, summary, strengths, concerns, recommendation, proposed_decision, next_action, created_at, updated_at, author:profiles!application_interview_feedback_author_id_fkey(full_name, email))"
    )
    .order("starts_at", { ascending: true });

  if (typeof limit === "number") {
    interviewsQuery = interviewsQuery.limit(limit);
  }

  const { data: interviewRows, error: interviewError } = await interviewsQuery;

  if (interviewError || !interviewRows?.length) {
    return [] as InterviewScheduleItem[];
  }

  const applicationIds = Array.from(new Set(interviewRows.map((row) => String(row.application_id ?? "")).filter(Boolean)));
  const schedulerIds = Array.from(new Set(interviewRows.map((row) => String(row.scheduled_by ?? "")).filter(Boolean)));

  const [{ data: applicationRows, error: applicationError }, { data: schedulerRows }] = await Promise.all([
    supabase
      .from("applications")
      .select(
        `
        id,
        status,
        candidate_id,
        candidate:profiles!applications_candidate_id_fkey(full_name, email),
        job_posts!inner(
          id,
          title,
          location,
          organization_id,
          organization:organizations(name)
        )
      `
      )
      .in("id", applicationIds)
      .eq("job_posts.organization_id", profile.organization_id),
    schedulerIds.length
      ? supabase.from("profiles").select("id, full_name, email").in("id", schedulerIds)
      : Promise.resolve({ data: [] as Array<Record<string, unknown>> })
  ]);

  if (applicationError || !applicationRows?.length) {
    return [] as InterviewScheduleItem[];
  }

  const schedulerMap = new Map(
    (schedulerRows ?? []).map((row: Record<string, unknown>) => [
      String(row.id),
      {
        full_name: typeof row.full_name === "string" ? row.full_name : null,
        email: typeof row.email === "string" ? row.email : null
      }
    ])
  );

  return buildInterviewScheduleItems(
    interviewRows as Record<string, unknown>[],
    applicationRows as InterviewContextApplicationRow[],
    schedulerMap
  );
}

export async function getAdminInterviews(options: { limit?: number } = {}): Promise<InterviewScheduleItem[]> {
  const { limit = 80 } = options;

  if (!isSupabaseConfigured) {
    return fallbackInterviews;
  }

  const supabase = await createClient();
  let interviewsQuery = supabase
    .from("application_interviews")
    .select(
      "id, application_id, scheduled_by, status, format, starts_at, ends_at, timezone, location, meeting_url, notes, interviewer_name, interviewer_email, created_at, updated_at, feedback:application_interview_feedback(id, interview_id, application_id, summary, strengths, concerns, recommendation, proposed_decision, next_action, created_at, updated_at, author:profiles!application_interview_feedback_author_id_fkey(full_name, email))"
    )
    .order("starts_at", { ascending: true });

  if (typeof limit === "number") {
    interviewsQuery = interviewsQuery.limit(limit);
  }

  const { data: interviewRows, error: interviewError } = await interviewsQuery;

  if (interviewError || !interviewRows?.length) {
    return [] as InterviewScheduleItem[];
  }

  const applicationIds = Array.from(new Set(interviewRows.map((row) => String(row.application_id ?? "")).filter(Boolean)));
  const schedulerIds = Array.from(new Set(interviewRows.map((row) => String(row.scheduled_by ?? "")).filter(Boolean)));

  const [{ data: applicationRows, error: applicationError }, { data: schedulerRows }] = await Promise.all([
    supabase
      .from("applications")
      .select(
        `
        id,
        status,
        candidate_id,
        candidate:profiles!applications_candidate_id_fkey(full_name, email),
        job_posts(
          id,
          title,
          location,
          organization_id,
          organization:organizations(name)
        )
      `
      )
      .in("id", applicationIds),
    schedulerIds.length
      ? supabase.from("profiles").select("id, full_name, email").in("id", schedulerIds)
      : Promise.resolve({ data: [] as Array<Record<string, unknown>> })
  ]);

  if (applicationError || !applicationRows?.length) {
    return [] as InterviewScheduleItem[];
  }

  const schedulerMap = new Map(
    (schedulerRows ?? []).map((row: Record<string, unknown>) => [
      String(row.id),
      {
        full_name: typeof row.full_name === "string" ? row.full_name : null,
        email: typeof row.email === "string" ? row.email : null
      }
    ])
  );

  return buildInterviewScheduleItems(
    interviewRows as Record<string, unknown>[],
    applicationRows as InterviewContextApplicationRow[],
    schedulerMap
  );
}

export async function getAdminOrganizations() {
  if (!isSupabaseConfigured) {
    return [
      {
        id: "org-madajob",
        name: "Madajob",
        slug: "madajob",
        kind: "internal",
        is_active: true
      },
      {
        id: "org-nvidia",
        name: "Nvidia",
        slug: "nvidia",
        kind: "client",
        is_active: true
      }
    ] satisfies OrganizationOption[];
  }

  const adminClient = createAdminClient();

  if (!adminClient) {
    return [] as OrganizationOption[];
  }

  const { data } = await adminClient
    .from("organizations")
    .select("id, name, slug, kind, is_active")
    .order("name", { ascending: true });

  return (data ?? []).map((row) => ({
    id: String(row.id),
    name: String(row.name ?? "Organisation"),
    slug: String(row.slug ?? ""),
    kind: String(row.kind ?? "client"),
    is_active: Boolean(row.is_active)
  })) satisfies OrganizationOption[];
}

export async function getManagedOrganizations() {
  const organizations = await getAdminOrganizations();

  if (!organizations.length) {
    return [] as ManagedOrganizationSummary[];
  }

  if (!isSupabaseConfigured) {
    return organizations.map((organization, index) => ({
      ...organization,
      members_count: index === 0 ? 2 : 0,
      recruiters_count: index === 0 ? 1 : 0,
      active_jobs_count: index === 0 ? fallbackJobs.filter((job) => job.status === "published").length : 0,
      applications_count: index === 0 ? fallbackRecruiterApplications.length : 0,
      shortlist_count:
        index === 0
          ? fallbackRecruiterApplications.filter((application) =>
              ["shortlist", "interview", "hired"].includes(application.status)
            ).length
          : 0,
      latest_job_at: fallbackJobs[0]?.published_at ?? null,
      latest_application_at: fallbackRecruiterApplications[0]?.created_at ?? null
    })) satisfies ManagedOrganizationSummary[];
  }

  const adminClient = createAdminClient();

  if (!adminClient) {
    return [] as ManagedOrganizationSummary[];
  }

  const [{ data: profileRows }, { data: jobRows }, { data: applicationRows }] = await Promise.all([
    adminClient
      .from("profiles")
      .select("id, role, organization_id")
      .not("organization_id", "is", null)
      .limit(1000),
    adminClient
      .from("job_posts")
      .select("id, organization_id, status, created_at")
      .limit(1000),
    adminClient
      .from("applications")
      .select(
        `
        id,
        status,
        created_at,
        job_posts!inner(organization_id)
      `
      )
      .limit(2000)
  ]);

  const statsByOrganizationId = new Map<
    string,
    {
      members_count: number;
      recruiters_count: number;
      active_jobs_count: number;
      applications_count: number;
      shortlist_count: number;
      latest_job_at: string | null;
      latest_application_at: string | null;
    }
  >();

  for (const organization of organizations) {
    statsByOrganizationId.set(organization.id, {
      members_count: 0,
      recruiters_count: 0,
      active_jobs_count: 0,
      applications_count: 0,
      shortlist_count: 0,
      latest_job_at: null,
      latest_application_at: null
    });
  }

  for (const row of profileRows ?? []) {
    const organizationId = typeof row.organization_id === "string" ? row.organization_id : "";
    const stats = statsByOrganizationId.get(organizationId);

    if (!stats) {
      continue;
    }

    stats.members_count += 1;

    if (row.role === "recruteur") {
      stats.recruiters_count += 1;
    }
  }

  for (const row of jobRows ?? []) {
    const organizationId = typeof row.organization_id === "string" ? row.organization_id : "";
    const stats = statsByOrganizationId.get(organizationId);

    if (!stats) {
      continue;
    }

    if (row.status === "published") {
      stats.active_jobs_count += 1;
    }

    const createdAt = typeof row.created_at === "string" ? row.created_at : null;
    if (
      createdAt &&
      (!stats.latest_job_at ||
        new Date(createdAt).getTime() > new Date(stats.latest_job_at).getTime())
    ) {
      stats.latest_job_at = createdAt;
    }
  }

  for (const row of applicationRows ?? []) {
    const job = normalizeJobRelation(
      (row as Record<string, unknown>).job_posts as ApplicationAccessRow["job_posts"]
    );
    const organizationId = String(job?.organization_id ?? "");
    const stats = statsByOrganizationId.get(organizationId);

    if (!stats) {
      continue;
    }

    stats.applications_count += 1;

    if (["shortlist", "interview", "hired"].includes(String(row.status ?? ""))) {
      stats.shortlist_count += 1;
    }

    const createdAt = typeof row.created_at === "string" ? row.created_at : null;
    if (
      createdAt &&
      (!stats.latest_application_at ||
        new Date(createdAt).getTime() > new Date(stats.latest_application_at).getTime())
    ) {
      stats.latest_application_at = createdAt;
    }
  }

  return organizations.map((organization) => ({
    ...organization,
    ...(statsByOrganizationId.get(organization.id) ?? {
      members_count: 0,
      recruiters_count: 0,
      active_jobs_count: 0,
      applications_count: 0,
      shortlist_count: 0,
      latest_job_at: null,
      latest_application_at: null
    })
  })) satisfies ManagedOrganizationSummary[];
}

export async function getAdminOrganizationDetail(organizationId: string) {
  const organizations = await getManagedOrganizations();
  const organization = organizations.find((item) => item.id === organizationId);

  if (!organization) {
    return null;
  }

  const [users, adminClient] = await Promise.all([getAdminUsers(), Promise.resolve(createAdminClient())]);

  if (!isSupabaseConfigured || !adminClient) {
    return {
      ...organization,
      members: users.filter((user) => user.organization_id === organizationId),
      recent_jobs: [],
      recent_applications: []
    } satisfies ManagedOrganizationDetail;
  }

  const [{ data: jobsRows }, { data: applicationRows }] = await Promise.all([
    adminClient
      .from("job_posts")
      .select(
        "id, title, slug, department, location, contract_type, work_mode, sector, summary, responsibilities, requirements, benefits, salary_min, salary_max, salary_currency, salary_period, salary_is_visible, status, is_featured, published_at, closing_at, created_at, updated_at"
      )
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(8),
    adminClient
      .from("applications")
      .select(
        `
        id,
        status,
        created_at,
        updated_at,
        candidate_id,
        job_post_id,
        cv_document_id,
        cover_letter,
        candidate:profiles!applications_candidate_id_fkey(full_name, email),
        job_posts!inner(title, location, organization_id)
      `
      )
      .eq("job_posts.organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(8)
  ]);

  const jobRowsList = (jobsRows ?? []) as Array<Record<string, unknown>>;
  const countsByJobId = await getApplicationCountsByJobIds(
    jobRowsList.map((row) => String(row.id ?? "")).filter(Boolean)
  );
  const recentJobs = buildManagedJobs(jobRowsList, countsByJobId).map((job) => ({
    ...job,
    organization_name: organization.name
  })) satisfies ManagedJob[];

  const recentApplications = ((applicationRows ?? []) as Array<Record<string, unknown>>).map((item) => {
    const candidate =
      (item.candidate as { full_name?: string | null; email?: string | null } | null) ?? null;
    const job =
      (item.job_posts as { title?: string | null; location?: string | null } | null) ?? null;

    return {
      id: String(item.id),
      status: String(item.status ?? "submitted"),
      created_at: String(item.created_at ?? ""),
      updated_at: typeof item.updated_at === "string" ? item.updated_at : null,
      candidate_id: typeof item.candidate_id === "string" ? item.candidate_id : null,
      job_id: typeof item.job_post_id === "string" ? item.job_post_id : null,
      cover_letter: typeof item.cover_letter === "string" ? item.cover_letter : null,
      has_cv: Boolean(item.cv_document_id),
      candidate_name: candidate?.full_name || candidate?.email || "Candidat Madajob",
      candidate_email: candidate?.email || "email non renseigne",
      job_title: job?.title || "Offre Madajob",
      job_location: job?.location || "Lieu a definir",
      interview_signal: createEmptyRecruiterApplicationInterviewSignal()
    } satisfies RecruiterApplication;
  });

  return {
    ...organization,
    members: users.filter((user) => user.organization_id === organizationId),
    recent_jobs: recentJobs,
    recent_applications: recentApplications
  } satisfies ManagedOrganizationDetail;
}

function getAuditEntityFallbackLabel(entityType: string, entityId: string) {
  if (entityType === "profile") {
    return "Utilisateur";
  }

  if (entityType === "job_post") {
    return "Offre";
  }

  if (entityType === "organization") {
    return "Organisation";
  }

  return entityId ? `${entityType}:${entityId.slice(0, 8)}` : entityType;
}

function getAuditEntityHref(entityType: string, entityId: string) {
  if (!entityId) {
    return null;
  }

  if (entityType === "profile") {
    return `/app/admin/utilisateurs/${entityId}`;
  }

  if (entityType === "job_post") {
    return `/app/admin/offres/${entityId}`;
  }

  if (entityType === "organization") {
    return `/app/admin/organisations/${entityId}`;
  }

  return null;
}

export async function getAdminAuditEvents(options: { limit?: number } = {}) {
  const { limit = 250 } = options;

  if (!isSupabaseConfigured) {
    return [
      {
        id: "audit-1",
        action: "profile_access_updated",
        entity_type: "profile",
        entity_id: "user-recruiter",
        metadata: {
          previous_role: "recruteur",
          next_role: "admin"
        },
        created_at: "2026-04-21T09:30:00.000Z",
        actor_name: "Admin Madajob",
        actor_email: "admin@madajob.mg",
        entity_label: "Recruteur Madajob",
        entity_href: "/app/admin/utilisateurs/user-recruiter"
      },
      {
        id: "audit-2",
        action: "job_status_changed",
        entity_type: "job_post",
        entity_id: "job-1",
        metadata: {
          from_status: "draft",
          to_status: "published"
        },
        created_at: "2026-04-20T15:10:00.000Z",
        actor_name: "Admin Madajob",
        actor_email: "admin@madajob.mg",
        entity_label: "Responsable recrutement multi-sites",
        entity_href: "/app/admin/offres/job-1"
      },
      {
        id: "audit-3",
        action: "organization_updated",
        entity_type: "organization",
        entity_id: "org-madajob",
        metadata: {
          previous_is_active: true,
          next_is_active: true
        },
        created_at: "2026-04-19T11:00:00.000Z",
        actor_name: "Admin Madajob",
        actor_email: "admin@madajob.mg",
        entity_label: "Madajob",
        entity_href: "/app/admin/organisations/org-madajob"
      }
    ] satisfies AdminAuditEvent[];
  }

  const adminClient = createAdminClient();

  if (!adminClient) {
    return [] as AdminAuditEvent[];
  }

  const { data, error } = await adminClient
    .from("audit_events")
    .select(
      "id, action, entity_type, entity_id, metadata, created_at, actor:profiles(full_name, email)"
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) {
    return [] as AdminAuditEvent[];
  }

  const rawEvents = data.map((item: Record<string, unknown>) => ({
    id: String(item.id ?? ""),
    action: String(item.action ?? ""),
    entity_type: String(item.entity_type ?? ""),
    entity_id: String(item.entity_id ?? ""),
    metadata:
      typeof item.metadata === "object" && item.metadata !== null
        ? (item.metadata as Record<string, unknown>)
        : {},
    created_at: String(item.created_at ?? ""),
    actor:
      (item.actor as { full_name?: string | null; email?: string | null } | null) ?? null
  }));

  const profileIds = Array.from(
    new Set(
      rawEvents
        .filter((event) => event.entity_type === "profile")
        .map((event) => event.entity_id)
        .filter(Boolean)
    )
  );
  const jobIds = Array.from(
    new Set(
      rawEvents
        .filter((event) => event.entity_type === "job_post")
        .map((event) => event.entity_id)
        .filter(Boolean)
    )
  );
  const organizationIds = Array.from(
    new Set(
      rawEvents
        .filter((event) => event.entity_type === "organization")
        .map((event) => event.entity_id)
        .filter(Boolean)
    )
  );

  const [{ data: profileRows }, { data: jobRows }, { data: organizationRows }] = await Promise.all([
    profileIds.length
      ? adminClient
          .from("profiles")
          .select("id, full_name, email")
          .in("id", profileIds)
      : Promise.resolve({ data: [] }),
    jobIds.length
      ? adminClient
          .from("job_posts")
          .select("id, title")
          .in("id", jobIds)
      : Promise.resolve({ data: [] }),
    organizationIds.length
      ? adminClient
          .from("organizations")
          .select("id, name")
          .in("id", organizationIds)
      : Promise.resolve({ data: [] })
  ]);

  const profileMap = new Map(
    (profileRows ?? []).map((row) => [
      String(row.id ?? ""),
      String(row.full_name ?? row.email ?? "Utilisateur")
    ])
  );
  const jobMap = new Map(
    (jobRows ?? []).map((row) => [String(row.id ?? ""), String(row.title ?? "Offre")])
  );
  const organizationMap = new Map(
    (organizationRows ?? []).map((row) => [String(row.id ?? ""), String(row.name ?? "Organisation")])
  );

  return rawEvents.map((event) => {
    let entityLabel = getAuditEntityFallbackLabel(event.entity_type, event.entity_id);

    if (event.entity_type === "profile") {
      entityLabel =
        profileMap.get(event.entity_id) ||
        String(event.metadata.invited_email ?? entityLabel);
    } else if (event.entity_type === "job_post") {
      entityLabel = jobMap.get(event.entity_id) || String(event.metadata.title ?? entityLabel);
    } else if (event.entity_type === "organization") {
      entityLabel =
        organizationMap.get(event.entity_id) ||
        String(event.metadata.next_name ?? event.metadata.previous_name ?? entityLabel);
    }

    return {
      id: event.id,
      action: event.action,
      entity_type: event.entity_type,
      entity_id: event.entity_id,
      metadata: event.metadata,
      created_at: event.created_at,
      actor_name: event.actor?.full_name || event.actor?.email || "Equipe Madajob",
      actor_email: event.actor?.email ?? null,
      entity_label: entityLabel,
      entity_href: getAuditEntityHref(event.entity_type, event.entity_id)
    } satisfies AdminAuditEvent;
  });
}

export async function getAdminUsers() {
  if (!isSupabaseConfigured) {
    return [
      {
        id: "user-admin",
        email: "admin@madajob.mg",
        full_name: "Admin Madajob",
        role: "admin",
        organization_id: "org-madajob",
        organization_name: "Madajob",
        phone: null,
        is_active: true,
        created_at: "2026-04-01T08:00:00.000Z",
        updated_at: "2026-04-20T08:00:00.000Z",
        invitation_sent_at: null,
        last_admin_action_at: null,
        headline: "",
        city: "",
        current_position: "",
        candidate_profile_completion: null,
        applications_count: 0,
        jobs_count: 4
      },
      {
        id: "user-recruiter",
        email: "recruteur@madajob.mg",
        full_name: "Recruteur Madajob",
        role: "recruteur",
        organization_id: "org-madajob",
        organization_name: "Madajob",
        phone: null,
        is_active: true,
        created_at: "2026-04-05T08:00:00.000Z",
        updated_at: "2026-04-20T08:00:00.000Z",
        invitation_sent_at: null,
        last_admin_action_at: null,
        headline: "",
        city: "",
        current_position: "",
        candidate_profile_completion: null,
        applications_count: 0,
        jobs_count: 3
      }
    ] satisfies ManagedUserSummary[];
  }

  const adminClient = createAdminClient();

  if (!adminClient) {
    return [] as ManagedUserSummary[];
  }

  const [
    { data: profileRows },
    organizations,
    { data: candidateRows },
    { data: applicationRows },
    { data: jobRows }
  ] = await Promise.all([
    adminClient
      .from("profiles")
      .select("id, email, full_name, role, organization_id, phone, is_active, created_at, updated_at")
      .order("updated_at", { ascending: false })
      .limit(250),
    getAdminOrganizations(),
    adminClient
      .from("candidate_profiles")
      .select("user_id, headline, city, current_position, profile_completion"),
    adminClient.from("applications").select("id, candidate_id"),
    adminClient.from("job_posts").select("id, created_by")
  ]);
  const profileIds = (profileRows ?? [])
    .map((row) => String(row.id ?? ""))
    .filter(Boolean);
  const { data: profileAuditRows } =
    profileIds.length > 0
      ? await adminClient
          .from("audit_events")
          .select("entity_id, action, created_at")
          .eq("entity_type", "profile")
          .in("entity_id", profileIds)
          .in("action", ["user_invited", "profile_access_updated"])
      : { data: [] as Array<Record<string, unknown>> };

  const organizationMap = new Map(organizations.map((item) => [item.id, item.name]));
  const candidateMap = new Map(
    (candidateRows ?? []).map((row) => [String(row.user_id), row])
  );
  const applicationCountMap = new Map<string, number>();
  const jobsCountMap = new Map<string, number>();
  const invitationMap = new Map<string, string>();
  const adminActionMap = new Map<string, string>();

  for (const row of applicationRows ?? []) {
    const candidateId = String(row.candidate_id ?? "");
    if (!candidateId) continue;
    applicationCountMap.set(candidateId, (applicationCountMap.get(candidateId) ?? 0) + 1);
  }

  for (const row of jobRows ?? []) {
    const ownerId = String(row.created_by ?? "");
    if (!ownerId) continue;
    jobsCountMap.set(ownerId, (jobsCountMap.get(ownerId) ?? 0) + 1);
  }

  for (const row of profileAuditRows ?? []) {
    const entityId = String(row.entity_id ?? "");
    const action = String(row.action ?? "");
    const createdAt = typeof row.created_at === "string" ? row.created_at : null;

    if (!entityId || !createdAt) {
      continue;
    }

    const previousActionDate = adminActionMap.get(entityId);

    if (!previousActionDate || new Date(createdAt).getTime() > new Date(previousActionDate).getTime()) {
      adminActionMap.set(entityId, createdAt);
    }

    if (action !== "user_invited") {
      continue;
    }

    const previousInvitationDate = invitationMap.get(entityId);

    if (
      !previousInvitationDate ||
      new Date(createdAt).getTime() > new Date(previousInvitationDate).getTime()
    ) {
      invitationMap.set(entityId, createdAt);
    }
  }

  return (profileRows ?? []).map((row) => {
    const candidate = candidateMap.get(String(row.id));

    return {
      id: String(row.id),
      email: typeof row.email === "string" ? row.email : null,
      full_name: typeof row.full_name === "string" ? row.full_name : null,
      role: (row.role as Profile["role"]) ?? "candidat",
      organization_id: typeof row.organization_id === "string" ? row.organization_id : null,
      organization_name:
        typeof row.organization_id === "string"
          ? organizationMap.get(row.organization_id) ?? null
          : null,
      phone: typeof row.phone === "string" ? row.phone : null,
      is_active: Boolean(row.is_active),
      created_at: String(row.created_at ?? ""),
      updated_at: String(row.updated_at ?? ""),
      invitation_sent_at: invitationMap.get(String(row.id)) ?? null,
      last_admin_action_at: adminActionMap.get(String(row.id)) ?? null,
      headline: String(candidate?.headline ?? ""),
      city: String(candidate?.city ?? ""),
      current_position: String(candidate?.current_position ?? ""),
      candidate_profile_completion:
        typeof candidate?.profile_completion === "number"
          ? candidate.profile_completion
          : null,
      applications_count: applicationCountMap.get(String(row.id)) ?? 0,
      jobs_count: jobsCountMap.get(String(row.id)) ?? 0
    } satisfies ManagedUserSummary;
  });
}

export async function getAdminUserDetail(userId: string) {
  const users = await getAdminUsers();
  const user = users.find((item) => item.id === userId);

  if (!user) {
    return null;
  }

  if (!isSupabaseConfigured) {
    return {
      ...user,
      desired_position: "",
      country: "Madagascar",
      bio: "",
      skills_text: "",
      recent_applications: [],
      recent_jobs: []
    } satisfies ManagedUserDetail;
  }

  const adminClient = createAdminClient();

  if (!adminClient) {
    return null;
  }

  const [{ data: candidateRow }, { data: applicationRows }, { data: recentJobsRows }] = await Promise.all([
    adminClient
      .from("candidate_profiles")
      .select(
        "headline, city, country, bio, current_position, desired_position, skills_text, profile_completion"
      )
      .eq("user_id", userId)
      .maybeSingle(),
    adminClient
      .from("applications")
      .select(
        `
        id,
        status,
        created_at,
        updated_at,
        cover_letter,
        cv_document_id,
        job_posts(id, title, slug, location, contract_type, work_mode, sector, organization_id)
      `
      )
      .eq("candidate_id", userId)
      .order("created_at", { ascending: false })
      .limit(8),
    adminClient
      .from("job_posts")
      .select(
        "id, title, slug, location, contract_type, work_mode, sector, summary, salary_min, salary_max, salary_currency, salary_period, salary_is_visible, status, is_featured, published_at, created_at, updated_at, closing_at"
      )
      .eq("created_by", userId)
      .order("created_at", { ascending: false })
      .limit(6)
  ]);

  const organizations = await getAdminOrganizations();
  const organizationMap = new Map(organizations.map((item) => [item.id, item.name]));

  const recentApplications = (applicationRows ?? []).map((row: Record<string, unknown>) => {
    const job = normalizeJobRelation(
      row.job_posts as ApplicationAccessRow["job_posts"]
    );
    const organizationId = String(job?.organization_id ?? "");

    return {
      id: String(row.id),
      status: String(row.status ?? "submitted"),
      created_at: String(row.created_at ?? ""),
      updated_at: String(row.updated_at ?? row.created_at ?? ""),
      cover_letter: typeof row.cover_letter === "string" ? row.cover_letter : null,
      has_cv: Boolean(row.cv_document_id),
      job_id: String(job?.id ?? ""),
      job_title: String(job?.title ?? "Offre Madajob"),
      job_slug: String(job?.slug ?? ""),
      job_location: String(job?.location ?? ""),
      contract_type: String(job?.contract_type ?? ""),
      work_mode: String(job?.work_mode ?? ""),
      sector: String(job?.sector ?? ""),
      organization_name: organizationMap.get(organizationId) ?? "Madajob",
      notes_count: 0,
      interview_signal: createEmptyCandidateApplicationInterviewSignal()
    } satisfies CandidateApplicationSummary;
  });

  const recentJobs = (recentJobsRows ?? []).map((row) => ({
    ...mapManagedJobRecord({
      ...row,
      applications_count: 0
    }),
    organization_name:
      typeof user.organization_id === "string"
        ? organizationMap.get(user.organization_id) ?? "Madajob"
        : "Madajob"
  })) satisfies ManagedJob[];

  return {
    ...user,
    headline: String(candidateRow?.headline ?? user.headline),
    city: String(candidateRow?.city ?? user.city),
    current_position: String(candidateRow?.current_position ?? user.current_position),
    candidate_profile_completion:
      typeof candidateRow?.profile_completion === "number"
        ? candidateRow.profile_completion
        : user.candidate_profile_completion,
    desired_position: String(candidateRow?.desired_position ?? ""),
    country: String(candidateRow?.country ?? "Madagascar"),
    bio: String(candidateRow?.bio ?? ""),
    skills_text: String(candidateRow?.skills_text ?? ""),
    recent_applications: recentApplications,
    recent_jobs: recentJobs
  } satisfies ManagedUserDetail;
}

export async function getAdminSnapshot() {
  if (!isSupabaseConfigured) {
    return {
      metrics: {
        candidates: 40000,
        recruiters: 120,
        activeJobs: fallbackJobs.length,
        applications: 856
      },
      recentJobs: fallbackJobs
    };
  }

  const supabase = await createClient();

  const [
    { count: candidatesCount },
    { count: recruitersCount },
    { count: jobsCount },
    { count: applicationsCount },
    { data: recentJobsData }
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "candidat"),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "recruteur"),
    supabase.from("job_posts").select("id", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("applications").select("id", { count: "exact", head: true }),
    supabase
      .from("job_posts")
      .select("id, title, slug, location, contract_type, work_mode, sector, summary, salary_min, salary_max, salary_currency, salary_period, salary_is_visible, status, is_featured, published_at")
      .order("created_at", { ascending: false })
      .limit(5)
  ]);

  return {
    metrics: {
      candidates: candidatesCount ?? 0,
      recruiters: recruitersCount ?? 0,
      activeJobs: jobsCount ?? 0,
      applications: applicationsCount ?? 0
    },
    recentJobs: (recentJobsData ?? []).map((item) => mapJobRecord(item))
  };
}
