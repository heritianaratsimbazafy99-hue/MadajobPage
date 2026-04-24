import Link from "next/link";

import { formatDisplayDate } from "@/lib/format";
import { getJobQualityReport } from "@/lib/job-quality";
import type { ManagedJob } from "@/lib/types";

type JobPublicDetailPreviewProps = {
  job: ManagedJob;
  backHref: string;
  publicHref?: string | null;
};

function hasContent(value?: string | null) {
  return Boolean(value?.trim());
}

export function JobPublicDetailPreview({
  job,
  backHref,
  publicHref = null
}: JobPublicDetailPreviewProps) {
  const qualityReport = getJobQualityReport(job);

  return (
    <div className="job-public-detail-preview">
      <section className="panel job-public-detail-preview__toolbar">
        <div>
          <p className="eyebrow">Apercu protege</p>
          <h2>Relire l'annonce comme un candidat avant publication</h2>
        </div>
        <div className="dashboard-card__badges">
          <span className={`tag tag--${qualityReport.tone}`}>Qualite {qualityReport.score}%</span>
          <span className="tag tag--muted">{job.status}</span>
        </div>
      </section>

      <section className="job-public-detail-preview__surface">
        <div className="container detail-layout">
          <article className="panel detail-card">
            <div className="dashboard-card__badges">
              {job.is_featured ? <span className="tag tag--success">Mise en avant</span> : null}
              <span className="tag tag--muted">{job.organization_name || "Madajob"}</span>
            </div>

            <p className="eyebrow">Offre Madajob</p>
            <h1>{job.title}</h1>
            <p className="page-hero__lead">{job.summary}</p>

            <div className="job-card__meta">
              <span>{job.location || "Lieu a definir"}</span>
              <span>{job.contract_type || "Contrat a definir"}</span>
              <span>{job.work_mode || "Mode a definir"}</span>
              <span>{job.sector || "Secteur a definir"}</span>
            </div>

            <p className="detail-date">
              {job.published_at
                ? `Publication : ${formatDisplayDate(job.published_at)}`
                : "Publication : non publiee"}
              {job.closing_at ? ` · Cloture : ${formatDisplayDate(job.closing_at)}` : ""}
            </p>
          </article>

          <aside className="panel detail-side-card">
            <p className="eyebrow">Bloc candidature</p>
            <h2>Prochaine etape</h2>
            <p>
              Dans la page publique, ce bloc invite le candidat connecte a postuler ou a suivre son
              dossier depuis son espace Madajob.
            </p>
            <div className="hero__actions hero__actions--stack">
              <Link className="btn btn-secondary btn-block" href={backHref}>
                Retour a la fiche offre
              </Link>
              {publicHref ? (
                <Link className="btn btn-ghost btn-block" href={publicHref}>
                  Ouvrir la page publique
                </Link>
              ) : null}
            </div>
          </aside>
        </div>

        <div className="container job-public-detail-preview__content">
          <article className="panel detail-card">
            <p className="eyebrow">Missions</p>
            <h2>Ce que le candidat lira</h2>
            <p>
              {hasContent(job.responsibilities)
                ? job.responsibilities
                : "Les responsabilites ne sont pas encore renseignees."}
            </p>
          </article>

          <article className="panel detail-card">
            <p className="eyebrow">Profil attendu</p>
            <h2>Competences et exigences</h2>
            <p>
              {hasContent(job.requirements)
                ? job.requirements
                : "Les competences, outils ou experiences attendus ne sont pas encore renseignes."}
            </p>
          </article>

          <article className="panel detail-card">
            <p className="eyebrow">Package</p>
            <h2>Avantages et remuneration</h2>
            <p>
              {hasContent(job.benefits)
                ? job.benefits
                : "Le salaire, le package ou les avantages ne sont pas encore renseignes."}
            </p>
          </article>
        </div>
      </section>
    </div>
  );
}
