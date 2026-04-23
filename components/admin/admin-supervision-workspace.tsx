import Link from "next/link";

import { DashboardShell } from "@/components/dashboard/shell";
import { JobCreateForm } from "@/components/jobs/job-create-form";
import { getApplicationStatusMeta } from "@/lib/application-status";
import { formatDisplayDate } from "@/lib/format";
import type {
  AdminAuditEvent,
  AppNotification,
  Job,
  ManagedOrganizationSummary,
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
  jobs: Job[];
  applications: RecruiterApplication[];
  users: ManagedUserSummary[];
  organizations: ManagedOrganizationSummary[];
  emails: TransactionalEmail[];
  notifications: AppNotification[];
  auditEvents: AdminAuditEvent[];
};

type PriorityCard = {
  title: string;
  value: number;
  hint: string;
  href: string;
  tone: "primary" | "warning" | "neutral";
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
  jobs: Job[],
  applications: RecruiterApplication[],
  users: ManagedUserSummary[],
  organizations: ManagedOrganizationSummary[],
  emails: TransactionalEmail[]
) {
  const draftJobs = jobs.filter((job) => job.status === "draft").length;
  const publishedWithoutApplications = jobs.filter(
    (job) =>
      job.status === "published" &&
      !applications.some((application) => application.job_id === job.id)
  ).length;
  const inactiveInternalUsers = users.filter(
    (user) => user.role !== "candidat" && !user.is_active
  ).length;
  const recruitersWithoutOrganization = users.filter(
    (user) => user.role === "recruteur" && !user.organization_id
  ).length;
  const organizationsWithoutRecruiters = organizations.filter(
    (organization) => organization.recruiters_count === 0
  ).length;
  const queuedOrFailedEmails = emails.filter((email) =>
    ["queued", "failed"].includes(email.status)
  ).length;

  return [
    {
      title: "Offres a publier",
      value: draftJobs,
      hint: "brouillons encore en attente d'arbitrage",
      href: "/app/admin/offres",
      tone: draftJobs > 0 ? "warning" : "neutral"
    },
    {
      title: "Offres sans retour",
      value: publishedWithoutApplications,
      hint: "annonces publiees sans candidature recente",
      href: "/app/admin/offres",
      tone: publishedWithoutApplications > 0 ? "warning" : "neutral"
    },
    {
      title: "Comptes internes inactifs",
      value: inactiveInternalUsers,
      hint: "recruteurs ou admins a revalider",
      href: "/app/admin/utilisateurs",
      tone: inactiveInternalUsers > 0 ? "warning" : "neutral"
    },
    {
      title: "Recruteurs sans organisation",
      value: recruitersWithoutOrganization,
      hint: "comptes incomplets a corriger",
      href: "/app/admin/utilisateurs",
      tone: recruitersWithoutOrganization > 0 ? "warning" : "neutral"
    },
    {
      title: "Organisations sans recruteur",
      value: organizationsWithoutRecruiters,
      hint: "entites a rattacher a une equipe",
      href: "/app/admin/organisations",
      tone: organizationsWithoutRecruiters > 0 ? "primary" : "neutral"
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
  users,
  organizations,
  emails,
  notifications,
  auditEvents
}: AdminSupervisionWorkspaceProps) {
  const unreadNotifications = notifications.filter((notification) => !notification.is_read).length;
  const queuedEmails = emails.filter((email) => email.status === "queued").length;
  const failedEmails = emails.filter((email) => email.status === "failed").length;
  const applicationsWithoutCv = applications.filter((application) => !application.has_cv).length;
  const advancedApplications = applications.filter((application) =>
    ["shortlist", "interview", "hired"].includes(application.status)
  ).length;
  const priorityCards = getPriorityCards(
    jobs,
    applications,
    users,
    organizations,
    emails
  );
  const applicationStatusCounts = getApplicationStatusCounts(applications);
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
          <span>Candidats</span>
          <strong>{snapshot.metrics.candidates}</strong>
          <small>profils suivis dans l'ecosysteme</small>
        </article>
        <article className="panel metric-panel">
          <span>Recruteurs</span>
          <strong>{snapshot.metrics.recruiters}</strong>
          <small>comptes recruteur actifs</small>
        </article>
        <article className="panel metric-panel">
          <span>Offres actives</span>
          <strong>{snapshot.metrics.activeJobs}</strong>
          <small>{jobs.filter((job) => job.status === "draft").length} brouillon(s) en attente</small>
        </article>
        <article className="panel metric-panel">
          <span>Candidatures</span>
          <strong>{snapshot.metrics.applications}</strong>
          <small>{advancedApplications} dossier(s) avance(s)</small>
        </article>
      </section>

      <section className="dashboard-workspace">
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
          <JobCreateForm roleLabel="Admin" />

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
                  <strong>Dossiers sans CV</strong>
                  <span className="tag tag--danger">{applicationsWithoutCv}</span>
                </div>
                <p>candidatures recues sans CV joint exploitable</p>
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
