import Link from "next/link";

import { DashboardShell } from "@/components/dashboard/shell";
import { CandidateCvAnalysisPanel } from "@/components/profile/candidate-cv-analysis-panel";
import { CandidateDocumentsManager } from "@/components/profile/candidate-documents-manager";
import { CandidateCvUpload } from "@/components/profile/candidate-cv-upload";
import { requireRole } from "@/lib/auth";
import { getCandidateCvAnalysis } from "@/lib/candidate-cv-analysis";
import { summarizeCandidateDocuments } from "@/lib/candidate-document-insights";
import { formatDisplayDate } from "@/lib/format";
import { getCandidateDocuments, getCandidateWorkspace } from "@/lib/jobs";

export default async function CandidateDocumentsPage() {
  const profile = await requireRole(["candidat"]);
  const [candidateProfile, documents] = await Promise.all([
    getCandidateWorkspace(profile),
    getCandidateDocuments(profile.id, { limit: 30 })
  ]);

  const summary = summarizeCandidateDocuments(documents);
  const cvAnalysis = getCandidateCvAnalysis({
    ...candidateProfile,
    documentsCount: documents.length
  });
  const latestDocument = summary.latestDocument;

  return (
    <DashboardShell
      title="Mes documents"
      description="Pilotez votre CV principal et vos pieces complementaires depuis un cockpit documentaire plus clair et reutilisable."
      profile={profile}
      currentPath="/app/candidat/documents"
    >
      <section className="dashboard-grid dashboard-grid--four">
        <article className="panel metric-panel">
          <span>Documents totaux</span>
          <strong>{summary.totalCount}</strong>
          <small>fichiers visibles dans votre espace candidat</small>
        </article>
        <article className="panel metric-panel">
          <span>Historique CV</span>
          <strong>{summary.cvCount}</strong>
          <small>versions de CV rattachees a votre profil</small>
        </article>
        <article className="panel metric-panel">
          <span>Couverture utile</span>
          <strong>{summary.distinctSupplementaryTypes}</strong>
          <small>type(s) complementaires deja couverts</small>
        </article>
        <article className="panel metric-panel">
          <span>Dernier ajout</span>
          <strong>{latestDocument ? formatDisplayDate(latestDocument.created_at) : "Aucun"}</strong>
          <small>{latestDocument ? latestDocument.file_name : "aucun document charge"}</small>
        </article>
      </section>

      <section className="dashboard-workspace">
        <div className="dashboard-column">
          <div className="dashboard-form">
            <div className="dashboard-form__head">
              <div>
                <p className="eyebrow">Centre d'action</p>
                <h2>Ce qui renforcera le plus vite votre dossier</h2>
              </div>
              <span className="tag">{summary.readinessLabel}</span>
            </div>

            <div className="candidate-documents-summary-grid">
              <article className="document-card">
                <strong>{summary.readinessLabel}</strong>
                <p>{summary.readinessDescription}</p>
                <small>
                  {summary.missingRecommendedTypes.length > 0
                    ? `${summary.missingRecommendedTypes.length} type(s) recommande(s) restent encore a couvrir.`
                    : "Votre bibliotheque couvre deja les pieces les plus reutilisables."}
                </small>
              </article>

              <article className="document-card">
                <strong>Prochaines actions conseillees</strong>
                <ul className="dashboard-mini-list dashboard-mini-list--compact">
                  {summary.nextActions.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>

              <article className="document-card">
                <strong>Bibliotheque recente</strong>
                <p>{summary.recentCount} document(s) ajoute(s) sur les 30 derniers jours.</p>
                <small>
                  {summary.supplementaryCount > 0
                    ? `${summary.supplementaryCount} piece(s) complementaire(s) deja stockee(s).`
                    : "Aucune piece complementaire n'a encore ete ajoutee."}
                </small>
              </article>
            </div>

            <div className="candidate-dashboard-summary-strip">
              <article className="document-card candidate-dashboard-summary-item">
                <strong>{summary.totalCount}</strong>
                <p>document(s) au total</p>
              </article>
              <article className="document-card candidate-dashboard-summary-item">
                <strong>{summary.supplementaryCount}</strong>
                <p>piece(s) complementaire(s)</p>
              </article>
              <article className="document-card candidate-dashboard-summary-item">
                <strong>{summary.recentCount}</strong>
                <p>ajout(s) recents</p>
              </article>
              <article className="document-card candidate-dashboard-summary-item">
                <strong>{summary.missingRecommendedTypes.length}</strong>
                <p>priorite(s) restantes</p>
              </article>
            </div>
          </div>

          <CandidateCvAnalysisPanel
            analysis={cvAnalysis}
            eyebrow="Lecture documentaire"
            title="Ce que votre CV raconte deja vraiment"
          />

          <CandidateDocumentsManager documents={documents} />
        </div>

        <aside className="dashboard-column dashboard-column--aside">
          <div id="cv-principal">
            <CandidateCvUpload
              currentDocument={candidateProfile.primary_cv}
              recentDocuments={candidateProfile.recent_documents}
            />
          </div>

          <div className="panel dashboard-sidecard">
            <p className="eyebrow">Bonnes pratiques</p>
            <h2>Gardez un dossier simple et reutilisable.</h2>
            <ul className="dashboard-mini-list">
              <li>Maintenez un CV principal a jour pour vos candidatures rapides.</li>
              <li>Ajoutez seulement les pieces utiles a reutiliser sur plusieurs offres.</li>
              <li>Conservez des noms de fichiers clairs pour retrouver vite vos documents.</li>
            </ul>
            <div className="dashboard-action-stack">
              <Link className="btn btn-primary btn-block" href="#cv-principal">
                Mettre a jour mon CV
              </Link>
              <Link className="btn btn-secondary btn-block" href="#documents-complementaires">
                Ouvrir ma bibliotheque
              </Link>
              <Link className="btn btn-secondary btn-block" href="/app/candidat/candidatures">
                Voir mes candidatures
              </Link>
              <Link className="btn btn-secondary btn-block" href="/app/candidat/offres">
                Explorer les offres
              </Link>
            </div>
          </div>
        </aside>
      </section>
    </DashboardShell>
  );
}
