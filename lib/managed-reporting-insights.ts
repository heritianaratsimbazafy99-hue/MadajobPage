import { isFinalApplicationStatus } from "@/lib/application-status";
import type {
  ManagedCandidateSummary,
  ManagedJob,
  Profile,
  RecruiterApplication
} from "@/lib/types";

export type ReportingWindowKey = "7d" | "30d" | "90d" | "all";

export type ReportingWindowSummary = {
  key: ReportingWindowKey;
  label: string;
  description: string;
  jobsCount: number;
  publishedJobsCount: number;
  applicationsCount: number;
  shortlistedCount: number;
  interviewsCount: number;
  hiredCount: number;
  candidatesCount: number;
  readyCandidatesCount: number;
};

export type ReportingMetricCard = {
  title: string;
  value: string;
  hint: string;
  tone: "info" | "success" | "danger" | "muted";
};

export type ReportingAlert = {
  title: string;
  value: number;
  hint: string;
  tone: "info" | "success" | "danger" | "muted";
  exportHref: string | null;
};

export type ReportingExportShortcut = {
  title: string;
  description: string;
  href: string;
  cta: string;
  tone: "primary" | "secondary" | "ghost";
};

export type ReportingJobConversion = {
  label: string;
  location: string;
  applicationsCount: number;
  advancedCount: number;
  interviewedCount: number;
  hiredCount: number;
};

const oneDayInMs = 86_400_000;

const reportingWindows: Array<{
  key: ReportingWindowKey;
  label: string;
  description: string;
  days: number | null;
}> = [
  {
    key: "7d",
    label: "7 jours",
    description: "Lecture tres recente des volumes, relances et conversions.",
    days: 7
  },
  {
    key: "30d",
    label: "30 jours",
    description: "Vision mensuelle pour arbitrer les tendances et les alertes.",
    days: 30
  },
  {
    key: "90d",
    label: "90 jours",
    description: "Lecture de fond pour comparer diffusion, pipeline et activite.",
    days: 90
  },
  {
    key: "all",
    label: "Depuis le debut",
    description: "Vue globale du perimetre visible dans la plateforme.",
    days: null
  }
];

function formatPercent(value: number, total: number) {
  if (total <= 0) {
    return "0%";
  }

  return `${Math.round((value / total) * 100)}%`;
}

function isWithinDays(dateValue: string | null | undefined, days: number | null) {
  if (days === null) {
    return true;
  }

  if (!dateValue) {
    return false;
  }

  return Date.now() - new Date(dateValue).getTime() <= days * oneDayInMs;
}

function getJobReferenceDate(job: ManagedJob) {
  return job.published_at ?? job.created_at;
}

function isReadyCandidate(candidate: ManagedCandidateSummary) {
  return candidate.has_primary_cv && candidate.profile_completion >= 80;
}

function hasActivePipeline(candidate: ManagedCandidateSummary) {
  return (
    candidate.applications_count > 0 &&
    (!candidate.latest_status || !isFinalApplicationStatus(candidate.latest_status))
  );
}

function buildExportHref(resource: string, params: Record<string, string | number | boolean | null | undefined>) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined || value === "") {
      continue;
    }

    searchParams.set(key, String(value));
  }

  const query = searchParams.toString();
  return `/api/exports/${resource}${query ? `?${query}` : ""}`;
}

export function getReportingWindowSummaries(
  jobs: ManagedJob[],
  applications: RecruiterApplication[],
  candidates: ManagedCandidateSummary[]
) {
  return reportingWindows.map((window) => {
    const windowJobs = jobs.filter((job) => isWithinDays(getJobReferenceDate(job), window.days));
    const windowApplications = applications.filter((application) =>
      isWithinDays(application.created_at, window.days)
    );
    const windowCandidates =
      window.days === null
        ? candidates
        : candidates.filter((candidate) =>
            isWithinDays(candidate.latest_application_at, window.days)
          );

    return {
      key: window.key,
      label: window.label,
      description: window.description,
      jobsCount: windowJobs.length,
      publishedJobsCount: windowJobs.filter((job) => job.status === "published").length,
      applicationsCount: windowApplications.length,
      shortlistedCount: windowApplications.filter((application) =>
        ["shortlist", "interview", "hired"].includes(application.status)
      ).length,
      interviewsCount: windowApplications.filter((application) =>
        ["interview", "hired"].includes(application.status)
      ).length,
      hiredCount: windowApplications.filter((application) => application.status === "hired").length,
      candidatesCount: windowCandidates.length,
      readyCandidatesCount: windowCandidates.filter((candidate) => isReadyCandidate(candidate)).length
    } satisfies ReportingWindowSummary;
  });
}

export function getReportingMetricCards(
  jobs: ManagedJob[],
  applications: RecruiterApplication[],
  candidates: ManagedCandidateSummary[]
) {
  const publishedJobsCount = jobs.filter((job) => job.status === "published").length;
  const shortlistedCount = applications.filter((application) =>
    ["shortlist", "interview", "hired"].includes(application.status)
  ).length;
  const interviewedCount = applications.filter((application) =>
    ["interview", "hired"].includes(application.status)
  ).length;
  const hiredCount = applications.filter((application) => application.status === "hired").length;
  const readyCandidatesCount = candidates.filter((candidate) => isReadyCandidate(candidate)).length;

  return [
    {
      title: "Candidatures / offre publiee",
      value: publishedJobsCount > 0 ? `${(applications.length / publishedJobsCount).toFixed(1)}` : "0",
      hint: `${publishedJobsCount} offre(s) publiee(s) dans le perimetre`,
      tone: "info"
    },
    {
      title: "Conversion shortlist",
      value: formatPercent(shortlistedCount, applications.length),
      hint: `${shortlistedCount} dossier(s) deja avances ou mieux`,
      tone: shortlistedCount > 0 ? "success" : "muted"
    },
    {
      title: "Conversion entretien",
      value: formatPercent(interviewedCount, applications.length),
      hint: `${interviewedCount} dossier(s) passes par l'etape entretien`,
      tone: interviewedCount > 0 ? "success" : "muted"
    },
    {
      title: "Conversion embauche",
      value: formatPercent(hiredCount, applications.length),
      hint: `${hiredCount} candidature(s) retenue(s)`,
      tone: hiredCount > 0 ? "success" : "muted"
    },
    {
      title: "Couverture CV",
      value: formatPercent(
        applications.filter((application) => application.has_cv).length,
        applications.length
      ),
      hint: `${applications.filter((application) => !application.has_cv).length} dossier(s) sans CV joint`,
      tone: applications.some((application) => !application.has_cv) ? "danger" : "success"
    },
    {
      title: "Base candidats prete",
      value: formatPercent(readyCandidatesCount, candidates.length),
      hint: `${readyCandidatesCount} profil(s) avec CV principal et completion >= 80%`,
      tone: readyCandidatesCount > 0 ? "info" : "muted"
    }
  ] satisfies ReportingMetricCard[];
}

export function getReportingAlerts(applications: RecruiterApplication[]) {
  const pendingFeedbackCount = applications.filter(
    (application) => application.interview_signal.pending_feedback
  ).length;
  const upcomingInterviewCount = applications.filter((application) => {
    const nextInterviewAt = application.interview_signal.next_interview_at;
    return nextInterviewAt ? new Date(nextInterviewAt).getTime() >= Date.now() : false;
  }).length;
  const shortlistToConvertCount = applications.filter(
    (application) => application.status === "shortlist"
  ).length;
  const screeningStalledCount = applications.filter((application) => {
    if (application.status !== "screening") {
      return false;
    }

    const lastTouchAt = application.updated_at ?? application.created_at;
    return Date.now() - new Date(lastTouchAt).getTime() > 10 * oneDayInMs;
  }).length;
  const withoutCvCount = applications.filter((application) => !application.has_cv).length;

  return [
    {
      title: "Feedbacks entretien en attente",
      value: pendingFeedbackCount,
      hint: "Compte-rendus a finaliser avant de perdre du contexte decisionnel.",
      tone: pendingFeedbackCount > 0 ? "danger" : "success",
      exportHref: buildExportHref("applications", { pendingFeedback: 1 })
    },
    {
      title: "Entretiens planifies",
      value: upcomingInterviewCount,
      hint: "Dossiers avec prochain entretien deja date dans le pipeline.",
      tone: upcomingInterviewCount > 0 ? "info" : "muted",
      exportHref: buildExportHref("applications", { nextInterview: 1 })
    },
    {
      title: "Shortlists a convertir",
      value: shortlistToConvertCount,
      hint: "Profils avances qui meritent une action de conversion ou de rendez-vous.",
      tone: shortlistToConvertCount > 0 ? "info" : "muted",
      exportHref: buildExportHref("applications", { status: "shortlist" })
    },
    {
      title: "Screenings qui s'etirent",
      value: screeningStalledCount,
      hint: "Dossiers en etude depuis plus de 10 jours sans progression visible.",
      tone: screeningStalledCount > 0 ? "danger" : "success",
      exportHref: buildExportHref("applications", { status: "screening", staleDays: 10 })
    },
    {
      title: "Candidatures sans CV",
      value: withoutCvCount,
      hint: "A fiabiliser avant d'alimenter le pipeline ou la shortlist.",
      tone: withoutCvCount > 0 ? "danger" : "success",
      exportHref: buildExportHref("applications", { withCv: 0 })
    }
  ] satisfies ReportingAlert[];
}

export function getReportingExportShortcuts(
  profile: Profile,
  jobs: ManagedJob[],
  applications: RecruiterApplication[],
  candidates: ManagedCandidateSummary[]
) {
  const publishedJobsCount = jobs.filter((job) => job.status === "published").length;
  const advancedApplicationsCount = applications.filter((application) =>
    ["shortlist", "interview", "hired"].includes(application.status)
  ).length;
  const pendingFeedbackCount = applications.filter(
    (application) => application.interview_signal.pending_feedback
  ).length;
  const readyCandidatesCount = candidates.filter((candidate) => isReadyCandidate(candidate)).length;
  const activeCandidatesCount = candidates.filter((candidate) => hasActivePipeline(candidate)).length;
  const roleLabel = profile.role === "admin" ? "plateforme" : "perimetre recruteur";

  return [
    {
      title: "Offres publiees",
      description: `${publishedJobsCount} offre(s) publiee(s) a extraire pour relire la diffusion ${roleLabel}.`,
      href: buildExportHref("jobs", { status: "published" }),
      cta: "Exporter les offres publiees",
      tone: "primary"
    },
    {
      title: "Candidatures avancees",
      description: `${advancedApplicationsCount} dossier(s) shortlist, entretien ou embauche pour reprise de pipeline.`,
      href: buildExportHref("applications", { advanced: 1 }),
      cta: "Exporter les dossiers avances",
      tone: "secondary"
    },
    {
      title: "Entretiens a fiabiliser",
      description: `${pendingFeedbackCount} dossier(s) avec feedback entretien encore attendu.`,
      href: buildExportHref("applications", { pendingFeedback: 1 }),
      cta: "Exporter les feedbacks manquants",
      tone: "ghost"
    },
    {
      title: "Candidats prets",
      description: `${readyCandidatesCount} profil(s) exploitables rapidement avec CV principal et bonne completion.`,
      href: buildExportHref("candidates", { ready: 1 }),
      cta: "Exporter les candidats prets",
      tone: "secondary"
    },
    {
      title: "Candidats actifs",
      description: `${activeCandidatesCount} profil(s) encore engages dans un pipeline non final.`,
      href: buildExportHref("candidates", { activePipeline: 1 }),
      cta: "Exporter les candidats actifs",
      tone: "ghost"
    },
    {
      title: "30 derniers jours",
      description: "Pack recent pour relire les offres, candidatures ou profils sur la fenetre mensuelle.",
      href: buildExportHref("applications", { recentDays: 30 }),
      cta: "Exporter les 30 derniers jours",
      tone: "primary"
    }
  ] satisfies ReportingExportShortcut[];
}

export function getTopReportingJobConversions(applications: RecruiterApplication[]) {
  const byJob = new Map<
    string,
    {
      label: string;
      location: string;
      applicationsCount: number;
      advancedCount: number;
      interviewedCount: number;
      hiredCount: number;
    }
  >();

  for (const application of applications) {
    const key = application.job_id || application.job_title;
    const current = byJob.get(key) ?? {
      label: application.job_title,
      location: application.job_location,
      applicationsCount: 0,
      advancedCount: 0,
      interviewedCount: 0,
      hiredCount: 0
    };

    current.applicationsCount += 1;

    if (["shortlist", "interview", "hired"].includes(application.status)) {
      current.advancedCount += 1;
    }

    if (["interview", "hired"].includes(application.status)) {
      current.interviewedCount += 1;
    }

    if (application.status === "hired") {
      current.hiredCount += 1;
    }

    byJob.set(key, current);
  }

  return Array.from(byJob.values())
    .sort((left, right) => {
      if (right.advancedCount !== left.advancedCount) {
        return right.advancedCount - left.advancedCount;
      }

      return right.applicationsCount - left.applicationsCount;
    })
    .slice(0, 5) satisfies ReportingJobConversion[];
}
