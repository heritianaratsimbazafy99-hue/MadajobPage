import type {
  CandidateApplication,
  CandidateProfileData,
  InterviewScheduleItem,
  Job,
  RecruiterApplication
} from "@/lib/types";

export const fallbackJobs: Job[] = [
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

export const fallbackApplications: CandidateApplication[] = [
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

export const fallbackRecruiterApplications: RecruiterApplication[] = [
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

export const fallbackInterviews: InterviewScheduleItem[] = [
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

export const fallbackCandidateProfile: CandidateProfileData = {
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
  desired_sectors: [],
  desired_locations: [],
  desired_experience_level: "",
  job_alerts_enabled: true,
  skills_text: "",
  cv_text: "",
  profile_completion: 0,
  primary_cv: null,
  recent_documents: []
};
