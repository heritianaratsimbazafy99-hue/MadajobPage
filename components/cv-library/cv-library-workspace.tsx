import { DashboardShell } from "@/components/dashboard/shell";
import { CvLibraryBoard } from "@/components/cv-library/cv-library-board";
import { CvLibraryUploadForm } from "@/components/cv-library/cv-library-upload-form";
import { summarizeCvLibraryDocuments } from "@/lib/cv-library-insights";
import type { CvLibraryDocument, ManagedJob, Profile } from "@/lib/types";

type CvLibraryWorkspaceProps = {
  profile: Profile;
  documents: CvLibraryDocument[];
  jobs: ManagedJob[];
  currentPath: string;
};

export function CvLibraryWorkspace({
  profile,
  documents,
  jobs,
  currentPath
}: CvLibraryWorkspaceProps) {
  const summary = summarizeCvLibraryDocuments(documents);
  const retryableCount =
    summary.unsupportedCount + summary.emptyCount + summary.failedCount + summary.pendingCount;
  const activeJobs = jobs.filter((job) => job.status === "published" || job.status === "draft");

  return (
    <DashboardShell
      title="CVtheque"
      description="Centralisez les CV non affilies a des comptes candidats, parsez les fichiers exploitables et matchez-les aux offres."
      profile={profile}
      currentPath={currentPath}
    >
      <section className="dashboard-grid dashboard-grid--four">
        <article className="panel metric-panel">
          <span>CV stockes</span>
          <strong>{summary.totalCount}</strong>
          <small>documents disponibles hors profils candidats</small>
        </article>
        <article className="panel metric-panel">
          <span>Parses</span>
          <strong>{summary.parsedCount}</strong>
          <small>CV avec texte exploitable pour matching</small>
        </article>
        <article className="panel metric-panel">
          <span>A retraiter</span>
          <strong>{retryableCount}</strong>
          <small>documents utiles pour parsing avance ou IA</small>
        </article>
        <article className="panel metric-panel">
          <span>Lots recents</span>
          <strong>{summary.recentCount}</strong>
          <small>CV importes sur les 7 derniers jours</small>
        </article>
      </section>

      <section className="dashboard-workspace">
        <div className="dashboard-column">
          <CvLibraryBoard
            documents={documents}
            jobs={activeJobs}
            role={profile.role === "admin" ? "admin" : "recruteur"}
          />
        </div>

        <aside className="dashboard-column dashboard-column--aside">
          <CvLibraryUploadForm />

          <div className="panel dashboard-sidecard">
            <p className="eyebrow">Modele donnees</p>
            <h2>Une CVtheque separee des candidats.</h2>
            <ul className="dashboard-mini-list">
              <li>Aucun compte candidat n'est cree pendant l'import.</li>
              <li>Le texte parse alimente deja le matching natif.</li>
              <li>Le champ IA est pret pour un enrichissement futur.</li>
              <li>Les fichiers restent accessibles via un lien signe temporaire.</li>
            </ul>
          </div>
        </aside>
      </section>
    </DashboardShell>
  );
}
