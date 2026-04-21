import { unstable_noStore as noStore } from "next/cache";

import { getCandidateProfileInsights } from "@/lib/candidate-profile";
import { isSupabaseConfigured } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type {
  ApplicationCommunicationEvent,
  ApplicationDetail,
  ApplicationStatusHistoryEntry,
  CandidateApplicationDetail,
  CandidateApplicationHistoryEntry,
  CandidateApplicationSummary,
  CandidateApplication,
  CandidateDetail,
  CandidateDocumentData,
  CandidateProfileData,
  InternalApplicationNote,
  Job,
  JobAuditEvent,
  ManagedJob,
  ManagedCandidateSummary,
  ManagedUserDetail,
  ManagedUserSummary,
  OrganizationOption,
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
  primary_cv: null,
  recent_documents: []
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
    .select("id, title, slug, location, contract_type, work_mode, sector, summary, status, is_featured, published_at, created_at")
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
    .select("id, title, slug, location, contract_type, work_mode, sector, summary, status, is_featured, published_at, created_at")
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
    .select("id, title, slug, location, contract_type, work_mode, sector, summary, status, is_featured, published_at, created_at")
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
        notes_count: 0
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

  const organizations =
    adminClient && organizationIds.length
      ? await adminClient
          .from("organizations")
          .select("id, name")
          .in("id", organizationIds)
      : { data: [] as Array<{ id?: string | null; name?: string | null }> };

  const organizationMap = new Map(
    (organizations.data ?? []).map((row) => [String(row.id ?? ""), String(row.name ?? "Madajob")])
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
      notes_count: 0
    } satisfies CandidateApplicationSummary;
  });
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
      status_history: []
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

  const [{ data: organizationData }, { data: historyRows }, { data: cvDocumentRow }] =
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
        : Promise.resolve({ data: null })
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
    status_history: statusHistory
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
        "headline, city, country, bio, experience_years, current_position, desired_position, skills_text, cv_text, profile_completion"
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
    .select("id, title, slug, location, contract_type, work_mode, sector, summary, status, is_featured, published_at")
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
      "id, title, slug, department, location, contract_type, work_mode, sector, summary, responsibilities, requirements, benefits, status, is_featured, published_at, closing_at, created_at, updated_at"
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
      status_history: [],
      communications: []
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
      status_history: [],
      communications: []
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
      : Promise.resolve({ data: null }),
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
    communications
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
        "user_id, headline, skills_text, city, country, current_position, desired_position, profile_completion"
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
      applications: [],
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
        "bio, experience_years, skills_text, cv_text, headline, city, country, current_position, desired_position, profile_completion"
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

  const [{ data: organizations }, { data: noteRows }] = await Promise.all([
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

  const primaryCvDownloadUrl = await createSignedUrlForDocument(adminClient, summary.primary_cv);

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
      notes_count: notesCountMap.get(String(row.id)) ?? 0
    } satisfies CandidateApplicationSummary;
  });

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
    skills_text: String(candidateRow?.skills_text ?? ""),
    cv_text: String(candidateRow?.cv_text ?? ""),
    profile_completion:
      typeof candidateRow?.profile_completion === "number"
        ? candidateRow.profile_completion
        : summary.profile_completion,
    primary_cv: summary.primary_cv,
    primary_cv_download_url: primaryCvDownloadUrl,
    applications,
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

  const [{ data: profileRows }, organizations, { data: candidateRows }, { data: applicationRows }, { data: jobRows }] =
    await Promise.all([
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

  const organizationMap = new Map(organizations.map((item) => [item.id, item.name]));
  const candidateMap = new Map(
    (candidateRows ?? []).map((row) => [String(row.user_id), row])
  );
  const applicationCountMap = new Map<string, number>();
  const jobsCountMap = new Map<string, number>();

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
        "id, title, slug, location, contract_type, work_mode, sector, summary, status, is_featured, published_at, created_at, updated_at, closing_at"
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
      notes_count: 0
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
