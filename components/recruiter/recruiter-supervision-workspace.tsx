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
import type {
  AppNotification,
  ManagedCandidateSummary,
  ManagedJob,
  Profile,
  RecruiterApplication
} from "@/lib/types";

type RecruiterSnapshotData = {
  jobs: {
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
  }[];
  metrics: {
    activeJobs: number;
    applications: number;
    pipeline: number;
  };
};

type RecruiterSupervisionWorkspaceProps = {
  profile: Profile;
  snapshot: RecruiterSnapshotData;
  jobs: ManagedJob[];
  applications: RecruiterApplication[];
  candidates: ManagedCandidateSummary[];
  notifications: AppNotification[];
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
  jobs: ManagedJob[],
  applications: RecruiterApplication[],
  notifications: AppNotification[]
) {
  const interviewStats = getInterviewDashboardStats(applications);
  const publishedWithoutApplications = jobs.filter(
    (job) => job.status === "published" && job.applications_count === 0
  ).length;
  const unreadNotifications = notifications.filter((notification) => !notification.is_read).length;

  return [
    {
      title: "Feedbacks a saisir",
      value: interviewStats.pendingFeedback,
      hint: "entretiens termines sans compte-rendu structure",
      href: "/app/recruteur/entretiens",
      tone: interviewStats.pendingFeedback > 0 ? "warning" : "neutral"
    },
    {
      title: "Entretiens a preparer",
      value: interviewStats.upcoming,
      hint: "rendez-vous planifies a cadrer avec votre equipe",
      href: "/app/recruteur/entretiens",
      tone: interviewStats.upcoming > 0 ? "primary" : "neutral"
    },
    {
      title: "Decisions favorables",
      value: interviewStats.favorable,
      hint: "feedbacks positifs a faire avancer rapidement",
      href: "/app/recruteur/shortlist",
      tone: interviewStats.favorable > 0 ? "primary" : "neutral"
    },
    {
      title: "Debriefs reserves",
      value: interviewStats.watchout,
      hint: "dossiers a arbitrer apres retour nuance ou defavorable",
      href: "/app/recruteur/candidatures",
      tone: interviewStats.watchout > 0 ? "warning" : "neutral"
    },
    {
      title: "Offres sans candidatures",
      value: publishedWithoutApplications,
      hint: "annonces actives encore sans retour candidat",
      href: "/app/recruteur/offres",
      tone: publishedWithoutApplications > 0 ? "warning" : "neutral"
    },
    {
      title: "Alertes internes",
      value: unreadNotifications,
      hint: "notifications non lues dans votre espace",
      href: "/app/recruteur/notifications",
      tone: unreadNotifications > 0 ? "primary" : "neutral"
    }
  ] satisfies PriorityCard[];
}

export function RecruiterSupervisionWorkspace({
  profile,
  snapshot,
  jobs,
  applications,
  candidates,
  notifications
}: RecruiterSupervisionWorkspaceProps) {
  const draftJobs = jobs.filter((job) => job.status === "draft").length;
  const advancedApplications = applications.filter((application) =>
    ["shortlist", "interview", "hired"].includes(application.status)
  ).length;
  const applicationsWithCv = applications.filter((application) => application.has_cv).length;
  const interviewStats = getInterviewDashboardStats(applications);
  const priorityCards = getPriorityCards(jobs, applications, notifications);
  const applicationStatusCounts = getApplicationStatusCounts(applications);
  const interviewActionItems = getInterviewDashboardActionItems(applications).slice(0, 6);
  const recentApplications = applications.slice(0, 6);
  const recentJobs = jobs.slice(0, 6);
  const topCandidates = candidates
    .slice()
    .sort((left, right) => {
      if (right.applications_count !== left.applications_count) {
        return right.applications_count - left.applications_count;
      }

      return right.profile_completion - left.profile_completion;
    })
    .slice(0, 5);
  const recentNotifications = notifications.slice(0, 5);

  return (
    <DashboardShell
      title="Votre espace recruteur"
      description="Priorisez vos offres, surveillez votre pipeline et pilotez les dossiers sensibles depuis un vrai cockpit de recrutement."
      profile={profile}
      currentPath="/app/recruteur"
    >
      <section className="dashboard-grid dashboard-grid--four">
        <article className="panel metric-panel">
          <span>Offres actives</span>
          <strong>{snapshot.metrics.activeJobs}</strong>
          <small>{draftJobs} brouillon(s) a publier</small>
        </article>
        <article className="panel metric-panel">
          <span>Candidatures</span>
          <strong>{snapshot.metrics.applications}</strong>
          <small>{applicationsWithCv} dossier(s) avec CV joint, {advancedApplications} avance(s)</small>
        </article>
        <article className="panel metric-panel">
          <span>Entretiens a venir</span>
          <strong>{interviewStats.upcoming}</strong>
          <small>{interviewStats.ready} feedback(s) deja saisi(s)</small>
        </article>
        <article className="panel metric-panel">
          <span>Feedbacks a saisir</span>
          <strong>{interviewStats.pendingFeedback}</strong>
          <small>{interviewStats.favorable} dossier(s) favorables a pousser</small>
        </article>
      </section>

      <section className="dashboard-workspace">
        <div className="dashboard-column">
          <div className="dashboard-section">
            <div className="dashboard-section__head">
              <div>
                <p className="eyebrow">Priorites du jour</p>
                <h2>Les points a traiter pour garder votre pipeline fluide</h2>
              </div>
              <Link className="text-link" href="/app/recruteur/candidatures">
                Ouvrir toutes les candidatures
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
                <h2>Les dossiers a faire bouger maintenant</h2>
              </div>
              <Link className="text-link" href="/app/recruteur/entretiens">
                Ouvrir le module entretiens
              </Link>
            </div>

            <div className="dashboard-list">
              {interviewActionItems.length > 0 ? (
                interviewActionItems.map((item) => (
                  <article key={item.application.id} className="panel list-card dashboard-card">
                    <div className="dashboard-card__top">
                      <div>
                        <p className="eyebrow">Action prioritaire</p>
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
                      emptyMessage="Ajoutez un retour structure des que le premier entretien aura eu lieu."
                    />
                    <div className="dashboard-action-stack">
                      <Link
                        className="btn btn-ghost btn-block"
                        href={`/app/recruteur/candidatures/${item.application.id}`}
                      >
                        Ouvrir le dossier complet
                      </Link>
                    </div>
                  </article>
                ))
              ) : (
                <article className="panel list-card dashboard-card dashboard-card--empty">
                  <h3>Aucune action entretien immediate</h3>
                  <p>Les dossiers prioritaires remonteront ici des qu'un signal apparaitra.</p>
                </article>
              )}
            </div>
          </div>

          <div className="dashboard-section">
            <div className="dashboard-section__head">
              <div>
                <p className="eyebrow">Dossiers recents</p>
                <h2>Les candidatures qui viennent d'arriver dans votre perimetre</h2>
              </div>
              <Link className="text-link" href="/app/recruteur/candidatures">
                Voir tout le pipeline
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
                        href={`/app/recruteur/candidatures/${application.id}`}
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
                <p className="eyebrow">Offres a surveiller</p>
                <h2>Les annonces les plus recentes de votre organisation</h2>
              </div>
              <Link className="text-link" href="/carrieres">
                Ouvrir le site carriere
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
                      <span>{job.applications_count} candidature(s)</span>
                    </div>
                    <small>
                      {job.published_at
                        ? `Publication : ${formatDisplayDate(job.published_at)}`
                        : "Non encore publiee"}
                    </small>
                    <div className="dashboard-action-stack">
                      <Link className="btn btn-ghost btn-block" href={`/app/recruteur/offres/${job.id}`}>
                        Gerer cette offre
                      </Link>
                    </div>
                  </article>
                ))
              ) : (
                <article className="panel list-card dashboard-card dashboard-card--empty">
                  <h3>Aucune offre pour le moment</h3>
                  <p>Les offres de votre organisation apparaitront ici automatiquement.</p>
                </article>
              )}
            </div>
          </div>
        </div>

        <aside className="dashboard-column dashboard-column--aside">
          <JobCreateForm roleLabel="Recruteur" />

          <div className="dashboard-form">
            <div className="dashboard-form__head">
              <div>
                <p className="eyebrow">Signal entretien</p>
                <h2>Les marqueurs qui doivent guider votre journee</h2>
              </div>
              <span className="tag">{interviewStats.upcoming + interviewStats.pendingFeedback} priorite(s)</span>
            </div>

            <div className="reporting-breakdown">
              <div className="document-card reporting-list__item">
                <div className="reporting-list__head">
                  <strong>Entretiens planifies</strong>
                  <span className="tag tag--info">{interviewStats.upcoming}</span>
                </div>
                <p>dossiers avec rendez-vous deja programme</p>
              </div>

              <div className="document-card reporting-list__item">
                <div className="reporting-list__head">
                  <strong>Feedbacks a saisir</strong>
                  <span className="tag tag--danger">{interviewStats.pendingFeedback}</span>
                </div>
                <p>compte-rendus a enregistrer pour ne pas bloquer la suite</p>
              </div>

              <div className="document-card reporting-list__item">
                <div className="reporting-list__head">
                  <strong>Feux verts entretien</strong>
                  <span className="tag tag--success">{interviewStats.favorable}</span>
                </div>
                <p>dossiers favorables a pousser vers la prochaine etape</p>
              </div>

              <div className="document-card reporting-list__item">
                <div className="reporting-list__head">
                  <strong>Debriefs reserves</strong>
                  <span className="tag tag--warning">{interviewStats.watchout}</span>
                </div>
                <p>retours nuancés ou defavorables a arbitrer en equipe</p>
              </div>
            </div>
          </div>

          <div className="dashboard-form">
            <div className="dashboard-form__head">
              <div>
                <p className="eyebrow">Lecture pipeline</p>
                <h2>Les statuts qui dominent dans votre flux</h2>
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
                <p className="eyebrow">Profils a fort signal</p>
                <h2>Les candidats qui remontent le plus dans votre base</h2>
              </div>
              <span className="tag">{topCandidates.length} profil(s)</span>
            </div>

            <div className="reporting-breakdown">
              {topCandidates.length > 0 ? (
                topCandidates.map((candidate) => (
                  <div key={candidate.id} className="document-card reporting-list__item">
                    <div className="reporting-list__head">
                      <strong>{candidate.full_name}</strong>
                      <span className="tag tag--info">{candidate.profile_completion}%</span>
                    </div>
                    <p>{candidate.current_position || candidate.desired_position || "Profil candidat"}</p>
                    <div className="job-card__meta">
                      <span>{candidate.city || "Ville non renseignee"}</span>
                      <span>{candidate.applications_count} dossier(s)</span>
                      <span>{candidate.has_primary_cv ? "CV principal" : "Sans CV principal"}</span>
                    </div>
                    <Link className="text-link" href={`/app/recruteur/candidats/${candidate.id}`}>
                      Ouvrir le profil
                    </Link>
                  </div>
                ))
              ) : (
                <div className="document-card">
                  <strong>Aucun profil prioritaire</strong>
                  <p>Les meilleurs profils de votre base apparaitront ici automatiquement.</p>
                </div>
              )}
            </div>
          </div>

          <div className="dashboard-form">
            <div className="dashboard-form__head">
              <div>
                <p className="eyebrow">Alertes internes</p>
                <h2>Les notifications qui demandent votre attention</h2>
              </div>
              <span className="tag">{recentNotifications.length} element(s)</span>
            </div>

            <div className="reporting-breakdown">
              {recentNotifications.length > 0 ? (
                recentNotifications.map((notification) => (
                  <div key={notification.id} className="document-card reporting-list__item">
                    <div className="reporting-list__head">
                      <strong>{notification.title}</strong>
                      <span className={`tag ${notification.is_read ? "tag--muted" : "tag--info"}`}>
                        {notification.is_read ? "Lue" : "Non lue"}
                      </span>
                    </div>
                    <p>{notification.body}</p>
                    <div className="job-card__meta">
                      <span>{notification.kind}</span>
                      <span>{formatDisplayDate(notification.created_at)}</span>
                    </div>
                    {notification.link_href ? (
                      <Link className="text-link" href={notification.link_href}>
                        Ouvrir l'ecran lie
                      </Link>
                    ) : null}
                  </div>
                ))
              ) : (
                <div className="document-card">
                  <strong>Aucune alerte recente</strong>
                  <p>Les notifications internes apparaitront ici automatiquement.</p>
                </div>
              )}
            </div>
          </div>

          <div className="panel dashboard-sidecard">
            <p className="eyebrow">Commandes rapides</p>
            <h2>Gardez vos modules recrutement a portee de clic.</h2>
            <div className="dashboard-action-stack">
              <Link className="btn btn-primary btn-block" href="/app/recruteur/offres">
                Gerer toutes mes offres
              </Link>
              <Link className="btn btn-secondary btn-block" href="/app/recruteur/entretiens">
                Ouvrir les entretiens
              </Link>
              <Link className="btn btn-secondary btn-block" href="/app/recruteur/candidatures">
                Ouvrir toutes les candidatures
              </Link>
              <Link className="btn btn-secondary btn-block" href="/app/recruteur/shortlist">
                Ouvrir la shortlist
              </Link>
              <Link className="btn btn-secondary btn-block" href="/app/recruteur/candidats">
                Ouvrir la base candidats
              </Link>
              <Link className="btn btn-secondary btn-block" href="/app/recruteur/reporting">
                Ouvrir le reporting avance
              </Link>
              <Link className="btn btn-secondary btn-block" href="/entreprise">
                Retour a l'offre entreprise
              </Link>
            </div>
          </div>
        </aside>
      </section>
    </DashboardShell>
  );
}
