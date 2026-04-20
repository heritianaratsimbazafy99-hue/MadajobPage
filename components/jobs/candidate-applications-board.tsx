"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";

import {
  getApplicationStatusMeta,
  isFinalApplicationStatus
} from "@/lib/application-status";
import { formatDisplayDate } from "@/lib/format";
import type { CandidateApplicationSummary } from "@/lib/types";

type CandidateApplicationsBoardProps = {
  applications: CandidateApplicationSummary[];
};

type Filters = {
  query: string;
  status: string;
  withCvOnly: boolean;
  activeOnly: boolean;
  sort: "recent" | "oldest";
};

const initialFilters: Filters = {
  query: "",
  status: "",
  withCvOnly: false,
  activeOnly: false,
  sort: "recent"
};

function getUniqueStatuses(applications: CandidateApplicationSummary[]) {
  return Array.from(new Set(applications.map((application) => application.status))).sort((a, b) =>
    a.localeCompare(b, "fr")
  );
}

function getApplicationSortDate(application: CandidateApplicationSummary) {
  return application.updated_at || application.created_at;
}

export function CandidateApplicationsBoard({
  applications
}: CandidateApplicationsBoardProps) {
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const deferredQuery = useDeferredValue(filters.query);

  const statusOptions = useMemo(() => getUniqueStatuses(applications), [applications]);

  const filteredApplications = useMemo(() => {
    const query = deferredQuery.trim().toLowerCase();

    const matchingApplications = applications.filter((application) => {
      const matchesQuery =
        !query ||
        [
          application.job_title,
          application.organization_name,
          application.job_location,
          application.contract_type,
          application.work_mode,
          application.sector
        ]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(query));

      const matchesStatus = !filters.status || application.status === filters.status;
      const matchesCv = !filters.withCvOnly || application.has_cv;
      const matchesActive = !filters.activeOnly || !isFinalApplicationStatus(application.status);

      return matchesQuery && matchesStatus && matchesCv && matchesActive;
    });

    return matchingApplications.sort((left, right) => {
      const leftDate = new Date(getApplicationSortDate(left)).getTime();
      const rightDate = new Date(getApplicationSortDate(right)).getTime();

      return filters.sort === "oldest" ? leftDate - rightDate : rightDate - leftDate;
    });
  }, [
    applications,
    deferredQuery,
    filters.activeOnly,
    filters.sort,
    filters.status,
    filters.withCvOnly
  ]);

  const activeFilterCount = [
    filters.query,
    filters.status,
    filters.withCvOnly ? "cv" : "",
    filters.activeOnly ? "active" : "",
    filters.sort !== "recent" ? filters.sort : ""
  ].filter(Boolean).length;

  return (
    <div className="jobs-board">
      <section className="dashboard-form">
        <div className="dashboard-form__head">
          <div>
            <p className="eyebrow">Suivi detaille</p>
            <h2>Retrouvez rapidement les dossiers encore en mouvement</h2>
          </div>
          <span className="tag">{filteredApplications.length} candidature(s)</span>
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
              placeholder="Offre, organisation, lieu, contrat..."
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
        </div>

        <div className="jobs-board__actions">
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

          <label className="checkbox-field">
            <input
              type="checkbox"
              checked={filters.activeOnly}
              onChange={(event) =>
                setFilters((previous) => ({
                  ...previous,
                  activeOnly: event.target.checked
                }))
              }
            />
            <span>Masquer les candidatures finalisees</span>
          </label>

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
        {applications.length === 0 ? (
          <article className="panel jobs-empty">
            <h2>Vous n'avez pas encore de candidature</h2>
            <p>
              Explorez les offres disponibles depuis la plateforme et deposez votre premier dossier
              en quelques clics.
            </p>
            <div className="dashboard-action-stack">
              <Link className="btn btn-primary" href="/app/candidat/offres">
                Explorer les offres
              </Link>
            </div>
          </article>
        ) : filteredApplications.length > 0 ? (
          filteredApplications.map((application) => {
            const status = getApplicationStatusMeta(application.status);

            return (
              <article key={application.id} className="panel job-card jobs-result-card">
                <div className="jobs-result-card__head">
                  <span className="tag">{status.label}</span>
                  <small>Maj le {formatDisplayDate(getApplicationSortDate(application))}</small>
                </div>

                <h2>{application.job_title}</h2>
                <p>{status.description}</p>

                <div className="job-card__meta">
                  <span>{application.organization_name}</span>
                  <span>{application.job_location}</span>
                  <span>{application.contract_type}</span>
                  <span>{application.has_cv ? "CV joint" : "Sans CV joint"}</span>
                </div>

                <div className="job-card__footer">
                  <small>
                    {application.cover_letter
                      ? "Message de candidature present"
                      : status.candidateHint}
                  </small>
                  <Link href={`/app/candidat/candidatures/${application.id}`}>
                    Ouvrir le dossier
                  </Link>
                </div>
              </article>
            );
          })
        ) : (
          <article className="panel jobs-empty">
            <h2>Aucune candidature ne correspond a ces filtres</h2>
            <p>Elargissez vos criteres pour retrouver tous vos dossiers visibles.</p>
            <div className="dashboard-action-stack">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setFilters(initialFilters)}
              >
                Reinitialiser les filtres
              </button>
            </div>
          </article>
        )}
      </section>
    </div>
  );
}
