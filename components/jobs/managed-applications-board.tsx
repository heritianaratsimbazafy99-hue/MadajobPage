"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";

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
};

const initialFilters: Filters = {
  query: "",
  status: "",
  withCvOnly: false
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

    return applications.filter((application) => {
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

      return matchesQuery && matchesStatus && matchesCv;
    });
  }, [applications, deferredQuery, filters.status, filters.withCvOnly]);

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
                  {option}
                </option>
              ))}
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
      </section>

      <section className="jobs-results">
        {filteredApplications.length > 0 ? (
          filteredApplications.map((application) => (
            <article key={application.id} className="panel job-card jobs-result-card">
              <div className="jobs-result-card__head">
                <span className="tag">{application.status}</span>
                <small>Soumis le {formatDisplayDate(application.created_at)}</small>
              </div>
              <h2>{application.candidate_name}</h2>
              <p>{application.job_title}</p>
              <div className="job-card__meta">
                <span>{application.candidate_email}</span>
                <span>{application.job_location}</span>
                <span>{application.has_cv ? "CV joint" : "CV non joint"}</span>
              </div>
              <div className="job-card__footer">
                <small>{application.cover_letter ? "Message candidat present" : "Sans message candidat"}</small>
                <Link href={`${basePath}/${application.id}`}>Ouvrir le dossier</Link>
              </div>
            </article>
          ))
        ) : (
          <article className="panel jobs-empty">
            <h2>Aucun dossier ne correspond a ces filtres</h2>
            <p>Affinez votre recherche ou revenez sur la vue globale du pipeline.</p>
          </article>
        )}
      </section>
    </div>
  );
}
