export type AppRole = "candidat" | "recruteur" | "admin";

export type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: AppRole;
  organization_id: string | null;
  avatar_path: string | null;
  is_active: boolean;
};

export type Job = {
  id: string;
  title: string;
  slug: string;
  location: string;
  contract_type: string;
  work_mode: string;
  sector: string;
  summary: string;
  status: "draft" | "published" | "closed" | "archived";
  is_featured: boolean;
  published_at: string | null;
  organization_name?: string;
};

export type CandidateApplication = {
  id: string;
  status: string;
  created_at: string;
  job_title: string;
  organization_name: string | null;
};
