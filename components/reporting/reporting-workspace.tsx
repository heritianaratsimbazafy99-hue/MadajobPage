import { DashboardShell } from "@/components/dashboard/shell";
import { getApplicationStatusMeta } from "@/lib/application-status";
import {
  getReportingAlerts,
  getReportingExportShortcuts,
  getReportingMetricCards,
  getReportingWindowSummaries,
  getTopReportingJobConversions
} from "@/lib/managed-reporting-insights";
import type {
  ManagedCandidateSummary,
  ManagedJob,
  Profile,
  RecruiterApplication
} from "@/lib/types";

type ReportingWorkspaceProps = {
  profile: Profile;
  currentPath: string;
  title: string;
  description: string;
  jobs: ManagedJob[];
  candidates: ManagedCandidateSummary[];
  applications: RecruiterApplication[];
};

type CountEntry = {
  label: string;
  value: number;
  hint?: string;
};

function formatPercent(value: number, total: number) {
  if (total <= 0) {
    return "0%";
  }

  return `${Math.round((value / total) * 100)}%`;
}

function getToneClass(tone: "info" | "success" | "danger" | "muted") {
  if (tone === "danger") {
    return "tag tag--danger";
  }

  if (tone === "success") {
    return "tag tag--success";
  }

  if (tone === "info") {
    return "tag tag--info";
  }

  return "tag tag--muted";
}

function getButtonClass(tone: "primary" | "secondary" | "ghost") {
  if (tone === "primary") {
    return "btn btn-primary btn-block";
  }

  if (tone === "secondary") {
    return "btn btn-secondary btn-block";
  }

  return "btn btn-ghost btn-block";
}

function getApplicationStatusCount(applications: RecruiterApplication[]) {
  const counts = new Map<string, number>();

  for (const application of applications) {
    counts.set(application.status, (counts.get(application.status) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .sort((left, right) => right[1] - left[1])
    .map(([status, count]) => ({
      label: getApplicationStatusMeta(status).label,
      value: count,
      hint: status
    }));
}

function getJobStatusCount(jobs: ManagedJob[]) {
  const counts = new Map<string, number>();

  for (const job of jobs) {
    counts.set(job.status, (counts.get(job.status) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .sort((left, right) => right[1] - left[1])
    .map(([status, count]) => ({
      label: status,
      value: count
    }));
}

function getTopCandidateCities(candidates: ManagedCandidateSummary[]) {
  const counts = new Map<string, number>();

  for (const candidate of candidates) {
    const city = candidate.city.trim();

    if (!city) {
      continue;
    }

    counts.set(city, (counts.get(city) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .sort((left, right) => right[1] - left[1])
    .slice(0, 5)
    .map(([label, value]) => ({ label, value }));
}

function getTopJobSignals(jobs: ManagedJob[], field: "location" | "sector") {
  const counts = new Map<string, number>();

  for (const job of jobs) {
    const value = job[field].trim();

    if (!value) {
      continue;
    }

    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .sort((left, right) => right[1] - left[1])
    .slice(0, 5)
    .map(([label, value]) => ({ label, value }));
}

function getCandidateCompletionBuckets(candidates: ManagedCandidateSummary[]) {
  const buckets = {
    ready: 0,
    progressing: 0,
    low: 0
  };

  for (const candidate of candidates) {
    if (candidate.profile_completion >= 80) {
      buckets.ready += 1;
      continue;
    }

    if (candidate.profile_completion >= 50) {
      buckets.progressing += 1;
      continue;
    }

    buckets.low += 1;
  }

  return [
    {
      label: "Profils prets",
      value: buckets.ready,
      hint: "80% et plus"
    },
    {
      label: "Profils en progression",
      value: buckets.progressing,
      hint: "50% a 79%"
    },
    {
      label: "Profils a completer",
      value: buckets.low,
      hint: "moins de 50%"
    }
  ] satisfies CountEntry[];
}

export function ReportingWorkspace({
  profile,
  currentPath,
  title,
  description,
  jobs,
  candidates,
  applications
}: ReportingWorkspaceProps) {
  const applicationsWithCv = applications.filter((item) => item.has_cv).length;
  const publishedJobs = jobs.filter((job) => job.status === "published").length;
  const advancedApplications = applications.filter((item) =>
    ["shortlist", "interview", "hired"].includes(item.status)
  ).length;
  const windowSummaries = getReportingWindowSummaries(jobs, applications, candidates);
  const metricCards = getReportingMetricCards(jobs, applications, candidates);
  const alerts = getReportingAlerts(applications);
  const exportShortcuts = getReportingExportShortcuts(profile, jobs, applications, candidates);
  const topJobConversions = getTopReportingJobConversions(applications);
  const applicationStatusCounts = getApplicationStatusCount(applications);
  const jobStatusCounts = getJobStatusCount(jobs);
  const topCities = getTopCandidateCities(candidates);
  const topLocations = getTopJobSignals(jobs, "location");
  const topSectors = getTopJobSignals(jobs, "sector");
  const completionBuckets = getCandidateCompletionBuckets(candidates);
  const isAdminView = profile.role === "admin";

  return (
    <DashboardShell
      title={title}
      description={description}
      profile={profile}
      currentPath={currentPath}
    >
      <section className="dashboard-grid dashboard-grid--four">
        <article className="panel metric-panel">
          <span>Offres sous pilotage</span>
          <strong>{jobs.length}</strong>
          <small>{publishedJobs} publiee(s) et visibles dans le reporting</small>
        </article>
        <article className="panel metric-panel">
          <span>Candidatures sous suivi</span>
          <strong>{applications.length}</strong>
          <small>{advancedApplications} dossier(s) deja avances</small>
        </article>
        <article className="panel metric-panel">
          <span>Candidats exploitables</span>
          <strong>{candidates.length}</strong>
          <small>{completionBuckets[0]?.value ?? 0} profil(s) deja prets a activer</small>
        </article>
        <article className="panel metric-panel">
          <span>Couverture CV</span>
          <strong>{formatPercent(applicationsWithCv, applications.length)}</strong>
          <small>{applications.length - applicationsWithCv} candidature(s) sans CV joint</small>
        </article>
      </section>

      <section className="dashboard-workspace">
        <div className="dashboard-column">
          <div className="dashboard-form">
            <div className="dashboard-form__head">
              <div>
                <p className="eyebrow">Syntheses par periode</p>
                <h2>Lisez rapidement les volumes et conversions sur plusieurs fenetres</h2>
              </div>
              <span className="tag">{windowSummaries.length} vue(s)</span>
            </div>

            <div className="reporting-grid">
              {windowSummaries.map((summary) => (
                <article key={summary.key} className="document-card reporting-card">
                  <div className="reporting-list__head">
                    <strong>{summary.label}</strong>
                    <span className="tag tag--info">{summary.applicationsCount}</span>
                  </div>
                  <p>{summary.description}</p>
                  <div className="document-meta">
                    <span>{summary.jobsCount} offre(s)</span>
                    <span>{summary.publishedJobsCount} publiee(s)</span>
                    <span>{summary.shortlistedCount} shortlist / avance(s)</span>
                    <span>{summary.interviewsCount} entretien(s)</span>
                    <span>{summary.hiredCount} retenue(s)</span>
                    <span>{summary.readyCandidatesCount} candidat(s) prets</span>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="dashboard-form">
            <div className="dashboard-form__head">
              <div>
                <p className="eyebrow">Exports cibles</p>
                <h2>Declenchez des CSV plus precis pour vos reprises et analyses</h2>
              </div>
              <span className="tag">CSV</span>
            </div>

            <div className="reporting-grid">
              {exportShortcuts.map((shortcut) => (
                <article key={shortcut.title} className="document-card reporting-card">
                  <strong>{shortcut.title}</strong>
                  <p>{shortcut.description}</p>
                  <a className={getButtonClass(shortcut.tone)} href={shortcut.href}>
                    {shortcut.cta}
                  </a>
                </article>
              ))}
            </div>

            <p className="form-caption">
              Chaque export respecte automatiquement les droits du compte connecte et le perimetre{" "}
              {isAdminView ? "plateforme" : "recruteur"} visible.
            </p>
          </div>

          <div className="dashboard-form">
            <div className="dashboard-form__head">
              <div>
                <p className="eyebrow">Conversion pipeline</p>
                <h2>Reperez vite la qualite du funnel, de la diffusion jusqu'a l'embauche</h2>
              </div>
              <span className="tag">{metricCards.length} signal(aux)</span>
            </div>

            <div className="reporting-grid">
              {metricCards.map((card) => (
                <article key={card.title} className="document-card reporting-card">
                  <div className="reporting-list__head">
                    <strong>{card.title}</strong>
                    <span className={getToneClass(card.tone)}>{card.value}</span>
                  </div>
                  <p>{card.hint}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="dashboard-form">
            <div className="dashboard-form__head">
              <div>
                <p className="eyebrow">Postes qui convertissent</p>
                <h2>Top offres par progression shortlist, entretiens et embauches</h2>
              </div>
              <span className="tag">{topJobConversions.length} poste(s)</span>
            </div>

            <div className="reporting-breakdown">
              {topJobConversions.length > 0 ? (
                topJobConversions.map((entry) => (
                  <div key={`${entry.label}-${entry.location}`} className="document-card reporting-list__item">
                    <div className="reporting-list__head">
                      <strong>{entry.label}</strong>
                      <span className="tag tag--success">{entry.advancedCount} avance(s)</span>
                    </div>
                    <p>{entry.location || "Lieu non renseigne"}</p>
                    <div className="document-meta">
                      <span>{entry.applicationsCount} candidature(s)</span>
                      <span>{entry.interviewedCount} entretien(s)</span>
                      <span>{entry.hiredCount} embauche(s)</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="document-card">
                  <strong>Aucune offre ne ressort encore</strong>
                  <p>Les postes qui convertissent le mieux apparaitront ici automatiquement.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <aside className="dashboard-column dashboard-column--aside">
          <div className="dashboard-form">
            <div className="dashboard-form__head">
              <div>
                <p className="eyebrow">Alertes conversion</p>
                <h2>Ce qui merite une action rapide dans le pipeline</h2>
              </div>
              <span className="tag">{alerts.length} lecture(s)</span>
            </div>

            <div className="reporting-breakdown">
              {alerts.map((alert) => (
                <div key={alert.title} className="document-card reporting-list__item">
                  <div className="reporting-list__head">
                    <strong>{alert.title}</strong>
                    <span className={getToneClass(alert.tone)}>{alert.value}</span>
                  </div>
                  <p>{alert.hint}</p>
                  {alert.exportHref ? (
                    <a className="btn btn-ghost btn-block" href={alert.exportHref}>
                      Exporter cette vue
                    </a>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          <div className="dashboard-form">
            <div className="dashboard-form__head">
              <div>
                <p className="eyebrow">Pipeline courant</p>
                <h2>Statuts dominants dans le perimetre visible</h2>
              </div>
              <span className="tag">{applicationStatusCounts.length} statut(s)</span>
            </div>

            <div className="reporting-breakdown">
              {applicationStatusCounts.length > 0 ? (
                applicationStatusCounts.map((entry) => (
                  <div key={entry.label} className="document-card reporting-list__item">
                    <div className="reporting-list__head">
                      <strong>{entry.label}</strong>
                      <span className="tag tag--muted">{entry.value}</span>
                    </div>
                    <p>{entry.hint ? `Code statut : ${entry.hint}` : "Suivi pipeline actif"}</p>
                  </div>
                ))
              ) : (
                <div className="document-card">
                  <strong>Aucune candidature</strong>
                  <p>Le reporting se remplira des que des dossiers seront disponibles.</p>
                </div>
              )}
            </div>
          </div>

          <div className="dashboard-form">
            <div className="dashboard-form__head">
              <div>
                <p className="eyebrow">Profils candidats</p>
                <h2>Niveau de preparation de la base</h2>
              </div>
              <span className="tag">{completionBuckets.length} niveau(x)</span>
            </div>

            <div className="reporting-breakdown">
              {completionBuckets.map((entry) => (
                <div key={entry.label} className="document-card reporting-list__item">
                  <div className="reporting-list__head">
                    <strong>{entry.label}</strong>
                    <span className="tag tag--success">{entry.value}</span>
                  </div>
                  <p>{entry.hint ?? "Base candidat"}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="dashboard-form">
            <div className="dashboard-form__head">
              <div>
                <p className="eyebrow">Repartition offres</p>
                <h2>Statuts, lieux et secteurs qui dominent</h2>
              </div>
              <span className="tag">{jobStatusCounts.length} statut(s)</span>
            </div>

            <div className="reporting-breakdown">
              {jobStatusCounts.length > 0 ? (
                jobStatusCounts.map((entry) => (
                  <div key={entry.label} className="document-card reporting-list__item">
                    <div className="reporting-list__head">
                      <strong>{entry.label}</strong>
                      <span className="tag tag--muted">{entry.value}</span>
                    </div>
                    <p>Repartition actuelle des annonces visibles</p>
                  </div>
                ))
              ) : (
                <div className="document-card">
                  <strong>Aucune offre</strong>
                  <p>Les annonces visibles apparaitront ici.</p>
                </div>
              )}
            </div>
          </div>

          <div className="panel dashboard-sidecard">
            <p className="eyebrow">Lecture marche</p>
            <h2>Zones et segments qui ressortent en priorite.</h2>
            <div className="reporting-stack">
              <div className="document-card reporting-list__item">
                <div className="reporting-list__head">
                  <strong>Top villes candidats</strong>
                  <span className="tag tag--info">{topCities.length}</span>
                </div>
                <ul className="dashboard-mini-list">
                  {topCities.length > 0 ? (
                    topCities.map((entry) => (
                      <li key={entry.label}>
                        {entry.label} · {entry.value}
                      </li>
                    ))
                  ) : (
                    <li>Aucune ville dominante pour le moment.</li>
                  )}
                </ul>
              </div>

              <div className="document-card reporting-list__item">
                <div className="reporting-list__head">
                  <strong>Top lieux d'offres</strong>
                  <span className="tag tag--info">{topLocations.length}</span>
                </div>
                <ul className="dashboard-mini-list">
                  {topLocations.length > 0 ? (
                    topLocations.map((entry) => (
                      <li key={entry.label}>
                        {entry.label} · {entry.value}
                      </li>
                    ))
                  ) : (
                    <li>Aucun lieu dominant pour le moment.</li>
                  )}
                </ul>
              </div>

              <div className="document-card reporting-list__item">
                <div className="reporting-list__head">
                  <strong>Top secteurs</strong>
                  <span className="tag tag--info">{topSectors.length}</span>
                </div>
                <ul className="dashboard-mini-list">
                  {topSectors.length > 0 ? (
                    topSectors.map((entry) => (
                      <li key={entry.label}>
                        {entry.label} · {entry.value}
                      </li>
                    ))
                  ) : (
                    <li>Aucun secteur dominant pour le moment.</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </aside>
      </section>
    </DashboardShell>
  );
}
