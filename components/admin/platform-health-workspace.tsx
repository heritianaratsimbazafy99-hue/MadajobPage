import Link from "next/link";

import { DashboardShell } from "@/components/dashboard/shell";
import { formatDateTimeDisplay } from "@/lib/format";
import type {
  PlatformHealthCheck,
  PlatformHealthSection,
  PlatformHealthSnapshot,
  PlatformHealthStatus
} from "@/lib/platform-health";
import type { Profile } from "@/lib/types";

type PlatformHealthWorkspaceProps = {
  profile: Profile;
  health: PlatformHealthSnapshot;
};

const statusLabel: Record<PlatformHealthStatus, string> = {
  ok: "OK",
  warning: "Attention",
  danger: "Critique",
  muted: "A surveiller"
};

function getStatusClass(status: PlatformHealthStatus) {
  if (status === "danger") {
    return "tag tag--danger";
  }

  if (status === "warning") {
    return "tag tag--warning";
  }

  if (status === "ok") {
    return "tag tag--success";
  }

  return "tag tag--muted";
}

function getSectionStatus(section: PlatformHealthSection) {
  if (section.checks.some((check) => check.status === "danger")) {
    return "danger";
  }

  if (section.checks.some((check) => check.status === "warning")) {
    return "warning";
  }

  if (section.checks.some((check) => check.status === "muted")) {
    return "muted";
  }

  return "ok";
}

function HealthCheckCard({ check }: { check: PlatformHealthCheck }) {
  return (
    <article className="panel list-card dashboard-card">
      <div className="dashboard-card__top">
        <div>
          <h3>{check.title}</h3>
          <p>{check.detail}</p>
        </div>
        <span className={getStatusClass(check.status)}>{statusLabel[check.status]}</span>
      </div>
      <div className="job-card__meta">
        <span>{check.value}</span>
      </div>
      {check.href ? (
        <div className="dashboard-action-stack">
          <Link className="btn btn-ghost btn-block" href={check.href}>
            Ouvrir le module
          </Link>
        </div>
      ) : null}
    </article>
  );
}

export function PlatformHealthWorkspace({ profile, health }: PlatformHealthWorkspaceProps) {
  const criticalSections = health.sections.filter(
    (section) => getSectionStatus(section) === "danger"
  );
  const watchSections = health.sections.filter((section) =>
    ["warning", "muted"].includes(getSectionStatus(section))
  );

  return (
    <DashboardShell
      title="Sante plateforme"
      description="Controlez les signaux techniques et operationnels essentiels : RLS, emails, Storage, invitations et acces internes."
      profile={profile}
      currentPath="/app/admin/sante"
    >
      <section className="dashboard-grid dashboard-grid--four">
        <article className="panel metric-panel">
          <span>Score sante</span>
          <strong>{health.score}%</strong>
          <small>{statusLabel[health.status]} - {formatDateTimeDisplay(health.generatedAt)}</small>
        </article>
        <article className="panel metric-panel">
          <span>Critiques</span>
          <strong>{health.summary.dangerCount}</strong>
          <small>check(s) a traiter avant exploitation sereine</small>
        </article>
        <article className="panel metric-panel">
          <span>Alertes</span>
          <strong>{health.summary.warningCount}</strong>
          <small>{health.summary.mutedCount} signal(aux) a surveiller</small>
        </article>
        <article className="panel metric-panel">
          <span>Checks OK</span>
          <strong>{health.summary.okCount}</strong>
          <small>{health.summary.totalChecks} verification(s) au total</small>
        </article>
      </section>

      <section className="dashboard-workspace">
        <div className="dashboard-column">
          {health.sections.map((section) => {
            const sectionStatus = getSectionStatus(section);

            return (
              <div key={section.id} className="dashboard-section">
                <div className="dashboard-section__head">
                  <div>
                    <p className="eyebrow">Controle plateforme</p>
                    <h2>{section.title}</h2>
                    <p>{section.description}</p>
                  </div>
                  <span className={getStatusClass(sectionStatus)}>
                    {statusLabel[sectionStatus]}
                  </span>
                </div>

                <div className="dashboard-list">
                  {section.checks.map((check) => (
                    <HealthCheckCard key={check.id} check={check} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <aside className="dashboard-column dashboard-column--aside">
          <div className="panel dashboard-sidecard">
            <p className="eyebrow">Lecture rapide</p>
            <h2>
              {health.status === "danger"
                ? "Une action technique est requise."
                : health.status === "warning"
                  ? "La plateforme est exploitable, avec des points a suivre."
                  : "La plateforme est stable sur les checks visibles."}
            </h2>
            <p className="form-caption">
              Cette vue ne remplace pas les logs Supabase/Vercel, mais elle consolide les signaux
              utiles au pilotage quotidien.
            </p>
            <div className="dashboard-action-stack">
              <Link className="btn btn-primary btn-block" href="/app/admin/audit">
                Ouvrir l'audit
              </Link>
              <Link className="btn btn-secondary btn-block" href="/app/admin/emails">
                Suivre les emails
              </Link>
              <Link className="btn btn-secondary btn-block" href="/app/admin/utilisateurs">
                Gerer les acces
              </Link>
              <Link className="btn btn-secondary btn-block" href="/app/admin/reporting">
                Ouvrir le reporting
              </Link>
            </div>
          </div>

          <div className="dashboard-form">
            <div className="dashboard-form__head">
              <div>
                <p className="eyebrow">Priorites</p>
                <h2>Ce qui demande le plus d'attention</h2>
              </div>
              <span className="tag">{criticalSections.length + watchSections.length} zone(s)</span>
            </div>

            <div className="reporting-breakdown">
              {[...criticalSections, ...watchSections].length > 0 ? (
                [...criticalSections, ...watchSections].map((section) => {
                  const sectionStatus = getSectionStatus(section);
                  const flaggedCount = section.checks.filter((check) =>
                    ["danger", "warning", "muted"].includes(check.status)
                  ).length;

                  return (
                    <div key={section.id} className="document-card reporting-list__item">
                      <div className="reporting-list__head">
                        <strong>{section.title}</strong>
                        <span className={getStatusClass(sectionStatus)}>
                          {flaggedCount}
                        </span>
                      </div>
                      <p>{section.description}</p>
                    </div>
                  );
                })
              ) : (
                <div className="document-card">
                  <strong>Aucun point prioritaire</strong>
                  <p>Les checks visibles sont au vert pour cette session admin.</p>
                </div>
              )}
            </div>
          </div>
        </aside>
      </section>
    </DashboardShell>
  );
}
