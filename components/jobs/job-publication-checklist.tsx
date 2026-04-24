import Link from "next/link";

import {
  getJobPublicationChecklist,
  type JobPublicationChecklistItem
} from "@/lib/job-publication-checklist";
import type { JobQualityReport } from "@/lib/job-quality";
import type { ManagedJob } from "@/lib/types";

type JobPublicationChecklistProps = {
  job: ManagedJob;
  previewHref: string;
  qualityReport: JobQualityReport;
};

function ChecklistAction({ item }: { item: JobPublicationChecklistItem }) {
  if (!item.actionHref || !item.actionLabel) {
    return null;
  }

  if (item.actionHref.startsWith("#")) {
    return (
      <a className="job-publication-checklist__action" href={item.actionHref}>
        {item.actionLabel}
      </a>
    );
  }

  return (
    <Link className="job-publication-checklist__action" href={item.actionHref}>
      {item.actionLabel}
    </Link>
  );
}

export function JobPublicationChecklist({
  job,
  previewHref,
  qualityReport
}: JobPublicationChecklistProps) {
  const checklist = getJobPublicationChecklist(job, qualityReport, {
    previewHref,
    publicHref: `/carrieres/${job.slug}`
  });

  return (
    <section
      aria-labelledby="job-publication-checklist-title"
      className="dashboard-form job-publication-checklist"
    >
      <div className="dashboard-form__head">
        <div>
          <p className="eyebrow">Checklist publication</p>
          <h2 id="job-publication-checklist-title">Diffuser une annonce propre</h2>
        </div>
        <span className={`tag tag--${checklist.tone}`}>
          {checklist.readyCount}/{checklist.totalCount}
        </span>
      </div>

      <p className="job-publication-checklist__summary">{checklist.summary}</p>

      <ul className="job-publication-checklist__items">
        {checklist.items.map((item) => (
          <li key={item.id} className="job-publication-checklist__item">
            <span
              aria-label={item.complete ? "Point valide" : "Point a traiter"}
              className={`job-publication-checklist__marker job-publication-checklist__marker--${item.tone}`}
            >
              {item.complete ? "OK" : "!"}
            </span>
            <div>
              <div className="job-publication-checklist__row">
                <strong>{item.label}</strong>
                <span className={`tag tag--${item.tone}`}>{item.value}</span>
              </div>
              <p>{item.description}</p>
              <ChecklistAction item={item} />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
