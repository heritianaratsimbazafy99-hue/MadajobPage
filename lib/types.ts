export type AppRole = "candidat" | "recruteur" | "admin";

export type AppNotification = {
  id: string;
  user_id: string;
  kind: string;
  title: string;
  body: string;
  link_href: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  metadata: Record<string, unknown>;
};

export type TransactionalEmailStatus =
  | "queued"
  | "processing"
  | "sent"
  | "failed"
  | "skipped";

export type TransactionalEmail = {
  id: string;
  recipient_email: string;
  recipient_name: string | null;
  recipient_user_id: string | null;
  template_key: string;
  subject: string;
  preview_text: string;
  link_href: string | null;
  status: TransactionalEmailStatus;
  provider: string | null;
  provider_message_id: string | null;
  attempts_count: number;
  last_attempt_at: string | null;
  sent_at: string | null;
  error_message: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

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
  primary_cv: CandidateDocumentData | null;
  recent_documents: CandidateDocumentData[];
};

export type CandidateDocumentData = {
  id: string;
  document_type: string;
  bucket_id: string;
  storage_path: string;
  file_name: string;
  mime_type: string | null;
  file_size: number | null;
  is_primary: boolean;
  created_at: string;
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

export type ManagedJob = Job & {
  department?: string;
  responsibilities?: string;
  requirements?: string;
  benefits?: string;
  created_at: string;
  updated_at: string;
  closing_at: string | null;
  applications_count: number;
};

export type JobAuditEvent = {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  metadata: Record<string, unknown>;
  created_at: string;
  actor_name: string;
  actor_email: string | null;
};

export type CandidateApplication = {
  id: string;
  status: string;
  created_at: string;
  job_title: string;
  organization_name: string | null;
};

export type CandidateApplicationHistoryEntry = {
  id: string;
  from_status: string | null;
  to_status: string;
  note: string | null;
  created_at: string;
};

export type RecruiterApplication = {
  id: string;
  status: string;
  created_at: string;
  updated_at: string | null;
  candidate_id: string | null;
  job_id: string | null;
  cover_letter: string | null;
  has_cv: boolean;
  candidate_name: string;
  candidate_email: string;
  job_title: string;
  job_location: string;
};

export type InternalApplicationNote = {
  id: string;
  application_id: string;
  body: string;
  created_at: string;
  author_name: string;
  author_email: string | null;
};

export type ApplicationStatusHistoryEntry = {
  id: string;
  from_status: string | null;
  to_status: string;
  note: string | null;
  created_at: string;
  changed_by_name: string;
  changed_by_email: string | null;
};

export type ApplicationCommunicationEvent = {
  id: string;
  channel: "notification" | "email";
  event_key: string;
  title: string;
  body: string;
  recipient_label: string;
  status: string;
  created_at: string;
  link_href: string | null;
  management_href: string | null;
};

export type ApplicationDetail = {
  id: string;
  status: string;
  created_at: string;
  updated_at: string;
  cover_letter: string | null;
  has_cv: boolean;
  job: {
    id: string;
    title: string;
    slug: string;
    location: string;
    contract_type: string;
    work_mode: string;
    sector: string;
    summary: string;
    organization_name: string;
  };
  candidate: {
    id: string;
    full_name: string;
    email: string | null;
    phone: string | null;
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
  cv_document: CandidateDocumentData | null;
  cv_download_url: string | null;
  notes: InternalApplicationNote[];
  status_history: ApplicationStatusHistoryEntry[];
  communications: ApplicationCommunicationEvent[];
};

export type CandidateApplicationDetail = {
  id: string;
  status: string;
  created_at: string;
  updated_at: string;
  cover_letter: string | null;
  has_cv: boolean;
  job: {
    id: string;
    title: string;
    slug: string;
    location: string;
    contract_type: string;
    work_mode: string;
    sector: string;
    summary: string;
    organization_name: string;
  };
  cv_document: CandidateDocumentData | null;
  cv_download_url: string | null;
  status_history: CandidateApplicationHistoryEntry[];
};

export type ManagedCandidateSummary = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  headline: string;
  skills_text: string;
  city: string;
  country: string;
  current_position: string;
  desired_position: string;
  profile_completion: number;
  applications_count: number;
  latest_application_at: string | null;
  latest_status: string | null;
  latest_job_title: string | null;
  latest_job_location: string | null;
  has_primary_cv: boolean;
  primary_cv: CandidateDocumentData | null;
};

export type CandidateApplicationSummary = {
  id: string;
  status: string;
  created_at: string;
  updated_at: string;
  cover_letter: string | null;
  has_cv: boolean;
  job_id: string;
  job_title: string;
  job_slug: string;
  job_location: string;
  contract_type: string;
  work_mode: string;
  sector: string;
  organization_name: string;
  notes_count: number;
};

export type CandidateDetail = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
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
  primary_cv: CandidateDocumentData | null;
  primary_cv_download_url: string | null;
  applications: CandidateApplicationSummary[];
  recent_notes: InternalApplicationNote[];
};

export type OrganizationOption = {
  id: string;
  name: string;
  slug: string;
  kind: string;
  is_active: boolean;
};

export type ManagedOrganizationSummary = OrganizationOption & {
  members_count: number;
  recruiters_count: number;
  active_jobs_count: number;
  applications_count: number;
  shortlist_count: number;
  latest_job_at: string | null;
  latest_application_at: string | null;
};

export type ManagedOrganizationDetail = ManagedOrganizationSummary & {
  members: ManagedUserSummary[];
  recent_jobs: ManagedJob[];
  recent_applications: RecruiterApplication[];
};

export type ManagedUserSummary = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: AppRole;
  organization_id: string | null;
  organization_name: string | null;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  headline: string;
  city: string;
  current_position: string;
  candidate_profile_completion: number | null;
  applications_count: number;
  jobs_count: number;
};

export type ManagedUserDetail = ManagedUserSummary & {
  desired_position: string;
  country: string;
  bio: string;
  skills_text: string;
  recent_applications: CandidateApplicationSummary[];
  recent_jobs: ManagedJob[];
};
