import type { ReactNode } from "react";

type DashboardEmptyStateProps = {
  title: string;
  description: string;
  actions?: ReactNode;
};

export function DashboardEmptyState({
  title,
  description,
  actions
}: DashboardEmptyStateProps) {
  return (
    <article className="panel jobs-empty">
      <div className="dashboard-empty-state">
        <span className="dashboard-empty-state__eyebrow">Aucun resultat exploitable</span>
        <h2>{title}</h2>
        <p>{description}</p>
        {actions ? <div className="dashboard-empty-actions">{actions}</div> : null}
      </div>
    </article>
  );
}
