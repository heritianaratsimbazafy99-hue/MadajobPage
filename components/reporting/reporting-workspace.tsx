import { DashboardShell } from "@/components/dashboard/shell";
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

function getStatusCount(applications: RecruiterApplication[]) {
  const counts = new Map<string, number>();

  for (const application of applications) {
    counts.set(application.status, (counts.get(application.status) ?? 0) + 1);
  }

  return Array.from(counts.entries()).sort((left, right) => right[1] - left[1]);
}

function getJobStatusCount(jobs: Job[]) {
  const counts = new Map<string, number>();

  for (const job of jobs) {
    counts.set(job.status, (counts.get(job.status) ?? 0) + 1);
  }

  return Array.from(counts.entries()).sort((left, right) => right[1] - left[1]);
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
  const applicationStatusCounts = getStatusCount(applications);
  const jobStatusCounts = getJobStatusCount(jobs);

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
          <small>annonces visibles dans votre perimetre</small>
        </article>
        <article className="panel metric-panel">
          <span>Candidatures exportables</span>
          <strong>{applications.length}</strong>
          <small>dossiers inclus dans vos exports</small>
        </article>
        <article className="panel metric-panel">
          <span>Candidats exportables</span>
          <strong>{candidates.length}</strong>
          <small>profils accessibles depuis votre espace</small>
        </article>
        <article className="panel metric-panel">
          <span>CV disponibles</span>
          <strong>{candidatesWithCv}</strong>
          <small>{applicationsWithCv} candidature(s) avec CV joint</small>
        </article>
      </section>

      <section className="dashboard-workspace">
        <div className="dashboard-column">
          <div className="dashboard-form">
            <div className="dashboard-form__head">
              <div>
                <p className="eyebrow">Exports</p>
                <h2>Telechargez vos donnees au format CSV</h2>
              </div>
              <span className="tag">CSV</span>
            </div>

            <div className="reporting-grid">
              <article className="document-card reporting-card">
                <strong>Export des offres</strong>
                <p>Recupere les statuts, lieux, contrats, secteurs et dates clefs.</p>
                <a className="btn btn-primary btn-block" href="/api/exports/jobs">
                  Exporter les offres
                </a>
              </article>

              <article className="document-card reporting-card">
                <strong>Export des candidatures</strong>
                <p>Recupere le pipeline, les postes, la presence du CV et les dates d'entree.</p>
                <a className="btn btn-secondary btn-block" href="/api/exports/applications">
                  Exporter les candidatures
                </a>
              </article>

              <article className="document-card reporting-card">
                <strong>Export des candidats</strong>
                <p>Recupere la base profils accessible avec completion, ville et volume de dossiers.</p>
                <a className="btn btn-ghost btn-block" href="/api/exports/candidates">
                  Exporter les candidats
                </a>
              </article>
            </div>

            <p className="form-caption">
              Chaque export respecte automatiquement les droits du compte connecte.
            </p>
          </div>

          <div className="dashboard-form">
            <div className="dashboard-form__head">
              <div>
                <p className="eyebrow">Lecture rapide</p>
                <h2>Repartition des candidatures</h2>
              </div>
              <span className="tag">{applicationStatusCounts.length} statut(s)</span>
            </div>

            <div className="reporting-breakdown">
              {applicationStatusCounts.length > 0 ? (
                applicationStatusCounts.map(([status, count]) => (
                  <div key={status} className="document-card">
                    <strong>{status}</strong>
                    <p>{count} candidature(s)</p>
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
        </div>

        <aside className="dashboard-column dashboard-column--aside">
          <div className="dashboard-form">
            <div className="dashboard-form__head">
              <div>
                <p className="eyebrow">Statuts offres</p>
                <h2>Repartition actuelle des annonces</h2>
              </div>
              <span className="tag">{jobStatusCounts.length} statut(s)</span>
            </div>

            <div className="reporting-breakdown">
              {jobStatusCounts.length > 0 ? (
                jobStatusCounts.map(([status, count]) => (
                  <div key={status} className="document-card">
                    <strong>{status}</strong>
                    <p>{count} offre(s)</p>
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
            <p className="eyebrow">Usage</p>
            <h2>Une sortie propre pour vos analyses et vos reprises.</h2>
            <ul className="dashboard-mini-list">
              <li>Exporter les offres pour controler la diffusion et la qualite du catalogue.</li>
              <li>Exporter les candidatures pour suivre le pipeline hors plateforme si besoin.</li>
              <li>Exporter les candidats pour travailler la base profils avec vos equipes.</li>
            </ul>
          </div>
        </aside>
      </section>
    </DashboardShell>
  );
}
