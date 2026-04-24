import type { JobQualityReport } from "@/lib/job-quality";

type JobQualityPanelProps = {
  report: JobQualityReport;
  title?: string;
  compact?: boolean;
};

export function JobQualityPanel({
  report,
  title = "Score qualite annonce",
  compact = false
}: JobQualityPanelProps) {
  return (
    <section className={`job-quality-panel ${compact ? "job-quality-panel--compact" : ""}`}>
      <div className="job-quality-panel__head">
        <div>
          <p className="eyebrow">{title}</p>
          <h3>{report.label}</h3>
        </div>
        <span className={`tag tag--${report.tone}`}>{report.score}%</span>
      </div>

      <div className="job-quality-meter" aria-hidden="true">
        <span style={{ width: `${report.score}%` }} />
      </div>

      {report.alerts.length > 0 ? (
        <ul className="job-quality-list">
          {report.alerts.map((alert) => (
            <li key={alert.key}>
              <strong>{alert.label}</strong>
              {!compact ? <span>{alert.description}</span> : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="job-quality-panel__ready">
          L'annonce contient les signaux minimaux pour etre publiee proprement.
        </p>
      )}
    </section>
  );
}
