"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";

import { formatDisplayDate } from "@/lib/format";
import type { Job } from "@/lib/types";

type PublicCareersBoardProps = {
  jobs: Job[];
};

type CareerFilters = {
  query: string;
  location: string;
  contractType: string;
  workMode: string;
  sector: string;
  featuredOnly: boolean;
  sort: "featured" | "recent" | "oldest";
};

const initialFilters: CareerFilters = {
  query: "",
  location: "",
  contractType: "",
  workMode: "",
  sector: "",
  featuredOnly: false,
  sort: "featured"
};

function getUniqueValues(values: string[]) {
  return Array.from(new Set(values.filter(Boolean))).sort((left, right) =>
    left.localeCompare(right, "fr")
  );
}

export function PublicCareersBoard({ jobs }: PublicCareersBoardProps) {
  const [filters, setFilters] = useState<CareerFilters>(initialFilters);
  const deferredQuery = useDeferredValue(filters.query);

  const options = useMemo(
    () => ({
      locations: getUniqueValues(jobs.map((job) => job.location)),
      contractTypes: getUniqueValues(jobs.map((job) => job.contract_type)),
      workModes: getUniqueValues(jobs.map((job) => job.work_mode)),
      sectors: getUniqueValues(jobs.map((job) => job.sector))
    }),
    [jobs]
  );

  const filteredJobs = useMemo(() => {
    const query = deferredQuery.trim().toLowerCase();

    return jobs
      .filter((job) => {
        const matchesQuery =
          !query ||
          [
            job.title,
            job.summary,
            job.location,
            job.contract_type,
            job.work_mode,
            job.sector,
            job.organization_name
          ]
            .filter((value): value is string => typeof value === "string" && value.length > 0)
            .some((value) => value.toLowerCase().includes(query));

        return (
          matchesQuery &&
          (!filters.location || job.location === filters.location) &&
          (!filters.contractType || job.contract_type === filters.contractType) &&
          (!filters.workMode || job.work_mode === filters.workMode) &&
          (!filters.sector || job.sector === filters.sector) &&
          (!filters.featuredOnly || job.is_featured)
        );
      })
      .sort((left, right) => {
        if (filters.sort === "featured" && left.is_featured !== right.is_featured) {
          return left.is_featured ? -1 : 1;
        }

        const leftDate = left.published_at ? new Date(left.published_at).getTime() : 0;
        const rightDate = right.published_at ? new Date(right.published_at).getTime() : 0;

        return filters.sort === "oldest" ? leftDate - rightDate : rightDate - leftDate;
      });
  }, [
    deferredQuery,
    filters.contractType,
    filters.featuredOnly,
    filters.location,
    filters.sector,
    filters.sort,
    filters.workMode,
    jobs
  ]);

  const activeFilterCount = [
    filters.query,
    filters.location,
    filters.contractType,
    filters.workMode,
    filters.sector,
    filters.featuredOnly ? "featured" : "",
    filters.sort !== "featured" ? filters.sort : ""
  ].filter(Boolean).length;

  return (
    <div className="career-board">
      <section className="panel career-filter-panel">
        <div className="career-filter-panel__head">
          <div>
            <p className="eyebrow">Recherche d'offres</p>
            <h2>Filtrer les annonces publiees par Madajob</h2>
          </div>
          <span className="tag">{filteredJobs.length} offre(s)</span>
        </div>

        <div className="career-filter-grid">
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
              placeholder="Titre, secteur, lieu, mot cle..."
            />
          </label>

          <label className="field">
            <span>Lieu</span>
            <select
              value={filters.location}
              onChange={(event) =>
                setFilters((previous) => ({ ...previous, location: event.target.value }))
              }
            >
              <option value="">Tous les lieux</option>
              {options.locations.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Contrat</span>
            <select
              value={filters.contractType}
              onChange={(event) =>
                setFilters((previous) => ({ ...previous, contractType: event.target.value }))
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
            <span>Mode</span>
            <select
              value={filters.workMode}
              onChange={(event) =>
                setFilters((previous) => ({ ...previous, workMode: event.target.value }))
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
            <span>Secteur</span>
            <select
              value={filters.sector}
              onChange={(event) =>
                setFilters((previous) => ({ ...previous, sector: event.target.value }))
              }
            >
              <option value="">Tous les secteurs</option>
              {options.sectors.map((option) => (
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
                  sort: event.target.value as CareerFilters["sort"]
                }))
              }
            >
              <option value="featured">Mises en avant d'abord</option>
              <option value="recent">Plus recentes</option>
              <option value="oldest">Plus anciennes</option>
            </select>
          </label>
        </div>

        <div className="career-filter-panel__actions">
          <label className="checkbox-field">
            <input
              type="checkbox"
              checked={filters.featuredOnly}
              onChange={(event) =>
                setFilters((previous) => ({
                  ...previous,
                  featuredOnly: event.target.checked
                }))
              }
            />
            <span>Afficher uniquement les offres mises en avant</span>
          </label>

          {activeFilterCount > 0 ? (
            <button className="btn btn-ghost" type="button" onClick={() => setFilters(initialFilters)}>
              Reinitialiser
            </button>
          ) : null}
        </div>
      </section>

      <section className="career-results-grid">
        {filteredJobs.length > 0 ? (
          filteredJobs.map((job) => (
            <article key={job.id} className="panel job-card career-job-card">
              <div className="career-job-card__head">
                <div className="dashboard-card__badges">
                  {job.is_featured ? <span className="tag tag--success">Mise en avant</span> : null}
                  <span className="tag tag--muted">{job.sector || "Madajob"}</span>
                </div>
                <small>Publie le {formatDisplayDate(job.published_at)}</small>
              </div>
              <h2>{job.title}</h2>
              <p>{job.summary}</p>
              <div className="job-card__meta">
                <span>{job.organization_name || "Madajob"}</span>
                <span>{job.location}</span>
                <span>{job.contract_type}</span>
                <span>{job.work_mode}</span>
              </div>
              <div className="job-card__footer">
                <small>{job.department || "Offre publiee sur Madajob"}</small>
                <Link href={`/carrieres/${job.slug}`}>Voir le detail</Link>
              </div>
            </article>
          ))
        ) : (
          <article className="panel job-card career-job-card">
            <h2>Aucune offre ne correspond a ces filtres</h2>
            <p>Elargissez votre recherche ou revenez plus tard pour consulter les nouvelles annonces.</p>
          </article>
        )}
      </section>
    </div>
  );
}
