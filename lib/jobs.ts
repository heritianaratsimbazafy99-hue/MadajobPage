import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type {
  CandidateApplication,
  CandidateDocumentData,
  CandidateProfileData,
  Job,
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
