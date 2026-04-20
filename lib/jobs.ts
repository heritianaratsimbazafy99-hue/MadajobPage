import { isSupabaseConfigured } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type {
  ApplicationDetail,
  ApplicationStatusHistoryEntry,
  CandidateApplication,
  CandidateDocumentData,
  CandidateProfileData,
  InternalApplicationNote,
  Job,
  JobAuditEvent,
  ManagedJob,
  Profile,
  RecruiterApplication
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
    status: "screening",
    created_at: "2026-04-18T12:30:00.000Z",
    cover_letter: "Disponible rapidement pour un entretien et motive par un environnement B2B exigeant.",
    has_cv: true,
    candidate_name: "Miora Randriam",
    candidate_email: "miora@example.com",
    job_title: "Commercial B2B grands comptes",
    job_location: "Antananarivo"
  },
  {
    id: "recruiter-app-2",
    status: "submitted",
    created_at: "2026-04-17T10:15:00.000Z",
    cover_letter: "Experience confirmee en relation candidat et gestion de dossier.",
    has_cv: false,
    candidate_name: "Hery Ranaivo",
    candidate_email: "hery@example.com",
    job_title: "Charge(e) relation candidat",
    job_location: "Antananarivo"
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
  skills_text: "",
  cv_text: "",
  profile_completion: 0,
  primary_cv: null
};

function mapJobRecord(record: Record<string, unknown>): Job {
  return {
    id: String(record.id),
    title: String(record.title ?? ""),
    slug: String(record.slug ?? ""),
    location: String(record.location ?? ""),
    contract_type: String(record.contract_type ?? ""),
    work_mode: String(record.work_mode ?? ""),
    sector: String(record.sector ?? ""),
    summary: String(record.summary ?? ""),
    status: (record.status as Job["status"]) ?? "draft",
    is_featured: Boolean(record.is_featured),
    published_at: (record.published_at as string | null) ?? null,
    organization_name:
      typeof record.organization_name === "string"
        ? record.organization_name
        : "Madajob"
  };
}

function mapManagedJobRecord(record: Record<string, unknown>): ManagedJob {
  return {
    ...mapJobRecord(record),
    department: typeof record.department === "string" ? record.department : "",
    responsibilities:
      typeof record.responsibilities === "string" ? record.responsibilities : "",
    requirements: typeof record.requirements === "string" ? record.requirements : "",
    benefits: typeof record.benefits === "string" ? record.benefits : "",
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
    bucket_id: String(record.bucket_id ?? "candidate-cv"),
    storage_path: String(record.storage_path ?? ""),
    file_name: String(record.file_name ?? "cv"),
    mime_type: typeof record.mime_type === "string" ? record.mime_type : null,
    file_size: typeof record.file_size === "number" ? record.file_size : null,
    is_primary: Boolean(record.is_primary),
    created_at: String(record.created_at ?? "")
  };
}

type PublicJobsOptions = {
  limit?: number;
  sort?: "featured" | "recent";
};

export async function getPublicJobs(options: PublicJobsOptions = {}) {
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

  const supabase = await createClient();
  let query = supabase
    .from("job_posts")
    .select("id, title, slug, location, contract_type, work_mode, sector, summary, status, is_featured, published_at")
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
  if (!isSupabaseConfigured) {
    return fallbackJobs.find((job) => job.slug === slug) ?? null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("job_posts")
    .select("id, title, slug, location, contract_type, work_mode, sector, summary, status, is_featured, published_at")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapJobRecord(data);
}

export async function getRecentPublicJobs(limit = 10) {
  return getPublicJobs({ limit, sort: "recent" });
}

export async function getPublishedJobById(jobId: string) {
  if (!isSupabaseConfigured) {
    return fallbackJobs.find((job) => job.id === jobId && job.status === "published") ?? null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("job_posts")
    .select("id, title, slug, location, contract_type, work_mode, sector, summary, status, is_featured, published_at")
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

export async function getCandidatePrimaryDocument(candidateId: string) {
  if (!isSupabaseConfigured) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("candidate_documents")
    .select("id, bucket_id, storage_path, file_name, mime_type, file_size, is_primary, created_at")
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
  const [{ data: profileData }, { data: candidateData }, primaryCv] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, email, phone")
      .eq("id", profile.id)
      .maybeSingle(),
    supabase
      .from("candidate_profiles")
      .select(
        "headline, city, country, bio, experience_years, current_position, desired_position, skills_text, cv_text, profile_completion"
      )
      .eq("user_id", profile.id)
      .maybeSingle(),
    getCandidatePrimaryDocument(profile.id)
  ]);

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
    skills_text: String(candidateData?.skills_text ?? ""),
    cv_text: String(candidateData?.cv_text ?? ""),
    profile_completion:
      typeof candidateData?.profile_completion === "number"
        ? candidateData.profile_completion
        : 0,
    primary_cv: primaryCv
  };
}

export async function getRecruiterSnapshot(profile: Profile) {
  if (!isSupabaseConfigured || !profile.organization_id) {
    return {
      jobs: fallbackJobs.slice(0, 3),
      metrics: {
        activeJobs: 3,
        applications: 24,
        pipeline: 8
      }
    };
  }

  const supabase = await createClient();
  const { data: jobsData } = await supabase
    .from("job_posts")
    .select("id, title, slug, location, contract_type, work_mode, sector, summary, status, is_featured, published_at")
    .eq("organization_id", profile.organization_id)
    .order("created_at", { ascending: false })
    .limit(6);

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

export async function getManagedJobs(profile: Profile) {
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
      "id, title, slug, department, location, contract_type, work_mode, sector, summary, responsibilities, requirements, benefits, status, is_featured, published_at, closing_at, created_at, updated_at"
    )
    .order("created_at", { ascending: false });

  if (profile.role === "recruteur") {
    query = query.eq("organization_id", profile.organization_id);
  }

  const { data, error } = await query.limit(50);

  if (error || !data) {
    return [];
  }

  const countsByJobId = await getApplicationCountsByJobIds(
    data.map((item) => String(item.id))
  );

  return buildManagedJobs(data, countsByJobId);
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
      "id, title, slug, department, location, contract_type, work_mode, sector, summary, responsibilities, requirements, benefits, status, is_featured, published_at, closing_at, created_at, updated_at"
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

  return mapManagedJobRecord({
    ...data,
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
        skills_text: "",
        cv_text: "",
        profile_completion: 72
      },
      cv_document: null,
      cv_download_url: null,
      notes: [],
      status_history: []
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
        skills_text: "",
        cv_text: "",
        profile_completion: 0
      },
      cv_document: null,
      cv_download_url: null,
      notes: [],
      status_history: []
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
    { data: cvDocumentRow }
  ] = await Promise.all([
    adminClient
      .from("profiles")
      .select("id, full_name, email, phone")
      .eq("id", candidateId)
      .maybeSingle(),
    adminClient
      .from("candidate_profiles")
      .select(
        "headline, city, country, bio, experience_years, current_position, desired_position, skills_text, cv_text, profile_completion"
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
      : Promise.resolve({ data: null })
  ]);

  let cvDownloadUrl: string | null = null;

  if (cvDocumentRow?.storage_path && cvDocumentRow?.bucket_id) {
    const { data } = await adminClient.storage
      .from(String(cvDocumentRow.bucket_id))
      .createSignedUrl(String(cvDocumentRow.storage_path), 60 * 20);

    cvDownloadUrl = data?.signedUrl ?? null;
  }

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
    status_history: statusHistory
  } satisfies ApplicationDetail;
}

export async function getRecruiterApplications(profile: Profile) {
  if (!isSupabaseConfigured || !profile.organization_id) {
    return fallbackRecruiterApplications;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("applications")
    .select(
      `
      id,
      status,
      created_at,
      cv_document_id,
      cover_letter,
      candidate:profiles!applications_candidate_id_fkey(full_name, email),
      job_posts!inner(title, location, organization_id)
    `
    )
    .eq("job_posts.organization_id", profile.organization_id)
    .order("created_at", { ascending: false })
    .limit(8);

  if (error || !data) {
    return fallbackRecruiterApplications;
  }

  return data.map((item: Record<string, unknown>) => {
    const candidate = (item.candidate as { full_name?: string | null; email?: string | null } | null) ?? null;
    const job = (item.job_posts as { title?: string | null; location?: string | null } | null) ?? null;

    return {
      id: String(item.id),
      status: String(item.status ?? "submitted"),
      created_at: String(item.created_at ?? ""),
      cover_letter: typeof item.cover_letter === "string" ? item.cover_letter : null,
      has_cv: Boolean(item.cv_document_id),
      candidate_name: candidate?.full_name || candidate?.email || "Candidat Madajob",
      candidate_email: candidate?.email || "email non renseigne",
      job_title: job?.title || "Offre Madajob",
      job_location: job?.location || "Lieu a definir"
    } satisfies RecruiterApplication;
  });
}

export async function getAdminApplications() {
  if (!isSupabaseConfigured) {
    return fallbackRecruiterApplications;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("applications")
    .select(
      `
      id,
      status,
      created_at,
      cv_document_id,
      cover_letter,
      candidate:profiles!applications_candidate_id_fkey(full_name, email),
      job_posts(title, location)
    `
    )
    .order("created_at", { ascending: false })
    .limit(8);

  if (error || !data) {
    return fallbackRecruiterApplications;
  }

  return data.map((item: Record<string, unknown>) => {
    const candidate = (item.candidate as { full_name?: string | null; email?: string | null } | null) ?? null;
    const job = (item.job_posts as { title?: string | null; location?: string | null } | null) ?? null;

    return {
      id: String(item.id),
      status: String(item.status ?? "submitted"),
      created_at: String(item.created_at ?? ""),
      cover_letter: typeof item.cover_letter === "string" ? item.cover_letter : null,
      has_cv: Boolean(item.cv_document_id),
      candidate_name: candidate?.full_name || candidate?.email || "Candidat Madajob",
      candidate_email: candidate?.email || "email non renseigne",
      job_title: job?.title || "Offre Madajob",
      job_location: job?.location || "Lieu a definir"
    } satisfies RecruiterApplication;
  });
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
      .select("id, title, slug, location, contract_type, work_mode, sector, summary, status, is_featured, published_at")
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
