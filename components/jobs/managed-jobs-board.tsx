"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";

import { formatDisplayDate } from "@/lib/format";
import type { ManagedJob } from "@/lib/types";

type ManagedJobsBoardProps = {
  jobs: ManagedJob[];
  basePath: "/app/recruteur/offres" | "/app/admin/offres";
};

type ManagedFilters = {
  query: string;
  status: string;
  location: string;
};

const initialFilters: ManagedFilters = {
  query: "",
  status: "",
  location: ""
};

function getUniqueValues(values: string[]) {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b, "fr"));
}

export function ManagedJobsBoard({ jobs, basePath }: ManagedJobsBoardProps) {
  const [filters, setFilters] = useState<ManagedFilters>(initialFilters);
  const deferredQuery = useDeferredValue(filters.query);

  const filterOptions = useMemo(
    () => ({
      statuses: getUniqueValues(jobs.map((job) => job.status)),
      locations: getUniqueValues(jobs.map((job) => job.location))
    }),
    [jobs]
  );

  const filteredJobs = useMemo(() => {
    const query = deferredQuery.trim().toLowerCase();

    return jobs.filter((job) => {
      const matchesQuery =
        !query ||
        [job.title, job.summary, job.location, job.contract_type, job.work_mode, job.sector]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(query));

      const matchesStatus = !filters.status || job.status === filters.status;
      const matchesLocation = !filters.location || job.location === filters.location;

      return matchesQuery && matchesStatus && matchesLocation;
    });
  }, [deferredQuery, filters.location, filters.status, jobs]);

  return (
    <div className="jobs-board">
      <section className="dashboard-form">
        <div className="dashboard-form__head">
          <div>
            <p className="eyebrow">Gestion des offres</p>
            <h2>Retrouvez, filtrez et ouvrez vos annonces</h2>
          </div>
          <span className="tag">{filteredJobs.length} offre(s)</span>
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
              placeholder="Titre, secteur, contrat, mot cle..."
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
              {filterOptions.statuses.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Lieu</span>
            <select
              value={filters.location}
              onChange={(event) =>
                setFilters((previous) => ({
                  ...previous,
                  location: event.target.value
                }))
              }
            >
              <option value="">Tous les lieux</option>
              {filterOptions.locations.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="jobs-results">
        {filteredJobs.length > 0 ? (
          filteredJobs.map((job) => (
            <article key={job.id} className="panel job-card jobs-result-card">
              <div className="jobs-result-card__head">
                <span className="tag">{job.status}</span>
                <small>Mise a jour le {formatDisplayDate(job.updated_at)}</small>
              </div>
              <h2>{job.title}</h2>
              <p>{job.summary}</p>
              <div className="job-card__meta">
                <span>{job.location}</span>
                <span>{job.contract_type}</span>
                <span>{job.work_mode}</span>
                <span>{job.applications_count} candidature(s)</span>
              </div>
              <div className="job-card__footer">
                <small>Publiee le {formatDisplayDate(job.published_at)}</small>
                <Link href={`${basePath}/${job.id}`}>Gerer l'offre</Link>
              </div>
            </article>
          ))
        ) : (
          <article className="panel jobs-empty">
            <h2>Aucune offre ne correspond a ces filtres</h2>
            <p>Ajustez votre recherche pour retrouver une annonce existante.</p>
          </article>
        )}
      </section>
    </div>
  );
}
