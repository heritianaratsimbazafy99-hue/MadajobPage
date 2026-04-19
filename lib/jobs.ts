import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import type { CandidateApplication, Job, Profile } from "@/lib/types";

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

export async function getPublicJobs() {
  if (!isSupabaseConfigured) {
    return fallbackJobs;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("job_posts")
    .select("id, title, slug, location, contract_type, work_mode, sector, summary, status, is_featured, published_at")
    .eq("status", "published")
    .order("is_featured", { ascending: false })
    .order("published_at", { ascending: false });

  if (error || !data?.length) {
    return fallbackJobs;
  }

  return data.map((item) => mapJobRecord(item));
}

export async function getPublicJobBySlug(slug: string) {
  const jobs = await getPublicJobs();
  return jobs.find((job) => job.slug === slug) ?? null;
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

export function formatDisplayDate(value: string | null) {
  if (!value) {
    return "A definir";
  }

  const date = new Date(value);

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  }).format(date);
}
