"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";

import {
  applicationStatusOptions,
  getApplicationStatusMeta,
  isFinalApplicationStatus
} from "@/lib/application-status";
import { formatDisplayDate } from "@/lib/format";
import type { RecruiterApplication } from "@/lib/types";

type ManagedApplicationsBoardProps = {
  applications: RecruiterApplication[];
  basePath: "/app/recruteur/candidatures" | "/app/admin/candidatures";
};

type Filters = {
  query: string;
  status: string;
  withCvOnly: boolean;
  stage: "" | "active" | "final" | "shortlist";
  view: "list" | "pipeline";
  sort: "recent" | "oldest";
};

const initialFilters: Filters = {
  query: "",
  status: "",
  withCvOnly: false,
  stage: "",
  view: "pipeline",
  sort: "recent"
};

function getUniqueStatuses(applications: RecruiterApplication[]) {
  return Array.from(new Set(applications.map((application) => application.status))).sort((a, b) =>
    a.localeCompare(b, "fr")
  );
}

export function ManagedApplicationsBoard({
  applications,
  basePath
}: ManagedApplicationsBoardProps) {
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const deferredQuery = useDeferredValue(filters.query);

  const statusOptions = useMemo(() => getUniqueStatuses(applications), [applications]);

  const filteredApplications = useMemo(() => {
    const query = deferredQuery.trim().toLowerCase();

    return applications
      .filter((application) => {
        const matchesQuery =
          !query ||
          [
            application.candidate_name,
            application.candidate_email,
            application.job_title,
            application.job_location
          ]
            .filter(Boolean)
            .some((value) => value.toLowerCase().includes(query));

        const matchesStatus = !filters.status || application.status === filters.status;
        const matchesCv = !filters.withCvOnly || application.has_cv;
        const matchesStage =
          !filters.stage ||
          (filters.stage === "active" && !isFinalApplicationStatus(application.status)) ||
          (filters.stage === "final" && isFinalApplicationStatus(application.status)) ||
          (filters.stage === "shortlist" && application.status === "shortlist");

        return matchesQuery && matchesStatus && matchesCv && matchesStage;
      })
      .sort((left, right) => {
        const leftDate = new Date(left.created_at).getTime();
        const rightDate = new Date(right.created_at).getTime();

        if (filters.sort === "oldest") {
          return leftDate - rightDate;
        }

        return rightDate - leftDate;
      });
  }, [applications, deferredQuery, filters.sort, filters.stage, filters.status, filters.withCvOnly]);

  const statusCounts = useMemo(() => {
    const counts = new Map<string, number>();

    for (const application of filteredApplications) {
      counts.set(application.status, (counts.get(application.status) ?? 0) + 1);
    }

    return counts;
  }, [filteredApplications]);

  const pipelineColumns = useMemo(
    () =>
      applicationStatusOptions.map((option) => ({
        ...option,
        applications: filteredApplications.filter((application) => application.status === option.value)
      })),
    [filteredApplications]
  );

  const activeFilterCount = [
    filters.query,
    filters.status,
    filters.withCvOnly ? "cv" : "",
    filters.stage,
    filters.view !== "pipeline" ? filters.view : "",
    filters.sort !== "recent" ? filters.sort : ""
  ].filter(Boolean).length;

  return (
    <div className="jobs-board">
      <section className="dashboard-form">
        <div className="dashboard-form__head">
          <div>
            <p className="eyebrow">Gestion des candidatures</p>
            <h2>Retrouvez rapidement les dossiers a traiter</h2>
          </div>
          <span className="tag">{filteredApplications.length} dossier(s)</span>
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
              placeholder="Nom candidat, email, offre, lieu..."
            />
          </label>

          <label className="field">
            <span>Statut</span>
            <select
              value={filters.status}
              onChange={(event) =>
                setFilters((previous) => ({
                  ...previous,
                  status: event.target.value
                }))
              }
            >
              <option value="">Tous les statuts</option>
              {statusOptions.map((option) => (
                <option key={option} value={option}>
                  {getApplicationStatusMeta(option).label}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Focus pipeline</span>
            <select
              value={filters.stage}
              onChange={(event) =>
                setFilters((previous) => ({
                  ...previous,
                  stage: event.target.value as Filters["stage"]
                }))
              }
            >
              <option value="">Tous les dossiers</option>
              <option value="active">En cours</option>
              <option value="shortlist">Shortlist</option>
              <option value="final">Finalises</option>
            </select>
          </label>

          <label className="field">
            <span>Affichage</span>
            <select
              value={filters.view}
              onChange={(event) =>
                setFilters((previous) => ({
                  ...previous,
                  view: event.target.value as Filters["view"]
                }))
              }
            >
              <option value="pipeline">Pipeline</option>
              <option value="list">Liste</option>
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
              <option value="oldest">Plus anciennes</option>
            </select>
          </label>

          <label className="checkbox-field">
            <input
              type="checkbox"
              checked={filters.withCvOnly}
              onChange={(event) =>
                setFilters((previous) => ({
                  ...previous,
                  withCvOnly: event.target.checked
                }))
              }
            />
            <span>Afficher uniquement les dossiers avec CV joint</span>
          </label>
        </div>

        <div className="jobs-board__actions">
          <div className="dashboard-card__badges">
            {applicationStatusOptions.map((option) => {
              const count = statusCounts.get(option.value) ?? 0;

              return (
                <span key={option.value} className="tag tag--muted">
                  {option.label} · {count}
                </span>
              );
            })}
          </div>

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

      {filteredApplications.length > 0 ? (
        filters.view === "pipeline" ? (
          <section className="pipeline-board">
            {pipelineColumns.map((column) => (
              <article key={column.value} className="panel pipeline-column">
                <div className="pipeline-column__head">
                  <div>
                    <p className="eyebrow">{column.label}</p>
                    <h2>{column.applications.length} dossier(s)</h2>
                  </div>
                  <span className="tag tag--muted">{column.value}</span>
                </div>

                <p className="form-caption">{column.description}</p>

                <div className="pipeline-column__list">
                  {column.applications.length > 0 ? (
                    column.applications.map((application) => {
                      const statusMeta = getApplicationStatusMeta(application.status);

                      return (
                        <article key={application.id} className="document-card pipeline-card">
                          <div className="dashboard-card__top">
                            <div>
                              <strong>{application.candidate_name}</strong>
                              <p>{application.job_title}</p>
                            </div>
                            <span className="tag tag--muted">{statusMeta.label}</span>
                          </div>

                          <div className="job-card__meta">
                            <span>{application.job_location}</span>
                            <span>{application.has_cv ? "CV joint" : "CV non joint"}</span>
                          </div>

                          <small>{application.candidate_email}</small>

                          <div className="job-card__footer">
                            <small>Soumis le {formatDisplayDate(application.created_at)}</small>
                            <Link href={`${basePath}/${application.id}`}>Ouvrir</Link>
                          </div>
                        </article>
                      );
                    })
                  ) : (
                    <article className="document-card pipeline-card pipeline-card--empty">
                      <strong>Aucun dossier</strong>
                      <p>Cette etape du pipeline est vide avec les filtres actuels.</p>
                    </article>
                  )}
                </div>
              </article>
            ))}
          </section>
        ) : (
          <section className="jobs-results">
            {filteredApplications.map((application) => {
              const statusMeta = getApplicationStatusMeta(application.status);

              return (
                <article key={application.id} className="panel job-card jobs-result-card">
                  <div className="jobs-result-card__head">
                    <div className="jobs-result-card__badges">
                      <span className="tag">{statusMeta.label}</span>
                      {application.status === "shortlist" ? (
                        <span className="tag tag--success">Prioritaire</span>
                      ) : null}
                    </div>
                    <small>Soumis le {formatDisplayDate(application.created_at)}</small>
                  </div>
                  <h2>{application.candidate_name}</h2>
                  <p>{application.job_title}</p>
                  <div className="job-card__meta">
                    <span>{application.candidate_email}</span>
                    <span>{application.job_location}</span>
                    <span>{application.has_cv ? "CV joint" : "CV non joint"}</span>
                  </div>
                  <p className="match-caption">{statusMeta.description}</p>
                  <div className="job-card__footer">
                    <small>{application.cover_letter ? "Message candidat present" : "Sans message candidat"}</small>
                    <Link href={`${basePath}/${application.id}`}>Ouvrir le dossier</Link>
                  </div>
                </article>
              );
            })}
          </section>
        )
      ) : (
        <section className="jobs-results">
          <article className="panel jobs-empty">
            <h2>Aucun dossier ne correspond a ces filtres</h2>
            <p>Affinez votre recherche ou revenez sur la vue globale du pipeline.</p>
          </article>
        </section>
      )}
    </div>
  );
}
