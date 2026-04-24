"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";

import { DashboardEmptyState } from "@/components/dashboard/empty-state";
import { formatDisplayDate } from "@/lib/format";
import { formatJobSalary, hasVisibleSalary } from "@/lib/job-salary";
import type { CandidateJobAlert } from "@/lib/types";

type CandidateJobAlertsBoardProps = {
  alerts: CandidateJobAlert[];
};

type Filters = {
  query: string;
  level: "" | "fort" | "bon" | "moyen" | "faible";
  contractType: string;
  workMode: string;
  salaryVisibleOnly: boolean;
  sort: "recent" | "match" | "oldest";
};

const initialFilters: Filters = {
  query: "",
  level: "",
  contractType: "",
  workMode: "",
  salaryVisibleOnly: false,
  sort: "recent"
};

function getUniqueValues(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b, "fr")
  );
}

function getMatchTone(alert: CandidateJobAlert) {
  if (alert.match_score >= 78 || alert.match_level === "fort") {
    return "success";
  }

  if (alert.match_score >= 60 || alert.match_level === "bon" || alert.match_level === "moyen") {
    return "info";
  }

  return "muted";
}

export function CandidateJobAlertsBoard({ alerts }: CandidateJobAlertsBoardProps) {
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const deferredQuery = useDeferredValue(filters.query);

  const options = useMemo(
    () => ({
      contractTypes: getUniqueValues(alerts.map((alert) => alert.job.contract_type)),
      workModes: getUniqueValues(alerts.map((alert) => alert.job.work_mode))
    }),
    [alerts]
  );

  const filteredAlerts = useMemo(() => {
    const query = deferredQuery.trim().toLowerCase();

    return alerts
      .filter((alert) => {
        const salaryLabel = formatJobSalary(alert.job);
        const matchesQuery =
          !query ||
          [
            alert.job.title,
            alert.job.summary,
            alert.job.location,
            alert.job.contract_type,
            alert.job.work_mode,
            alert.job.sector,
            alert.match_reason ?? "",
            alert.match_level,
            salaryLabel
          ]
            .filter(Boolean)
            .some((value) => value.toLowerCase().includes(query));
        const matchesLevel = !filters.level || alert.match_level === filters.level;
        const matchesContract =
          !filters.contractType || alert.job.contract_type === filters.contractType;
        const matchesWorkMode = !filters.workMode || alert.job.work_mode === filters.workMode;
        const matchesSalary = !filters.salaryVisibleOnly || hasVisibleSalary(alert.job);

        return matchesQuery && matchesLevel && matchesContract && matchesWorkMode && matchesSalary;
      })
      .sort((left, right) => {
        const leftDate = new Date(left.created_at).getTime();
        const rightDate = new Date(right.created_at).getTime();

        if (filters.sort === "match") {
          if (left.match_score !== right.match_score) {
            return right.match_score - left.match_score;
          }
        }

        if (filters.sort === "oldest") {
          return leftDate - rightDate;
        }

        return rightDate - leftDate;
      });
  }, [
    alerts,
    deferredQuery,
    filters.contractType,
    filters.level,
    filters.salaryVisibleOnly,
    filters.sort,
    filters.workMode
  ]);

  const activeFilterCount = [
    filters.query,
    filters.level,
    filters.contractType,
    filters.workMode,
    filters.salaryVisibleOnly ? "salary_visible" : "",
    filters.sort !== "recent" ? filters.sort : ""
  ].filter(Boolean).length;

  return (
    <div className="jobs-board candidate-alerts-board">
      <section className="panel dashboard-form">
        <div className="dashboard-form__head">
          <div>
            <p className="eyebrow">Filtres alertes</p>
            <h2>Retrouvez les offres signalees par vos preferences</h2>
          </div>
          <span className="tag">{filteredAlerts.length} alerte(s)</span>
        </div>

        <div className="form-grid">
          <label className="field field--full">
            <span>Recherche</span>
            <input
              value={filters.query}
              onChange={(event) =>
                setFilters((previous) => ({
                  ...previous,
                  query: event.target.value
                }))
              }
              placeholder="Titre, lieu, secteur, raison du match..."
            />
          </label>

          <label className="field">
            <span>Niveau de match</span>
            <select
              value={filters.level}
              onChange={(event) =>
                setFilters((previous) => ({
                  ...previous,
                  level: event.target.value as Filters["level"]
                }))
              }
            >
              <option value="">Tous les niveaux</option>
              <option value="fort">Fort</option>
              <option value="bon">Bon</option>
              <option value="moyen">Moyen</option>
              <option value="faible">Faible</option>
            </select>
          </label>

          <label className="field">
            <span>Contrat</span>
            <select
              value={filters.contractType}
              onChange={(event) =>
                setFilters((previous) => ({
                  ...previous,
                  contractType: event.target.value
                }))
              }
            >
              <option value="">Tous les contrats</option>
              {options.contractTypes.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Mode de travail</span>
            <select
              value={filters.workMode}
              onChange={(event) =>
                setFilters((previous) => ({
                  ...previous,
                  workMode: event.target.value
                }))
              }
            >
              <option value="">Tous les modes</option>
              {options.workModes.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Tri</span>
            <select
              value={filters.sort}
              onChange={(event) =>
                setFilters((previous) => ({
                  ...previous,
                  sort: event.target.value as Filters["sort"]
                }))
              }
            >
              <option value="recent">Plus recentes</option>
              <option value="match">Meilleur match</option>
              <option value="oldest">Plus anciennes</option>
            </select>
          </label>
        </div>

        <div className="jobs-board__actions">
          <label className="checkbox-field">
            <input
              type="checkbox"
              checked={filters.salaryVisibleOnly}
              onChange={(event) =>
                setFilters((previous) => ({
                  ...previous,
                  salaryVisibleOnly: event.target.checked
                }))
              }
            />
            <span>Afficher uniquement les alertes avec remuneration visible</span>
          </label>

          <span className="jobs-board__hint">
            {activeFilterCount > 0
              ? `${activeFilterCount} filtre(s) actif(s).`
              : "Les alertes restent liees aux nouvelles offres publiees apres activation de vos preferences."}
          </span>

          {activeFilterCount > 0 ? (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setFilters(initialFilters)}
            >
              Reinitialiser les filtres
            </button>
          ) : null}
        </div>
      </section>

      <section className="jobs-results">
        {filteredAlerts.length > 0 ? (
          filteredAlerts.map((alert) => {
            const salaryLabel = formatJobSalary(alert.job);

            return (
              <article key={alert.id} className="panel job-card jobs-result-card candidate-alert-card">
                <div className="jobs-result-card__head">
                  <div className="jobs-result-card__badges">
                    <span className={`tag tag--${getMatchTone(alert)}`}>
                      Match {alert.match_score}%
                    </span>
                    <span className="tag tag--muted">{alert.match_level}</span>
                    {salaryLabel ? <span className="tag tag--info">Salaire visible</span> : null}
                  </div>
                  <small>Alerte creee le {formatDisplayDate(alert.created_at)}</small>
                </div>

                <h2>{alert.job.title}</h2>
                <p>{alert.match_reason || alert.job.summary}</p>

                <div className="job-card__meta">
                  <span>{alert.job.location}</span>
                  <span>{alert.job.contract_type}</span>
                  <span>{alert.job.work_mode}</span>
                  <span>{alert.job.sector}</span>
                  {salaryLabel ? <span>{salaryLabel}</span> : null}
                </div>

                <div className="application-signal-card">
                  <strong>Pourquoi cette offre remonte</strong>
                  <p>
                    {alert.match_reason ||
                      "Le contrat, le mode de travail, la remuneration ou le matching du profil correspondent a vos preferences."}
                  </p>
                  <small>
                    Publiee le {formatDisplayDate(alert.job.published_at)}. Verifiez la fiche avant de postuler.
                  </small>
                </div>

                <div className="job-card__footer">
                  <small>{alert.job.organization_name || "Madajob"}</small>
                  <div className="notification-card__actions">
                    <Link href={`/app/candidat/offres/${alert.job.slug}`}>Voir l'offre</Link>
                    <Link href="/app/candidat#candidate-search-preferences">
                      Ajuster mes preferences
                    </Link>
                  </div>
                </div>
              </article>
            );
          })
        ) : (
          <DashboardEmptyState
            title="Aucune alerte ne correspond a ces filtres"
            description="Elargissez la recherche ou ajustez vos preferences pour recevoir des signaux plus utiles."
            actions={
              <>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setFilters(initialFilters)}
                >
                  Reinitialiser les filtres
                </button>
                <Link className="btn btn-ghost" href="/app/candidat#candidate-search-preferences">
                  Ajuster mes preferences
                </Link>
              </>
            }
          />
        )}
      </section>
    </div>
  );
}
