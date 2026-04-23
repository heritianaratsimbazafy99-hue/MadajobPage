import { isFinalApplicationStatus } from "@/lib/application-status";
import type {
  AppNotification,
  ManagedCandidateSummary,
  ManagedJob,
  ManagedOrganizationSummary,
  ManagedUserSummary,
  RecruiterApplication,
  TransactionalEmail
} from "@/lib/types";

const dayInMilliseconds = 86_400_000;

export type PlatformRecommendationTone = "danger" | "warning" | "info" | "success" | "muted";

export type PlatformRecommendation = {
  id: string;
  title: string;
  body: string;
  count: number;
  meta: string;
  href: string;
  cta: string;
  tone: PlatformRecommendationTone;
  priority: number;
};

type RecruiterRecommendationInput = {
  jobs: ManagedJob[];
  applications: RecruiterApplication[];
  candidates: ManagedCandidateSummary[];
  notifications: AppNotification[];
};

type AdminRecommendationInput = RecruiterRecommendationInput & {
  users: ManagedUserSummary[];
  organizations: ManagedOrganizationSummary[];
  emails: TransactionalEmail[];
};

function getDaysSince(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const time = new Date(value).getTime();

  if (Number.isNaN(time)) {
    return null;
  }

  return Math.floor((Date.now() - time) / dayInMilliseconds);
}

function getDaysUntil(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const time = new Date(value).getTime();

  if (Number.isNaN(time)) {
    return null;
  }

  return Math.ceil((time - Date.now()) / dayInMilliseconds);
}

function getPlural(count: number, singular: string, plural: string) {
  return count > 1 ? plural : singular;
}

function getTagMeta(count: number, label: string) {
  return `${count} ${getPlural(count, label, `${label}s`)}`;
}

function isActiveApplication(application: RecruiterApplication) {
  return !isFinalApplicationStatus(application.status);
}

function hasOpenInterviewSignal(application: RecruiterApplication) {
  return Boolean(
    application.interview_signal.next_interview_at ||
      application.interview_signal.pending_feedback ||
      application.interview_signal.latest_feedback
  );
}

function sortRecommendations(recommendations: PlatformRecommendation[]) {
  return recommendations
    .filter((recommendation) => recommendation.count > 0)
    .sort((left, right) => {
      if (left.priority !== right.priority) {
        return right.priority - left.priority;
      }

      return right.count - left.count;
    })
    .slice(0, 5);
}

function getBaseRecruiterRecommendations({
  jobs,
  applications,
  candidates,
  notifications,
  basePath
}: RecruiterRecommendationInput & { basePath: "/app/recruteur" | "/app/admin" }) {
  const activeApplications = applications.filter(isActiveApplication);
  const stalledApplications = activeApplications.filter((application) => {
    const daysSinceUpdate = getDaysSince(application.updated_at ?? application.created_at);

    return (
      daysSinceUpdate !== null &&
      daysSinceUpdate >= 7 &&
      !hasOpenInterviewSignal(application)
    );
  });
  const missingCvApplications = activeApplications.filter((application) => !application.has_cv);
  const publishedJobsWithoutApplications = jobs.filter((job) => {
    const daysSincePublication = getDaysSince(job.published_at ?? job.created_at);

    return (
      job.status === "published" &&
      job.applications_count === 0 &&
      daysSincePublication !== null &&
      daysSincePublication >= 5
    );
  });
  const oldDraftJobs = jobs.filter((job) => {
    const daysSinceUpdate = getDaysSince(job.updated_at ?? job.created_at);

    return job.status === "draft" && daysSinceUpdate !== null && daysSinceUpdate >= 3;
  });
  const closingSoonJobs = jobs.filter((job) => {
    const daysUntilClosing = getDaysUntil(job.closing_at);

    return (
      job.status === "published" &&
      daysUntilClosing !== null &&
      daysUntilClosing >= 0 &&
      daysUntilClosing <= 7 &&
      job.applications_count < 3
    );
  });
  const readyCandidatesWithoutPipeline = candidates.filter(
    (candidate) =>
      candidate.profile_completion >= 80 &&
      candidate.has_primary_cv &&
      candidate.applications_count === 0
  );
  const unreadNotifications = notifications.filter((notification) => !notification.is_read);

  return [
    {
      id: "stalled-applications",
      title: "Relancer les dossiers inactifs",
      body: "Des candidatures actives n'ont pas bouge depuis au moins 7 jours et n'ont pas de signal entretien ouvert.",
      count: stalledApplications.length,
      meta: "Seuil : 7 jours sans mouvement",
      href: `${basePath}/candidatures`,
      cta: "Ouvrir le pipeline",
      tone: "danger",
      priority: 500
    },
    {
      id: "missing-cv-applications",
      title: "Demander les CV manquants",
      body: "Certains dossiers actifs restent difficiles a qualifier parce qu'aucun CV n'est rattache.",
      count: missingCvApplications.length,
      meta: getTagMeta(missingCvApplications.length, "dossier"),
      href: `${basePath}/candidatures`,
      cta: "Voir les dossiers",
      tone: "warning",
      priority: 430
    },
    {
      id: "published-jobs-without-applications",
      title: "Repositionner les annonces sans retour",
      body: "Des offres publiees depuis plusieurs jours n'ont encore genere aucune candidature.",
      count: publishedJobsWithoutApplications.length,
      meta: "Seuil : 5 jours publies",
      href: `${basePath}/offres`,
      cta: "Optimiser les offres",
      tone: "warning",
      priority: 390
    },
    {
      id: "closing-soon-low-pipeline",
      title: "Renforcer les offres proches de cloture",
      body: "Des annonces arrivent bientot a echeance avec un volume de candidatures encore faible.",
      count: closingSoonJobs.length,
      meta: "Moins de 3 candidatures",
      href: `${basePath}/offres`,
      cta: "Voir les annonces",
      tone: "info",
      priority: 360
    },
    {
      id: "old-draft-jobs",
      title: "Arbitrer les brouillons anciens",
      body: "Des offres restent en brouillon depuis plusieurs jours et peuvent bloquer le sourcing.",
      count: oldDraftJobs.length,
      meta: "Seuil : 3 jours",
      href: `${basePath}/offres`,
      cta: "Finaliser les brouillons",
      tone: "muted",
      priority: 320
    },
    {
      id: "ready-candidates-without-pipeline",
      title: "Activer les profils prets",
      body: "Des candidats complets avec CV principal n'ont pas encore de dossier actif dans le pipeline.",
      count: readyCandidatesWithoutPipeline.length,
      meta: "Profil >= 80%",
      href: `${basePath}/candidats`,
      cta: "Ouvrir la base candidats",
      tone: "success",
      priority: 280
    },
    {
      id: "unread-notifications",
      title: "Traiter les alertes non lues",
      body: "Des notifications internes restent a ouvrir et peuvent contenir une action directe.",
      count: unreadNotifications.length,
      meta: getTagMeta(unreadNotifications.length, "alerte"),
      href: `${basePath}/notifications`,
      cta: "Ouvrir les alertes",
      tone: "info",
      priority: 240
    }
  ] satisfies PlatformRecommendation[];
}

export function getRecruiterPlatformRecommendations(input: RecruiterRecommendationInput) {
  return sortRecommendations(
    getBaseRecruiterRecommendations({
      ...input,
      basePath: "/app/recruteur"
    })
  );
}

export function getAdminPlatformRecommendations({
  jobs,
  applications,
  candidates,
  notifications,
  users,
  organizations,
  emails
}: AdminRecommendationInput) {
  const baseRecommendations = getBaseRecruiterRecommendations({
    jobs,
    applications,
    candidates,
    notifications,
    basePath: "/app/admin"
  });
  const recruitersWithoutOrganization = users.filter(
    (user) => user.role === "recruteur" && !user.organization_id
  );
  const inactiveInternalUsers = users.filter(
    (user) => user.role !== "candidat" && !user.is_active
  );
  const organizationsWithoutRecruiter = organizations.filter(
    (organization) => organization.is_active && organization.recruiters_count === 0
  );
  const activeOrganizationsWithoutJobs = organizations.filter(
    (organization) => organization.is_active && organization.active_jobs_count === 0
  );
  const failedEmails = emails.filter((email) => email.status === "failed");
  const queuedEmails = emails.filter((email) => email.status === "queued");

  return sortRecommendations([
    ...baseRecommendations,
    {
      id: "admin-users-without-access",
      title: "Regulariser les acces internes",
      body: "Des comptes recruteur ou admin demandent une action d'organisation ou d'activation.",
      count: recruitersWithoutOrganization.length + inactiveInternalUsers.length,
      meta: `${recruitersWithoutOrganization.length} sans organisation`,
      href: "/app/admin/utilisateurs",
      cta: "Gerer les utilisateurs",
      tone: "danger",
      priority: 520
    },
    {
      id: "admin-organizations-without-recruiter",
      title: "Affecter les organisations sans recruteur",
      body: "Des organisations actives n'ont pas encore de recruteur rattache pour piloter les offres.",
      count: organizationsWithoutRecruiter.length,
      meta: getTagMeta(organizationsWithoutRecruiter.length, "organisation"),
      href: "/app/admin/organisations",
      cta: "Ouvrir les organisations",
      tone: "warning",
      priority: 470
    },
    {
      id: "admin-email-failures",
      title: "Verifier les emails en echec",
      body: "La file transactionnelle contient des messages en echec qui doivent etre controles.",
      count: failedEmails.length,
      meta: `${queuedEmails.length} email(s) encore en file`,
      href: "/app/admin/emails",
      cta: "Ouvrir les emails",
      tone: "danger",
      priority: 460
    },
    {
      id: "admin-organizations-without-jobs",
      title: "Relancer les organisations sans offre active",
      body: "Des organisations actives n'ont aucune annonce publiee, ce qui limite la traction candidat.",
      count: activeOrganizationsWithoutJobs.length,
      meta: getTagMeta(activeOrganizationsWithoutJobs.length, "organisation"),
      href: "/app/admin/organisations",
      cta: "Voir les organisations",
      tone: "info",
      priority: 300
    },
    {
      id: "admin-email-queue",
      title: "Surveiller la file email",
      body: "Des emails transactionnels sont encore en attente de traitement.",
      count: queuedEmails.length,
      meta: getTagMeta(queuedEmails.length, "email"),
      href: "/app/admin/emails",
      cta: "Suivre la file",
      tone: "muted",
      priority: 220
    }
  ]);
}
