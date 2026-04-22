"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";

import { getApplicationStatusMeta } from "@/lib/application-status";
import { formatDisplayDate } from "@/lib/format";
import {
  getCandidateJobMatch,
  type JobMatchResult,
  type MatchableJob,
  type MatchingCandidateProfile
} from "@/lib/matching";
import type { ManagedCandidateSummary, RecruiterApplication } from "@/lib/types";

type ShortlistBoardProps = {
  applications: RecruiterApplication[];
  candidates: ManagedCandidateSummary[];
  jobs: MatchableJob[];
  role: "recruteur" | "admin";
};

type Filters = {
  query: string;
  jobId: string;
  matchMode: "" | "with_signal" | "good" | "strong";
  sort: "updated_desc" | "match_desc" | "completion_desc" | "name_asc";
  withCvOnly: boolean;
};

type ShortlistRow = {
  application: RecruiterApplication;
  candidate: ManagedCandidateSummary | null;
  job: MatchableJob | null;
  match: JobMatchResult | null;
};

const shortlistStatuses = ["shortlist", "interview", "hired"] as const;

const initialFilters: Filters = {
  query: "",
  jobId: "",
  matchMode: "",
  sort: "match_desc",
  withCvOnly: false
};

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

function getJobOptionLabel(job: MatchableJob) {
  return [job.title, job.location, job.organization_name].filter(Boolean).join(" · ");
}

export function ShortlistBoard({
  applications,
  candidates,
  jobs,
  role
}: ShortlistBoardProps) {
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const deferredQuery = useDeferredValue(filters.query);

  const applicationsBasePath =
    role === "admin" ? "/app/admin/candidatures" : "/app/recruteur/candidatures";
  const candidatesBasePath =
    role === "admin" ? "/app/admin/candidats" : "/app/recruteur/candidats";
  const offersBasePath = role === "admin" ? "/app/admin/offres" : "/app/recruteur/offres";

  const candidateById = useMemo(
    () => new Map(candidates.map((candidate) => [candidate.id, candidate])),
    [candidates]
  );
  const jobById = useMemo(
    () => new Map(jobs.map((job) => [job.id, job])),
    [jobs]
  );
  const jobOptions = useMemo(
    () =>
      jobs
        .filter((job) => job.status !== "archived")
        .slice()
        .sort((left, right) => left.title.localeCompare(right.title, "fr")),
    [jobs]
  );

  const shortlistRows = useMemo(
    () =>
      applications
        .filter((application) =>
          shortlistStatuses.includes(application.status as (typeof shortlistStatuses)[number])
        )
        .map((application) => {
          const candidate = application.candidate_id
            ? candidateById.get(application.candidate_id) ?? null
            : null;
          const job = application.job_id ? jobById.get(application.job_id) ?? null : null;
          const match =
            candidate && job ? getCandidateJobMatch(buildMatchingProfile(candidate), job) : null;

          return {
            application,
            candidate,
            job,
            match
          } satisfies ShortlistRow;
        }),
    [applications, candidateById, jobById]
  );

  const filteredRows = useMemo(() => {
    const query = deferredQuery.trim().toLowerCase();

    return shortlistRows
      .filter((row) => {
        const { application, candidate, job, match } = row;
        const matchesQuery =
          !query ||
          [
            application.candidate_name,
            application.candidate_email,
            candidate?.headline ?? "",
            candidate?.desired_position ?? "",
            candidate?.skills_text ?? "",
            application.job_title,
            job?.organization_name ?? ""
          ]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(query));

        const matchesJob = !filters.jobId || application.job_id === filters.jobId;
        const matchesCv = !filters.withCvOnly || application.has_cv;
        const matchesMatchMode =
          !filters.matchMode ||
          (filters.matchMode === "with_signal" && Boolean(match?.hasSignal)) ||
          (filters.matchMode === "good" && Boolean(match?.hasSignal && match.score >= 60)) ||
          (filters.matchMode === "strong" && Boolean(match?.hasSignal && match.score >= 78));

        return matchesQuery && matchesJob && matchesCv && matchesMatchMode;
      })
      .sort((left, right) => {
        const leftUpdatedAt = left.application.updated_at ?? left.application.created_at;
        const rightUpdatedAt = right.application.updated_at ?? right.application.created_at;
        const leftTime = new Date(leftUpdatedAt).getTime();
        const rightTime = new Date(rightUpdatedAt).getTime();

        if (filters.sort === "match_desc") {
          const leftScore = left.match?.score ?? 0;
          const rightScore = right.match?.score ?? 0;

          if (leftScore !== rightScore) {
            return rightScore - leftScore;
          }
        }

        if (filters.sort === "completion_desc") {
          const leftCompletion = left.candidate?.profile_completion ?? 0;
          const rightCompletion = right.candidate?.profile_completion ?? 0;

          if (leftCompletion !== rightCompletion) {
            return rightCompletion - leftCompletion;
          }
        }

        if (filters.sort === "name_asc") {
          const comparison = left.application.candidate_name.localeCompare(
            right.application.candidate_name,
            "fr"
          );

          if (comparison !== 0) {
            return comparison;
          }
        }

        return rightTime - leftTime;
      });
  }, [
    deferredQuery,
    filters.jobId,
    filters.matchMode,
    filters.sort,
    filters.withCvOnly,
    shortlistRows
  ]);

  const activeFilterCount = [
    filters.query,
    filters.jobId,
    filters.matchMode,
    filters.withCvOnly ? "cv" : "",
    filters.sort !== "match_desc" ? filters.sort : ""
  ].filter(Boolean).length;

  const stats = useMemo(() => {
    let withSignal = 0;
    let good = 0;
    let strong = 0;

    for (const row of filteredRows) {
      if (!row.match?.hasSignal) {
        continue;
      }

      withSignal += 1;

      if ((row.match.score ?? 0) >= 60) {
        good += 1;
      }

      if ((row.match.score ?? 0) >= 78) {
        strong += 1;
      }
    }

    return { withSignal, good, strong };
  }, [filteredRows]);

  const columns = useMemo(
    () =>
      shortlistStatuses.map((status) => ({
        status,
        meta: getApplicationStatusMeta(status),
        rows: filteredRows.filter((row) => row.application.status === status)
      })),
    [filteredRows]
  );

  return (
    <div className="jobs-board">
      <section className="dashboard-form">
        <div className="dashboard-form__head">
          <div>
            <p className="eyebrow">Shortlist recrutement</p>
            <h2>Travaillez les meilleurs dossiers sans repasser par toute la pile</h2>
          </div>
          <span className="tag">{filteredRows.length} dossier(s)</span>
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
              placeholder="Candidat, email, headline, offre, competences..."
            />
          </label>

          <label className="field">
            <span>Offre cible</span>
            <select
              value={filters.jobId}
              onChange={(event) =>
                setFilters((previous) => ({
                  ...previous,
                  jobId: event.target.value
                }))
              }
            >
              <option value="">Toutes les offres</option>
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
              <option value="">Tous les dossiers</option>
              <option value="with_signal">Dossiers matchables</option>
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
              <option value="match_desc">Compatibilite sur le dossier</option>
              <option value="updated_desc">Dernier mouvement</option>
              <option value="completion_desc">Profil le plus complet</option>
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
            <span>Afficher uniquement les dossiers avec CV joint</span>
          </label>
        </div>

        <div className="jobs-board__actions">
          <div className="dashboard-card__badges">
            <span className="tag tag--muted">{stats.withSignal} dossier(s) matchables</span>
            <span className="tag tag--info">{stats.good} bon(s) match(s)</span>
            <span className="tag tag--success">{stats.strong} fort(s) match(s)</span>
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
          Chaque score de match est calcule sur l&apos;offre du dossier pour aider a prioriser la shortlist, pas sur la meilleure offre globale du candidat.
        </p>
      </section>

      {filteredRows.length > 0 ? (
        <section className="pipeline-board">
          {columns.map((column) => (
            <article key={column.status} className="panel pipeline-column">
              <div className="pipeline-column__head">
                <div>
                  <p className="eyebrow">{column.meta.label}</p>
                  <h2>{column.rows.length} dossier(s)</h2>
                </div>
                <span className="tag tag--muted">{column.status}</span>
              </div>

              <p className="form-caption">{column.meta.description}</p>

              <div className="pipeline-column__list">
                {column.rows.length > 0 ? (
                  column.rows.map((row) => {
                    const profile = row.candidate;
                    const job = row.job;
                    const match = row.match;

                    return (
                      <article key={row.application.id} className="document-card pipeline-card">
                        <div className="dashboard-card__top">
                          <div>
                            <strong>{row.application.candidate_name}</strong>
                            <p>{row.application.job_title}</p>
                          </div>
                          <div className="dashboard-card__badges">
                            {match?.hasSignal ? (
                              <span className={`tag tag--${match.tone}`}>{match.label}</span>
                            ) : null}
                            <span className="tag tag--muted">
                              {profile?.profile_completion ?? 0}% complet
                            </span>
                          </div>
                        </div>

                        <div className="job-card__meta">
                          <span>{row.application.candidate_email}</span>
                          <span>{profile?.city || row.application.job_location}</span>
                          <span>{row.application.has_cv ? "CV joint" : "CV non joint"}</span>
                        </div>

                        <p>{profile?.headline || profile?.desired_position || "Profil candidat Madajob"}</p>
                        {match ? (
                          <p className="match-caption">{match.reason}</p>
                        ) : (
                          <p className="match-caption">
                            Matching indisponible tant que le profil ou l&apos;offre n&apos;est pas assez renseigne.
                          </p>
                        )}

                        <div className="job-card__footer">
                          <small>
                            Dernier mouvement le {formatDisplayDate(row.application.updated_at ?? row.application.created_at)}
                          </small>
                          <Link href={`${applicationsBasePath}/${row.application.id}`}>
                            Ouvrir le dossier
                          </Link>
                        </div>

                        <div className="dashboard-action-stack">
                          {profile ? (
                            <Link className="btn btn-secondary btn-block" href={`${candidatesBasePath}/${profile.id}`}>
                              Ouvrir le profil
                            </Link>
                          ) : null}
                          {job ? (
                            <Link className="btn btn-ghost btn-block" href={`${offersBasePath}/${job.id}`}>
                              Ouvrir l&apos;offre
                            </Link>
                          ) : null}
                        </div>
                      </article>
                    );
                  })
                ) : (
                  <article className="document-card pipeline-card pipeline-card--empty">
                    <strong>Aucun dossier</strong>
                    <p>Cette etape avancee du pipeline est vide avec les filtres actuels.</p>
                  </article>
                )}
              </div>
            </article>
          ))}
        </section>
      ) : (
        <section className="jobs-results">
          <article className="panel jobs-empty">
            <h2>Aucun dossier shortlist ne correspond a ces filtres</h2>
            <p>Affinez la recherche ou revenez sur l&apos;ensemble des offres pour retrouver vos meilleurs profils.</p>
          </article>
        </section>
      )}
    </div>
  );
}
