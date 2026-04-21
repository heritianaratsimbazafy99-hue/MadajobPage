"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";

import {
  getApplicationStatusMeta,
  isFinalApplicationStatus
} from "@/lib/application-status";
import { formatDisplayDate } from "@/lib/format";
import { rankJobsForCandidate, type MatchingCandidateProfile } from "@/lib/matching";
import type { CandidateApplicationSummary, Job } from "@/lib/types";

type CandidateJobsBoardProps = {
  jobs: Job[];
  applications: CandidateApplicationSummary[];
  candidateProfile: MatchingCandidateProfile;
};

type Filters = {
  query: string;
  location: string;
  contractType: string;
  workMode: string;
  sector: string;
  applicationState: "" | "available" | "applied" | "active_applied";
  featuredOnly: boolean;
  sort: "recent" | "oldest" | "featured" | "match";
};

const initialFilters: Filters = {
  query: "",
  location: "",
  contractType: "",
  workMode: "",
  sector: "",
  applicationState: "",
  featuredOnly: false,
  sort: "recent"
};

function getUniqueValues(values: Array<string | undefined>) {
  return Array.from(
    new Set(
      values
        .map((value) => (value ?? "").trim())
        .filter(Boolean)
    )
  ).sort((a, b) => a.localeCompare(b, "fr"));
}

export function CandidateJobsBoard({
  jobs,
  applications,
  candidateProfile
}: CandidateJobsBoardProps) {
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const deferredQuery = useDeferredValue(filters.query);
  const applicationByJobId = useMemo(
    () => new Map(applications.map((application) => [application.job_id, application])),
    [applications]
  );
  const matchByJobId = useMemo(
    () =>
      new Map(
        rankJobsForCandidate(candidateProfile, jobs).map((entry) => [entry.job.id, entry.match])
      ),
    [candidateProfile, jobs]
  );

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

      const matchingJobs = jobs.filter((job) => {
        const application = applicationByJobId.get(job.id) ?? null;
      const matchesQuery =
        !query ||
        [
          job.title,
          job.summary,
          job.location,
          job.contract_type,
          job.work_mode,
          job.sector
        ]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(query));

      const matchesLocation = !filters.location || job.location === filters.location;
      const matchesContract =
        !filters.contractType || job.contract_type === filters.contractType;
      const matchesWorkMode = !filters.workMode || job.work_mode === filters.workMode;
      const matchesSector = !filters.sector || job.sector === filters.sector;
      const matchesApplicationState =
        !filters.applicationState ||
        (filters.applicationState === "available" && !application) ||
        (filters.applicationState === "applied" && Boolean(application)) ||
        (filters.applicationState === "active_applied" &&
          application !== null &&
          !isFinalApplicationStatus(application.status));
      const matchesFeatured = !filters.featuredOnly || job.is_featured;

      return (
        matchesQuery &&
        matchesLocation &&
        matchesContract &&
        matchesWorkMode &&
        matchesSector &&
        matchesApplicationState &&
        matchesFeatured
      );
    });

    return matchingJobs.sort((left, right) => {
      const leftDate = left.published_at ? new Date(left.published_at).getTime() : 0;
      const rightDate = right.published_at ? new Date(right.published_at).getTime() : 0;
      const leftMatch = matchByJobId.get(left.id)?.score ?? 0;
      const rightMatch = matchByJobId.get(right.id)?.score ?? 0;

      if (filters.sort === "oldest") {
        return leftDate - rightDate;
      }

      if (filters.sort === "match") {
        if (leftMatch !== rightMatch) {
          return rightMatch - leftMatch;
        }
      }

      if (filters.sort === "featured") {
        if (left.is_featured !== right.is_featured) {
          return left.is_featured ? -1 : 1;
        }
      }

      return rightDate - leftDate;
    });
  }, [
    applicationByJobId,
    deferredQuery,
    filters.applicationState,
    filters.contractType,
    filters.featuredOnly,
    filters.location,
    filters.sector,
    filters.sort,
    filters.workMode,
    jobs,
    matchByJobId
  ]);

  const activeFilterCount = [
    filters.query,
    filters.location,
    filters.contractType,
    filters.workMode,
    filters.sector,
    filters.applicationState,
    filters.featuredOnly ? "featured" : "",
    filters.sort !== "recent" ? filters.sort : ""
  ].filter(Boolean).length;

  return (
    <div className="jobs-board">
      <section className="panel dashboard-form">
        <div className="dashboard-form__head">
          <div>
            <p className="eyebrow">Recherche avancee</p>
            <h2>Trouvez les offres sur lesquelles vous pouvez reellement postuler</h2>
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
              placeholder="Titre, secteur, mode de travail, mot cle..."
            />
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
            <span>Secteur</span>
            <select
              value={filters.sector}
              onChange={(event) =>
                setFilters((previous) => ({
                  ...previous,
                  sector: event.target.value
                }))
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
            <span>Etat de candidature</span>
            <select
              value={filters.applicationState}
              onChange={(event) =>
                setFilters((previous) => ({
                  ...previous,
                  applicationState: event.target.value as Filters["applicationState"]
                }))
              }
            >
              <option value="">Toutes les offres</option>
              <option value="available">Non encore postulees</option>
              <option value="applied">Deja postulees</option>
              <option value="active_applied">Deja postulees et encore actives</option>
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
              <option value="featured">Mises en avant d'abord</option>
              <option value="oldest">Plus anciennes</option>
            </select>
          </label>
        </div>

        <div className="jobs-board__actions">
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
        {filteredJobs.length > 0 ? (
          filteredJobs.map((job) => {
            const application = applicationByJobId.get(job.id) ?? null;
            const applicationStatus = application
              ? getApplicationStatusMeta(application.status)
              : null;
            const match = matchByJobId.get(job.id) ?? null;
            const shouldHighlightMatch =
              !application && match !== null && match.hasSignal && match.score >= 40;

            return (
              <article key={job.id} className="panel job-card jobs-result-card">
                <div className="jobs-result-card__head">
                  <div className="jobs-result-card__badges">
                    <span className={`tag ${shouldHighlightMatch ? `tag--${match?.tone}` : ""}`.trim()}>
                      {applicationStatus
                        ? applicationStatus.label
                        : shouldHighlightMatch && match
                          ? match.label
                          : job.is_featured
                            ? "Mise en avant"
                            : "Disponible"}
                    </span>
                    {shouldHighlightMatch && match ? (
                      <span className="tag tag--muted">{match.level}</span>
                    ) : null}
                  </div>
                  <small>Publie le {formatDisplayDate(job.published_at)}</small>
                </div>

                <h2>{job.title}</h2>
                <p>
                  {applicationStatus
                    ? applicationStatus.description
                    : shouldHighlightMatch && match
                      ? match.reason
                      : job.summary}
                </p>

                <div className="job-card__meta">
                  <span>{job.location}</span>
                  <span>{job.contract_type}</span>
                  <span>{job.work_mode}</span>
                  <span>{job.sector}</span>
                  {shouldHighlightMatch && match ? (
                    <span>{match.matchedKeywords.join(", ") || "Matching actif"}</span>
                  ) : null}
                </div>

                <div className="job-card__footer">
                  <small>
                    {application
                      ? `Candidature envoyee le ${formatDisplayDate(application.created_at)}`
                      : job.organization_name || "Madajob"}
                  </small>
                  <Link
                    href={
                      application
                        ? `/app/candidat/candidatures/${application.id}`
                        : `/app/candidat/offres/${job.slug}`
                    }
                  >
                    {application ? "Suivre ma candidature" : "Voir l'offre"}
                  </Link>
                </div>
              </article>
            );
          })
        ) : (
          <article className="panel jobs-empty">
            <h2>Aucune offre ne correspond a ces filtres</h2>
            <p>Elargissez votre recherche ou reinitialisez les criteres pour retrouver plus d'opportunites.</p>
          </article>
        )}
      </section>
    </div>
  );
}
