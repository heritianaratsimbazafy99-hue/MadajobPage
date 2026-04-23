import Link from "next/link";

import { DashboardInterviewSignalCard } from "@/components/dashboard/interview-signal-card";
import { DashboardShell } from "@/components/dashboard/shell";
import { JobCreateForm } from "@/components/jobs/job-create-form";
import { getApplicationStatusMeta } from "@/lib/application-status";
import {
  getInterviewDashboardActionItems,
  getInterviewDashboardStats,
  type DashboardPriorityTone
} from "@/lib/dashboard-interviews";
import { formatDisplayDate } from "@/lib/format";
import {
  getAdminPlatformRecommendations,
  type PlatformRecommendationTone
} from "@/lib/platform-recommendations";
import type {
  AdminAuditEvent,
  AppNotification,
  Job,
  ManagedCandidateSummary,
  ManagedJob,
  ManagedOrganizationSummary,
  OrganizationOption,
  ManagedUserSummary,
  Profile,
  RecruiterApplication,
  TransactionalEmail
} from "@/lib/types";

type AdminSnapshotData = {
  metrics: {
    candidates: number;
    recruiters: number;
    activeJobs: number;
    applications: number;
  };
  recentJobs: Job[];
};

type AdminSupervisionWorkspaceProps = {
  profile: Profile;
  snapshot: AdminSnapshotData;
  jobs: ManagedJob[];
  applications: RecruiterApplication[];
  candidates: ManagedCandidateSummary[];
  users: ManagedUserSummary[];
  organizations: ManagedOrganizationSummary[];
  organizationOptions: OrganizationOption[];
  emails: TransactionalEmail[];
  notifications: AppNotification[];
  auditEvents: AdminAuditEvent[];
};

type PriorityCard = {
  title: string;
  value: number;
  hint: string;
  href: string;
  tone: DashboardPriorityTone;
};

function getToneClass(tone: PriorityCard["tone"]) {
  if (tone === "primary") {
    return "tag tag--info";
  }

  if (tone === "warning") {
    return "tag tag--danger";
  }

  return "tag tag--muted";
}

function getRecommendationToneClass(tone: PlatformRecommendationTone) {
  return `tag tag--${tone}`;
}

function getApplicationStatusCounts(applications: RecruiterApplication[]) {
  const counts = new Map<string, number>();

  for (const application of applications) {
    counts.set(application.status, (counts.get(application.status) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .sort((left, right) => right[1] - left[1])
    .slice(0, 5)
    .map(([status, count]) => ({
      label: getApplicationStatusMeta(status).label,
      value: count,
      status
    }));
}

function getPriorityCards(
  applications: RecruiterApplication[],
  users: ManagedUserSummary[],
  emails: TransactionalEmail[]
) {
  const interviewStats = getInterviewDashboardStats(applications);
  const inactiveInternalUsers = users.filter(
    (user) => user.role !== "candidat" && !user.is_active
  ).length;
  const recruitersWithoutOrganization = users.filter(
    (user) => user.role === "recruteur" && !user.organization_id
  ).length;
  const queuedOrFailedEmails = emails.filter((email) =>
    ["queued", "failed"].includes(email.status)
  ).length;

  return [
    {
      title: "Feedbacks a arbitrer",
      value: interviewStats.pendingFeedback,
      hint: "entretiens termines sans synthese exploitable",
      href: "/app/admin/entretiens",
      tone: interviewStats.pendingFeedback > 0 ? "warning" : "neutral"
    },
    {
      title: "Entretiens a superviser",
      value: interviewStats.upcoming,
      hint: "rendez-vous planifies a suivre au niveau plateforme",
      href: "/app/admin/entretiens",
      tone: interviewStats.upcoming > 0 ? "primary" : "neutral"
    },
    {
      title: "Decisions favorables",
      value: interviewStats.favorable,
      hint: "dossiers prets a avancer ou a convertir",
      href: "/app/admin/shortlist",
      tone: interviewStats.favorable > 0 ? "primary" : "neutral"
    },
    {
      title: "Debriefs reserves",
      value: interviewStats.watchout,
      hint: "dossiers a trancher apres retour nuance ou negatif",
      href: "/app/admin/candidatures",
      tone: interviewStats.watchout > 0 ? "warning" : "neutral"
    },
    {
      title: "Comptes internes inactifs",
      value: inactiveInternalUsers + recruitersWithoutOrganization,
      hint: "comptes recruteur ou admin a regulariser",
      href: "/app/admin/utilisateurs",
      tone: inactiveInternalUsers + recruitersWithoutOrganization > 0 ? "warning" : "neutral"
    },
    {
      title: "Flux email a surveiller",
      value: queuedOrFailedEmails,
      hint: "file transactionnelle en attente ou en echec",
      href: "/app/admin/emails",
      tone: queuedOrFailedEmails > 0 ? "primary" : "neutral"
    }
  ] satisfies PriorityCard[];
}

export function AdminSupervisionWorkspace({
  profile,
  snapshot,
  jobs,
  applications,
  candidates,
  users,
  organizations,
  organizationOptions,
  emails,
  notifications,
  auditEvents
}: AdminSupervisionWorkspaceProps) {
  const unreadNotifications = notifications.filter((notification) => !notification.is_read).length;
  const queuedEmails = emails.filter((email) => email.status === "queued").length;
  const failedEmails = emails.filter((email) => email.status === "failed").length;
  const advancedApplications = applications.filter((application) =>
    ["shortlist", "interview", "hired"].includes(application.status)
  ).length;
  const interviewStats = getInterviewDashboardStats(applications);
  const priorityCards = getPriorityCards(applications, users, emails);
  const platformRecommendations = getAdminPlatformRecommendations({
    jobs,
    applications,
    candidates,
    notifications,
    users,
    organizations,
    emails
  });
  const applicationStatusCounts = getApplicationStatusCounts(applications);
  const interviewActionItems = getInterviewDashboardActionItems(applications).slice(0, 6);
  const recentApplications = applications.slice(0, 6);
  const recentJobs = jobs.slice(0, 6);
  const recentNotifications = notifications.slice(0, 5);
  const recentAuditEvents = auditEvents.slice(0, 6);

  return (
    <DashboardShell
      title="Supervision Madajob"
      description="Priorisez les sujets critiques, surveillez les flux sensibles et gardez la plateforme sous controle depuis un vrai centre de supervision."
      profile={profile}
      currentPath="/app/admin"
    >
      <section className="dashboard-grid dashboard-grid--four">
        <article className="panel metric-panel">
          <span>Candidatures</span>
          <strong>{snapshot.metrics.applications}</strong>
          <small>{snapshot.metrics.candidates} candidat(s) et {snapshot.metrics.recruiters} recruteur(s)</small>
        </article>
        <article className="panel metric-panel">
          <span>Entretiens a venir</span>
          <strong>{interviewStats.upcoming}</strong>
          <small>{advancedApplications} dossier(s) deja en phase avancee</small>
        </article>
        <article className="panel metric-panel">
          <span>Feedbacks a arbitrer</span>
          <strong>{interviewStats.pendingFeedback}</strong>
          <small>{interviewStats.favorable} favorables, {interviewStats.watchout} reserves</small>
        </article>
        <article className="panel metric-panel">
          <span>Flux sensibles</span>
          <strong>{unreadNotifications + queuedEmails + failedEmails}</strong>
          <small>{queuedEmails} email(s) en file, {failedEmails} en echec</small>
        </article>
      </section>

      <section className="dashboard-workspace dashboard-workspace--overview">
        <div className="dashboard-column">
          <div className="dashboard-section">
            <div className="dashboard-section__head">
              <div>
                <p className="eyebrow">Priorites critiques</p>
                <h2>Les points a traiter avant qu'ils ne ralentissent la plateforme</h2>
              </div>
              <Link className="text-link" href="/app/admin/audit">
                Ouvrir l'audit interne
              </Link>
            </div>

            <div className="supervision-grid">
              {priorityCards.map((card) => (
                <article key={card.title} className="panel list-card dashboard-card priority-card">
                  <div className="dashboard-card__top">
                    <h3>{card.title}</h3>
                    <span className={getToneClass(card.tone)}>{card.value}</span>
                  </div>
                  <p>{card.hint}</p>
                  <div className="dashboard-action-stack">
                    <Link className="btn btn-ghost btn-block" href={card.href}>
                      Ouvrir le module
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="dashboard-section">
            <div className="dashboard-section__head">
              <div>
                <p className="eyebrow">Actions entretien</p>
                <h2>Les dossiers RH qui demandent un arbitrage rapide</h2>
              </div>
              <Link className="text-link" href="/app/admin/entretiens">
                Ouvrir la supervision des entretiens
              </Link>
            </div>

            <div className="dashboard-list">
              {interviewActionItems.length > 0 ? (
                interviewActionItems.map((item) => (
                  <article key={item.application.id} className="panel list-card dashboard-card">
                    <div className="dashboard-card__top">
                      <div>
                        <p className="eyebrow">Dossier a arbitrer</p>
                        <h3>{item.application.candidate_name}</h3>
                      </div>
                      <span className={getToneClass(item.tone)}>{item.badge}</span>
                    </div>
                    <p>{item.title}</p>
                    <small>{item.hint}</small>
                    <div className="job-card__meta">
                      <span>{item.application.job_title}</span>
                      <span>{item.application.job_location}</span>
                      <span>{getApplicationStatusMeta(item.application.status).label}</span>
                    </div>
                    <DashboardInterviewSignalCard
                      application={item.application}
                      emptyMessage="Le cockpit admin affichera ici les premiers retours structures des que les equipes les saisissent."
                    />
                    <div className="dashboard-action-stack">
                      <Link
                        className="btn btn-ghost btn-block"
                        href={`/app/admin/candidatures/${item.application.id}`}
                      >
                        Ouvrir le dossier complet
                      </Link>
                    </div>
                  </article>
                ))
              ) : (
                <article className="panel list-card dashboard-card dashboard-card--empty">
                  <h3>Aucun arbitrage entretien immediat</h3>
                  <p>Les priorites remonteront ici des qu'un signal d'entretien apparaitra.</p>
                </article>
              )}
            </div>
          </div>

          <div className="dashboard-section">
            <div className="dashboard-section__head">
              <div>
                <p className="eyebrow">Dossiers recents</p>
                <h2>Les candidatures qui viennent d'entrer dans le radar admin</h2>
              </div>
              <Link className="text-link" href="/app/admin/candidatures">
                Voir toutes les candidatures
              </Link>
            </div>

            <div className="dashboard-list">
              {recentApplications.length > 0 ? (
                recentApplications.map((application) => (
                  <article key={application.id} className="panel list-card dashboard-card">
                    <div className="dashboard-card__top">
                      <h3>{application.candidate_name}</h3>
                      <span className="tag">
                        {getApplicationStatusMeta(application.status).label}
                      </span>
                    </div>
                    <p>
                      {application.job_title} - {application.job_location}
                    </p>
                    <div className="job-card__meta">
                      <span>{application.candidate_email}</span>
                      <span>{application.has_cv ? "CV joint" : "CV manquant"}</span>
                      <span>Soumis le {formatDisplayDate(application.created_at)}</span>
                    </div>
                    <DashboardInterviewSignalCard application={application} />
                    <div className="dashboard-action-stack">
                      <Link
                        className="btn btn-ghost btn-block"
                        href={`/app/admin/candidatures/${application.id}`}
                      >
                        Ouvrir le dossier complet
                      </Link>
                    </div>
                  </article>
                ))
              ) : (
                <article className="panel list-card dashboard-card dashboard-card--empty">
                  <h3>Aucune candidature recente</h3>
                  <p>Les nouveaux dossiers apparaitront ici automatiquement.</p>
                </article>
              )}
            </div>
          </div>

          <div className="dashboard-section">
            <div className="dashboard-section__head">
              <div>
                <p className="eyebrow">Annonces a surveiller</p>
                <h2>Les offres les plus recentes visibles dans le cockpit</h2>
              </div>
              <Link className="text-link" href="/carrieres">
                Consulter la vitrine carriere
              </Link>
            </div>

            <div className="dashboard-list">
              {recentJobs.length > 0 ? (
                recentJobs.map((job) => (
                  <article key={job.id} className="panel list-card dashboard-card">
                    <div className="dashboard-card__top">
                      <h3>{job.title}</h3>
                      <span className="tag">{job.status}</span>
                    </div>
                    <div className="job-card__meta">
                      <span>{job.location}</span>
                      <span>{job.contract_type}</span>
                      <span>{job.work_mode}</span>
                    </div>
                    <small>
                      {job.published_at
                        ? `Publication : ${formatDisplayDate(job.published_at)}`
                        : "Non encore publiee"}
                    </small>
                    <div className="dashboard-action-stack">
                      <Link className="btn btn-ghost btn-block" href={`/app/admin/offres/${job.id}`}>
                        Gerer cette offre
                      </Link>
                    </div>
                  </article>
                ))
              ) : (
                <article className="panel list-card dashboard-card dashboard-card--empty">
                  <h3>Aucune offre recente</h3>
                  <p>Les annonces visibles apparaitront ici quand elles seront disponibles.</p>
                </article>
              )}
            </div>
          </div>
        </div>

        <aside className="dashboard-column dashboard-column--aside">
          <JobCreateForm
            roleLabel="Admin"
            organizationOptions={organizationOptions}
            defaultOrganizationId={profile.organization_id}
          />

          <div className="dashboard-form">
            <div className="dashboard-form__head">
              <div>
                <p className="eyebrow">Recommandations Madajob</p>
                <h2>Les leviers a traiter en priorite</h2>
              </div>
              <span className="tag">{platformRecommendations.length} action(s)</span>
            </div>

            <div className="reporting-breakdown">
              {platformRecommendations.length > 0 ? (
                platformRecommendations.map((recommendation) => (
                  <div key={recommendation.id} className="document-card reporting-list__item">
                    <div className="reporting-list__head">
                      <strong>{recommendation.title}</strong>
                      <span className={getRecommendationToneClass(recommendation.tone)}>
                        {recommendation.count}
                      </span>
                    </div>
                    <p>{recommendation.body}</p>
                    <div className="job-card__meta">
                      <span>{recommendation.meta}</span>
                    </div>
                    <Link className="text-link" href={recommendation.href}>
                      {recommendation.cta}
                    </Link>
                  </div>
                ))
              ) : (
                <div className="document-card">
                  <strong>Aucune recommandation critique</strong>
                  <p>Les signaux prioritaires apparaitront ici quand la plateforme en aura besoin.</p>
                </div>
              )}
            </div>
          </div>

          <div className="dashboard-form">
            <div className="dashboard-form__head">
              <div>
                <p className="eyebrow">Signal entretien</p>
                <h2>Le niveau de traction RH a l'echelle plateforme</h2>
              </div>
              <span className="tag">{interviewStats.upcoming + interviewStats.pendingFeedback} priorite(s)</span>
            </div>

            <div className="reporting-breakdown">
              <div className="document-card reporting-list__item">
                <div className="reporting-list__head">
                  <strong>Entretiens planifies</strong>
                  <span className="tag tag--info">{interviewStats.upcoming}</span>
                </div>
                <p>rendez-vous a suivre ou a accompagner cote ops RH</p>
              </div>

              <div className="document-card reporting-list__item">
                <div className="reporting-list__head">
                  <strong>Feedbacks manquants</strong>
                  <span className="tag tag--danger">{interviewStats.pendingFeedback}</span>
                </div>
                <p>compte-rendus a recuperer avant que le pipeline ne se fige</p>
              </div>

              <div className="document-card reporting-list__item">
                <div className="reporting-list__head">
                  <strong>Retours favorables</strong>
                  <span className="tag tag--success">{interviewStats.favorable}</span>
                </div>
                <p>dossiers avec avis positif a faire progresser</p>
              </div>

              <div className="document-card reporting-list__item">
                <div className="reporting-list__head">
                  <strong>Retours reserves</strong>
                  <span className="tag tag--warning">{interviewStats.watchout}</span>
                </div>
                <p>situations a arbitrer avec les recruteurs ou l'admin RH</p>
              </div>
            </div>
          </div>

          <div className="dashboard-form">
            <div className="dashboard-form__head">
              <div>
                <p className="eyebrow">Flux sensibles</p>
                <h2>Notifications, emails et audit a surveiller de pres</h2>
              </div>
              <span className="tag">{recentNotifications.length + recentAuditEvents.length} signal(s)</span>
            </div>

            <div className="reporting-breakdown">
              <div className="document-card reporting-list__item">
                <div className="reporting-list__head">
                  <strong>Notifications admin</strong>
                  <span className="tag tag--info">{unreadNotifications}</span>
                </div>
                <p>{unreadNotifications > 0 ? "notifications non lues a ouvrir" : "aucune alerte non lue"}</p>
              </div>

              <div className="document-card reporting-list__item">
                <div className="reporting-list__head">
                  <strong>Emails transactionnels</strong>
                  <span className="tag tag--muted">{queuedEmails + failedEmails}</span>
                </div>
                <p>
                  {queuedEmails} en file, {failedEmails} en echec
                </p>
              </div>

              <div className="document-card reporting-list__item">
                <div className="reporting-list__head">
                  <strong>Offres actives</strong>
                  <span className="tag tag--muted">{snapshot.metrics.activeJobs}</span>
                </div>
                <p>{jobs.filter((job) => job.status === "draft").length} brouillon(s) en attente d'arbitrage</p>
              </div>
            </div>
          </div>

          <div className="dashboard-form">
            <div className="dashboard-form__head">
              <div>
                <p className="eyebrow">Lecture pipeline</p>
                <h2>Les statuts qui dominent en ce moment</h2>
              </div>
              <span className="tag">{applicationStatusCounts.length} statut(s)</span>
            </div>

            <div className="reporting-breakdown">
              {applicationStatusCounts.length > 0 ? (
                applicationStatusCounts.map((entry) => (
                  <div key={entry.status} className="document-card reporting-list__item">
                    <div className="reporting-list__head">
                      <strong>{entry.label}</strong>
                      <span className="tag tag--muted">{entry.value}</span>
                    </div>
                    <p>code statut : {entry.status}</p>
                  </div>
                ))
              ) : (
                <div className="document-card">
                  <strong>Aucun pipeline actif</strong>
                  <p>Les volumes de candidatures apparaitront ici automatiquement.</p>
                </div>
              )}
            </div>
          </div>

          <div className="dashboard-form">
            <div className="dashboard-form__head">
              <div>
                <p className="eyebrow">Audit recent</p>
                <h2>Les derniers mouvements critiques journalises</h2>
              </div>
              <span className="tag">{recentAuditEvents.length} evenement(s)</span>
            </div>

            <div className="reporting-breakdown">
              {recentAuditEvents.length > 0 ? (
                recentAuditEvents.map((event) => (
                  <div key={event.id} className="document-card reporting-list__item">
                    <div className="reporting-list__head">
                      <strong>{event.entity_label}</strong>
                      <span className="tag tag--muted">{event.action}</span>
                    </div>
                    <p>
                      {event.actor_name} - {formatDisplayDate(event.created_at)}
                    </p>
                    {event.entity_href ? (
                      <Link className="text-link" href={event.entity_href}>
                        Ouvrir l'element
                      </Link>
                    ) : null}
                  </div>
                ))
              ) : (
                <div className="document-card">
                  <strong>Aucun audit recent</strong>
                  <p>Les actions critiques remonteront ici automatiquement.</p>
                </div>
              )}
            </div>
          </div>

          <div className="panel dashboard-sidecard">
            <p className="eyebrow">Commandes rapides</p>
            <h2>Gardez les modules strategiques a portee de clic.</h2>
            <div className="dashboard-action-stack">
              <Link className="btn btn-primary btn-block" href="/app/admin/offres">
                Piloter toutes les offres
              </Link>
              <Link className="btn btn-secondary btn-block" href="/app/admin/entretiens">
                Superviser les entretiens
              </Link>
              <Link className="btn btn-secondary btn-block" href="/app/admin/candidatures">
                Ouvrir toutes les candidatures
              </Link>
              <Link className="btn btn-secondary btn-block" href="/app/admin/organisations">
                Ouvrir les organisations
              </Link>
              <Link className="btn btn-secondary btn-block" href="/app/admin/utilisateurs">
                Gerer les utilisateurs
              </Link>
              <Link className="btn btn-secondary btn-block" href="/app/admin/emails">
                Suivre les emails transactionnels
              </Link>
              <Link className="btn btn-secondary btn-block" href="/app/admin/reporting">
                Ouvrir le reporting avance
              </Link>
              <Link className="btn btn-secondary btn-block" href="/">
                Retour a la vitrine institutionnelle
              </Link>
            </div>
          </div>
        </aside>
      </section>
    </DashboardShell>
  );
}
