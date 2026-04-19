export type AppRole = "candidat" | "recruteur" | "admin";

export type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: AppRole;
  organization_id: string | null;
  phone?: string | null;
  avatar_path: string | null;
  is_active: boolean;
};

export type CandidateProfileData = {
  full_name: string;
  email: string;
  phone: string;
  headline: string;
  city: string;
  country: string;
  bio: string;
  experience_years: number | null;
  current_position: string;
  desired_position: string;
  skills_text: string;
  cv_text: string;
  profile_completion: number;
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

export type RecruiterApplication = {
  id: string;
  status: string;
  created_at: string;
  cover_letter: string | null;
  candidate_name: string;
  candidate_email: string;
  job_title: string;
  job_location: string;
};
