import { formatDisplayDate } from "@/lib/format";
import { formatJobSalary } from "@/lib/job-salary";

export type JobPublicPreviewInput = {
  title?: string | null;
  summary?: string | null;
  department?: string | null;
  location?: string | null;
  contract_type?: string | null;
  work_mode?: string | null;
  sector?: string | null;
  closing_at?: string | null;
  salary_min?: number | null;
  salary_max?: number | null;
  salary_currency?: string | null;
  salary_period?: string | null;
  salary_is_visible?: boolean | null;
  organization_name?: string | null;
  is_featured?: boolean;
  status?: string | null;
};

type JobPublicPreviewProps = {
  job: JobPublicPreviewInput;
  title?: string;
};

function getPreviewText(value: string | null | undefined, fallback: string) {
  return value?.trim() || fallback;
}

export function JobPublicPreview({ job, title = "Apercu public" }: JobPublicPreviewProps) {
  const previewTitle = getPreviewText(job.title, "Titre du poste");
  const previewSummary = getPreviewText(
    job.summary,
    "Resume court de l'annonce visible sur la page carriere."
  );
  const statusLabel = job.status === "published" ? "Publication" : "Brouillon";
  const salaryLabel = formatJobSalary(job);

  return (
    <section className="job-public-preview">
      <div className="job-public-preview__head">
        <div>
          <p className="eyebrow">{title}</p>
          <h3>Carte visible sur la page carriere</h3>
        </div>
        <span className="tag tag--muted">{statusLabel}</span>
      </div>

      <article className="panel job-card career-job-card job-public-preview__card">
        <div className="career-job-card__head">
          <div className="dashboard-card__badges">
            {job.is_featured ? <span className="tag tag--success">Mise en avant</span> : null}
            <span className="tag tag--muted">{getPreviewText(job.sector, "Secteur")}</span>
          </div>
          <small>
            {job.closing_at ? `Cloture le ${formatDisplayDate(job.closing_at)}` : "Date de cloture a definir"}
          </small>
        </div>

        <h2>{previewTitle}</h2>
        <p>{previewSummary}</p>

        <div className="job-card__meta">
          <span>{getPreviewText(job.organization_name, "Madajob")}</span>
          <span>{getPreviewText(job.location, "Lieu")}</span>
          <span>{getPreviewText(job.contract_type, "Contrat")}</span>
          <span>{getPreviewText(job.work_mode, "Mode")}</span>
          {salaryLabel ? <span>{salaryLabel}</span> : null}
        </div>

        <div className="job-card__footer">
          <small>{getPreviewText(job.department, "Departement a preciser")}</small>
          <span>Voir le detail</span>
        </div>
      </article>
    </section>
  );
}
