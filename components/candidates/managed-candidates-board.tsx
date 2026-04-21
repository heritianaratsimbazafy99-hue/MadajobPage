"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";

import { formatDisplayDate } from "@/lib/format";
import {
  getBestJobMatchForCandidate,
  getCandidateJobMatch,
  type JobMatchResult,
  type MatchableJob,
  type MatchingCandidateProfile
} from "@/lib/matching";
import type { ManagedCandidateSummary } from "@/lib/types";

type ManagedCandidatesBoardProps = {
  candidates: ManagedCandidateSummary[];
  jobs: MatchableJob[];
  basePath: "/app/recruteur/candidats" | "/app/admin/candidats";
};

type Filters = {
  query: string;
  city: string;
  selectedJobId: string;
  withCvOnly: boolean;
  matchMode: "" | "with_signal" | "good" | "strong";
  sort:
    | "activity_desc"
    | "match_desc"
    | "completion_desc"
    | "applications_desc"
    | "name_asc";
};

type CandidateMatchContext = {
  job: MatchableJob | null;
  match: JobMatchResult;
  source: "best" | "selected";
} | null;

const initialFilters: Filters = {
  query: "",
  city: "",
  selectedJobId: "",
  withCvOnly: false,
  matchMode: "",
  sort: "activity_desc"
};

function getCities(candidates: ManagedCandidateSummary[]) {
  return Array.from(
    new Set(candidates.map((candidate) => candidate.city).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b, "fr"));
}

function getJobStatusWeight(status: string) {
  if (status === "published") {
    return 0;
  }

  if (status === "draft") {
    return 1;
  }

  if (status === "closed") {
    return 2;
  }

  return 3;
}

function getJobOptionLabel(job: MatchableJob) {
  return [job.title, job.location, job.organization_name].filter(Boolean).join(" · ");
}

function buildMatchingProfile(candidate: ManagedCandidateSummary): MatchingCandidateProfile {
  return {
    headline: candidate.headline,
    skills_text: candidate.skills_text,
    city: candidate.city,
    current_position: candidate.current_position,
    desired_position: candidate.desired_position,
    profile_completion: candidate.profile_completion
  };
}

function getCandidateMatchContext(
  candidate: ManagedCandidateSummary,
  jobs: MatchableJob[],
  selectedJob: MatchableJob | null
): CandidateMatchContext {
  if (selectedJob) {
    return {
      job: selectedJob,
      match: getCandidateJobMatch(buildMatchingProfile(candidate), selectedJob),
      source: "selected"
    };
  }

  const bestMatch = getBestJobMatchForCandidate(buildMatchingProfile(candidate), jobs);

  if (!bestMatch) {
    return null;
  }

  return {
    ...bestMatch,
    source: "best"
  };
}

function shouldShowMatch(
  matchContext: CandidateMatchContext,
  selectedJob: MatchableJob | null
) {
  if (!matchContext || !matchContext.match.hasSignal) {
    return false;
  }

  if (selectedJob) {
    return true;
  }

  return matchContext.match.score >= 40;
}

export function ManagedCandidatesBoard({
  candidates,
  jobs,
  basePath
}: ManagedCandidatesBoardProps) {
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const deferredQuery = useDeferredValue(filters.query);

  const cityOptions = useMemo(() => getCities(candidates), [candidates]);
  const jobOptions = useMemo(
    () =>
      jobs
        .filter((job) => job.status !== "archived")
        .slice()
        .sort((left, right) => {
          const statusWeight = getJobStatusWeight(left.status) - getJobStatusWeight(right.status);

          if (statusWeight !== 0) {
            return statusWeight;
          }

          return left.title.localeCompare(right.title, "fr");
        }),
    [jobs]
  );
  const selectedJob = useMemo(
    () => jobOptions.find((job) => job.id === filters.selectedJobId) ?? null,
    [filters.selectedJobId, jobOptions]
  );

  const matchContextByCandidateId = useMemo(
    () =>
      new Map(
        candidates.map((candidate) => [
          candidate.id,
          getCandidateMatchContext(candidate, jobOptions, selectedJob)
        ])
      ),
    [candidates, jobOptions, selectedJob]
  );

  const filteredCandidates = useMemo(() => {
    const query = deferredQuery.trim().toLowerCase();

    return candidates
      .filter((candidate) => {
        const matchContext = matchContextByCandidateId.get(candidate.id) ?? null;
        const matchesQuery =
          !query ||
          [
            candidate.full_name,
            candidate.email,
            candidate.headline,
            candidate.skills_text,
            candidate.current_position,
            candidate.desired_position,
            candidate.latest_job_title,
            matchContext?.job?.title ?? ""
          ]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(query));

        const matchesCity = !filters.city || candidate.city === filters.city;
        const matchesCv = !filters.withCvOnly || candidate.has_primary_cv;
        const matchesMatchMode =
          !filters.matchMode ||
          (filters.matchMode === "with_signal" &&
            Boolean(matchContext?.match.hasSignal)) ||
          (filters.matchMode === "good" &&
            Boolean(matchContext?.match.hasSignal && matchContext.match.score >= 60)) ||
          (filters.matchMode === "strong" &&
            Boolean(matchContext?.match.hasSignal && matchContext.match.score >= 78));

        return matchesQuery && matchesCity && matchesCv && matchesMatchMode;
      })
      .sort((left, right) => {
        const leftMatch = matchContextByCandidateId.get(left.id) ?? null;
        const rightMatch = matchContextByCandidateId.get(right.id) ?? null;
        const leftScore = leftMatch?.match.score ?? 0;
        const rightScore = rightMatch?.match.score ?? 0;
        const leftDate = left.latest_application_at
          ? new Date(left.latest_application_at).getTime()
          : 0;
        const rightDate = right.latest_application_at
          ? new Date(right.latest_application_at).getTime()
          : 0;

        if (filters.sort === "match_desc") {
          if (leftScore !== rightScore) {
            return rightScore - leftScore;
          }
        }

        if (filters.sort === "completion_desc") {
          if (left.profile_completion !== right.profile_completion) {
            return right.profile_completion - left.profile_completion;
          }
        }

        if (filters.sort === "applications_desc") {
          if (left.applications_count !== right.applications_count) {
            return right.applications_count - left.applications_count;
          }
        }

        if (filters.sort === "name_asc") {
          const comparison = left.full_name.localeCompare(right.full_name, "fr");

          if (comparison !== 0) {
            return comparison;
          }
        }

        return rightDate - leftDate;
      });
  }, [
    candidates,
    deferredQuery,
    filters.city,
    filters.matchMode,
    filters.sort,
    filters.withCvOnly,
    matchContextByCandidateId
  ]);

  const activeFilterCount = [
    filters.query,
    filters.city,
    filters.selectedJobId,
    filters.withCvOnly ? "cv" : "",
    filters.matchMode,
    filters.sort !== "activity_desc" ? filters.sort : ""
  ].filter(Boolean).length;

  const matchStats = useMemo(() => {
    let withSignal = 0;
    let good = 0;
    let strong = 0;

    for (const candidate of filteredCandidates) {
      const matchContext = matchContextByCandidateId.get(candidate.id) ?? null;

      if (!matchContext?.match.hasSignal) {
        continue;
      }

      withSignal += 1;

      if (matchContext.match.score >= 60) {
        good += 1;
      }

      if (matchContext.match.score >= 78) {
        strong += 1;
      }
    }

    return { withSignal, good, strong };
  }, [filteredCandidates, matchContextByCandidateId]);

  return (
    <div className="jobs-board">
      <section className="dashboard-form">
        <div className="dashboard-form__head">
          <div>
            <p className="eyebrow">Base candidats</p>
            <h2>Retrouvez les profils qui alimentent votre pipeline</h2>
          </div>
          <span className="tag">{filteredCandidates.length} profil(s)</span>
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
              placeholder="Nom, email, headline, competences, poste recherche..."
            />
          </label>

          <label className="field">
            <span>Ville</span>
            <select
              value={filters.city}
              onChange={(event) =>
                setFilters((previous) => ({
                  ...previous,
                  city: event.target.value
                }))
              }
            >
              <option value="">Toutes les villes</option>
              {cityOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Offre de reference</span>
            <select
              value={filters.selectedJobId}
              onChange={(event) =>
                setFilters((previous) => ({
                  ...previous,
                  selectedJobId: event.target.value
                }))
              }
            >
              <option value="">Toutes les offres (meilleur match global)</option>
              {jobOptions.map((job) => (
                <option key={job.id} value={job.id}>
                  {getJobOptionLabel(job)}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Option match candidat</span>
            <select
              value={filters.matchMode}
              onChange={(event) =>
                setFilters((previous) => ({
                  ...previous,
                  matchMode: event.target.value as Filters["matchMode"]
                }))
              }
            >
              <option value="">Tous les profils</option>
              <option value="with_signal">Profils matchables</option>
              <option value="good">Bon match et plus</option>
              <option value="strong">Forts matchs seulement</option>
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
              <option value="activity_desc">Activite recente</option>
              <option value="match_desc">
                {selectedJob ? "Compatibilite sur l'offre" : "Compatibilite globale"}
              </option>
              <option value="completion_desc">Profil le plus complet</option>
              <option value="applications_desc">Plus de candidatures</option>
              <option value="name_asc">Nom A-Z</option>
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
            <span>Afficher uniquement les profils avec CV principal</span>
          </label>
        </div>

        <div className="jobs-board__actions">
          <div className="dashboard-card__badges">
            <span className="tag tag--muted">
              {selectedJob
                ? `Matching sur ${selectedJob.title}`
                : "Matching sur la meilleure offre accessible"}
            </span>
            <span className="tag tag--muted">{matchStats.withSignal} profil(s) matchables</span>
            <span className="tag tag--info">{matchStats.good} bon(s) match(s)</span>
            <span className="tag tag--success">{matchStats.strong} fort(s) match(s)</span>
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

        <p className="form-caption">
          {selectedJob
            ? "Le matching et le tri par compatibilite sont maintenant calcules sur l'offre selectionnee."
            : "Sans offre selectionnee, chaque profil est compare a toutes les offres accessibles et conserve son meilleur match."}
        </p>
      </section>

      <section className="jobs-results">
        {filteredCandidates.length > 0 ? (
          filteredCandidates.map((candidate) => {
            const matchContext = matchContextByCandidateId.get(candidate.id) ?? null;
            const showMatch = shouldShowMatch(matchContext, selectedJob);
            const matchTitle = selectedJob
              ? selectedJob.title
              : matchContext?.job?.title || candidate.latest_job_title || "Aucune offre cible";

            return (
              <article key={candidate.id} className="panel job-card jobs-result-card">
                <div className="jobs-result-card__head">
                  <div className="jobs-result-card__badges">
                    <span className="tag">{candidate.latest_status || "Profil"}</span>
                    <span className="tag tag--muted">{candidate.profile_completion}% complet</span>
                    {showMatch && matchContext ? (
                      <span className={`tag tag--${matchContext.match.tone}`}>
                        {matchContext.match.label}
                      </span>
                    ) : null}
                  </div>
                  <small>
                    {candidate.latest_application_at
                      ? `Derniere candidature le ${formatDisplayDate(candidate.latest_application_at)}`
                      : "Pas de candidature recente"}
                  </small>
                </div>

                <h2>{candidate.full_name}</h2>
                <p>{candidate.headline || candidate.desired_position || "Profil candidat Madajob"}</p>

                <div className="job-card__meta">
                  {candidate.email ? <span>{candidate.email}</span> : null}
                  {candidate.city ? <span>{candidate.city}</span> : null}
                  <span>{candidate.applications_count} candidature(s)</span>
                  <span>{candidate.has_primary_cv ? "CV principal actif" : "Sans CV principal"}</span>
                </div>

                {showMatch && matchContext ? (
                  <p className="match-caption">
                    {matchContext.match.reason} {selectedJob ? "Offre cible selectionnee" : "Meilleure offre detectee"}:
                    {" "}
                    {matchContext.job?.title || matchTitle}.
                  </p>
                ) : selectedJob && matchContext ? (
                  <p className="match-caption">{matchContext.match.reason}</p>
                ) : null}

                <div className="job-card__footer">
                  <small>{matchTitle}</small>
                  <Link href={`${basePath}/${candidate.id}`}>Ouvrir le profil</Link>
                </div>
              </article>
            );
          })
        ) : (
          <article className="panel jobs-empty">
            <h2>Aucun profil ne correspond a ces filtres</h2>
            <p>Affinez la recherche pour retrouver un candidat ou vider les filtres.</p>
          </article>
        )}
      </section>
    </div>
  );
}
