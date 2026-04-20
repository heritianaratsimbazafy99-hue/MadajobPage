import Link from "next/link";

import { DashboardShell } from "@/components/dashboard/shell";
import { CandidateDocumentsManager } from "@/components/profile/candidate-documents-manager";
import { CandidateCvUpload } from "@/components/profile/candidate-cv-upload";
import { requireRole } from "@/lib/auth";
import { formatDisplayDate } from "@/lib/format";
import { getCandidateDocuments, getCandidateWorkspace } from "@/lib/jobs";

export default async function CandidateDocumentsPage() {
  const profile = await requireRole(["candidat"]);
  const [candidateProfile, documents] = await Promise.all([
    getCandidateWorkspace(profile),
    getCandidateDocuments(profile.id, { limit: 30 })
  ]);

  const cvDocuments = documents.filter((document) => document.document_type === "cv");
  const supplementaryDocuments = documents.filter((document) => document.document_type !== "cv");
  const latestDocument = documents[0] ?? null;
  const uniqueSupplementaryTypes = new Set(
    supplementaryDocuments.map((document) => document.document_type)
  );

  return (
    <DashboardShell
      title="Mes documents"
      description="Centralisez votre CV principal et vos pieces complementaires dans un espace candidat dedie."
      profile={profile}
      currentPath="/app/candidat/documents"
    >
      <section className="dashboard-grid dashboard-grid--four">
        <article className="panel metric-panel">
          <span>Documents totaux</span>
          <strong>{documents.length}</strong>
          <small>fichiers visibles dans votre espace candidat</small>
        </article>
        <article className="panel metric-panel">
          <span>Historique CV</span>
          <strong>{cvDocuments.length}</strong>
          <small>versions de CV rattachees a votre profil</small>
        </article>
        <article className="panel metric-panel">
          <span>Pieces complementaires</span>
          <strong>{supplementaryDocuments.length}</strong>
          <small>{uniqueSupplementaryTypes.size} type(s) de document deja couverts</small>
        </article>
        <article className="panel metric-panel">
          <span>Dernier ajout</span>
          <strong>{latestDocument ? formatDisplayDate(latestDocument.created_at) : "Aucun"}</strong>
          <small>{latestDocument ? latestDocument.file_name : "aucun document charge"}</small>
        </article>
      </section>

      <section className="dashboard-workspace">
        <div className="dashboard-column">
          <CandidateDocumentsManager candidateId={profile.id} documents={documents} />
        </div>

        <aside className="dashboard-column dashboard-column--aside">
          <CandidateCvUpload
            candidateId={profile.id}
            currentDocument={candidateProfile.primary_cv}
            recentDocuments={candidateProfile.recent_documents}
          />

          <div className="panel dashboard-sidecard">
            <p className="eyebrow">Bonnes pratiques</p>
            <h2>Gardez un dossier simple et reutilisable.</h2>
            <ul className="dashboard-mini-list">
              <li>Maintenez un CV principal a jour pour vos candidatures rapides.</li>
              <li>Ajoutez seulement les pieces utiles a reutiliser sur plusieurs offres.</li>
              <li>Conservez des noms de fichiers clairs pour retrouver vite vos documents.</li>
            </ul>
            <div className="dashboard-action-stack">
              <Link className="btn btn-primary btn-block" href="/app/candidat/candidatures">
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
