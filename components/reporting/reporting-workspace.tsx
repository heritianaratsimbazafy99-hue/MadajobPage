import { DashboardShell } from "@/components/dashboard/shell";
import { getApplicationStatusMeta } from "@/lib/application-status";
import type {
  Job,
  ManagedCandidateSummary,
  Profile,
  RecruiterApplication
} from "@/lib/types";

type ReportingWorkspaceProps = {
  profile: Profile;
  currentPath: string;
  title: string;
  description: string;
  jobs: Job[];
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

function getJobStatusCount(jobs: Job[]) {
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

function getTopJobs(applications: RecruiterApplication[]) {
  const counts = new Map<
    string,
    {
      label: string;
      value: number;
      hint: string;
    }
  >();

  for (const application of applications) {
    const key = application.job_id || application.job_title;
    const current = counts.get(key) ?? {
      label: application.job_title,
      value: 0,
      hint: application.job_location
    };

    current.value += 1;
    counts.set(key, current);
  }

  return Array.from(counts.values())
    .sort((left, right) => right.value - left.value)
    .slice(0, 5);
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

function getTopJobSignals(jobs: Job[], field: "location" | "sector") {
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

function getTopFollowupNeeds(applications: RecruiterApplication[]) {
  const withoutCv = applications.filter((item) => !item.has_cv).length;
  const advanced = applications.filter((item) =>
    ["shortlist", "interview", "hired"].includes(item.status)
  ).length;
  const rejected = applications.filter((item) => item.status === "rejected").length;

  return [
    {
      label: "Dossiers avances",
      value: advanced,
      hint: formatPercent(advanced, applications.length)
    },
    {
      label: "Sans CV joint",
      value: withoutCv,
      hint: formatPercent(withoutCv, applications.length)
    },
    {
      label: "Finalises",
      value: rejected + applications.filter((item) => item.status === "hired").length,
      hint: "retenus ou rejetes"
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
  const candidatesWithCv = candidates.filter((item) => item.has_primary_cv).length;
  const publishedJobs = jobs.filter((job) => job.status === "published").length;
  const featuredJobs = jobs.filter((job) => job.is_featured).length;
  const advancedApplications = applications.filter((item) =>
    ["shortlist", "interview", "hired"].includes(item.status)
  ).length;
  const applicationStatusCounts = getApplicationStatusCount(applications);
  const jobStatusCounts = getJobStatusCount(jobs);
  const topJobs = getTopJobs(applications);
  const topCities = getTopCandidateCities(candidates);
  const topLocations = getTopJobSignals(jobs, "location");
  const topSectors = getTopJobSignals(jobs, "sector");
  const completionBuckets = getCandidateCompletionBuckets(candidates);
  const followupNeeds = getTopFollowupNeeds(applications);
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
          <span>Offres exportables</span>
          <strong>{jobs.length}</strong>
          <small>{publishedJobs} publiee(s), {featuredJobs} mise(s) en avant</small>
        </article>
        <article className="panel metric-panel">
          <span>Candidatures exportables</span>
          <strong>{applications.length}</strong>
          <small>{advancedApplications} dossier(s) avance(s)</small>
        </article>
        <article className="panel metric-panel">
          <span>Candidats exportables</span>
          <strong>{candidates.length}</strong>
          <small>profils accessibles depuis votre espace</small>
        </article>
        <article className="panel metric-panel">
          <span>Couverture CV</span>
          <strong>{formatPercent(applicationsWithCv, applications.length)}</strong>
          <small>{candidatesWithCv} candidat(s) avec CV principal</small>
        </article>
      </section>

      <section className="dashboard-workspace">
        <div className="dashboard-column">
          <div className="dashboard-form">
            <div className="dashboard-form__head">
              <div>
                <p className="eyebrow">Exports</p>
                <h2>Telechargez les donnees utiles a vos reprises et analyses</h2>
              </div>
              <span className="tag">CSV</span>
            </div>

            <div className="reporting-grid">
              <article className="document-card reporting-card">
                <strong>Export des offres</strong>
                <p>
                  {isAdminView
                    ? "Recupere les annonces de toute la plateforme avec leur diffusion et leur volume de candidatures."
                    : "Recupere les annonces visibles dans votre perimetre recruteur avec leurs statuts et volumes."}
                </p>
                <a className="btn btn-primary btn-block" href="/api/exports/jobs">
                  Exporter les offres
                </a>
              </article>

              <article className="document-card reporting-card">
                <strong>Export des candidatures</strong>
                <p>
                  Recupere le pipeline, les postes, la presence du CV et les dates d'entree pour
                  consolider votre suivi.
                </p>
                <a className="btn btn-secondary btn-block" href="/api/exports/applications">
                  Exporter les candidatures
                </a>
              </article>

              <article className="document-card reporting-card">
                <strong>Export des candidats</strong>
                <p>
                  Recupere la base profils accessible avec completion, ville, poste actuel et
                  volume de dossiers.
                </p>
                <a className="btn btn-ghost btn-block" href="/api/exports/candidates">
                  Exporter les candidats
                </a>
              </article>
            </div>

            <p className="form-caption">
              Chaque export respecte automatiquement les droits du compte connecte et le
              perimetre visible dans la plateforme.
            </p>
          </div>

          <div className="dashboard-form">
            <div className="dashboard-form__head">
              <div>
                <p className="eyebrow">Lecture pipeline</p>
                <h2>Reperez rapidement les statuts dominants et les dossiers a relancer</h2>
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
                <p className="eyebrow">Offres qui captent le plus</p>
                <h2>Top postes par volume de candidatures</h2>
              </div>
              <span className="tag">{topJobs.length} poste(s)</span>
            </div>

            <div className="reporting-breakdown">
              {topJobs.length > 0 ? (
                topJobs.map((entry) => (
                  <div key={`${entry.label}-${entry.hint}`} className="document-card reporting-list__item">
                    <div className="reporting-list__head">
                      <strong>{entry.label}</strong>
                      <span className="tag tag--info">{entry.value} candidature(s)</span>
                    </div>
                    <p>{entry.hint || "Lieu non renseigne"}</p>
                  </div>
                ))
              ) : (
                <div className="document-card">
                  <strong>Aucune offre dominante pour le moment</strong>
                  <p>Les postes les plus sollicités remonteront ici automatiquement.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <aside className="dashboard-column dashboard-column--aside">
          <div className="dashboard-form">
            <div className="dashboard-form__head">
              <div>
                <p className="eyebrow">Signal principal</p>
                <h2>Indicateurs de conversion et de qualité</h2>
              </div>
              <span className="tag">{followupNeeds.length} lecture(s)</span>
            </div>

            <div className="reporting-breakdown">
              {followupNeeds.map((entry) => (
                <div key={entry.label} className="document-card reporting-list__item">
                  <div className="reporting-list__head">
                    <strong>{entry.label}</strong>
                    <span className="tag">{entry.value}</span>
                  </div>
                  <p>{entry.hint ?? "Signal de suivi"}</p>
                </div>
              ))}
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
