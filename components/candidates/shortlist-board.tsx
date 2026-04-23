"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";

import { getApplicationStatusMeta } from "@/lib/application-status";
import { formatDateTimeDisplay, formatDisplayDate } from "@/lib/format";
import {
  getInterviewNextActionLabel,
  getInterviewProposedDecisionMeta,
  getInterviewRecommendationMeta,
  getInterviewStatusMeta
} from "@/lib/interviews";
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
  signalFocus:
    | ""
    | "upcoming_interview"
    | "feedback_ready"
    | "feedback_missing"
    | "favorable_feedback"
    | "watchout_feedback";
  sort: "priority_desc" | "updated_desc" | "match_desc" | "completion_desc" | "name_asc";
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
  signalFocus: "",
  sort: "priority_desc",
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

function hasFavorableFeedback(application: RecruiterApplication) {
  const recommendation = application.interview_signal.latest_feedback?.recommendation;
  return recommendation === "strong_yes" || recommendation === "yes";
}

function hasWatchoutFeedback(application: RecruiterApplication) {
  const recommendation = application.interview_signal.latest_feedback?.recommendation;
  return recommendation === "mixed" || recommendation === "no";
}

function getShortlistPriorityScore(row: ShortlistRow) {
  let score = row.match?.score ?? 0;

  if (row.application.interview_signal.pending_feedback) {
    score += 220;
  }

  if (row.application.interview_signal.next_interview_at) {
    score += 140;
  }

  const latestFeedback = row.application.interview_signal.latest_feedback;

  if (latestFeedback?.proposed_decision === "hire") {
    score += 110;
  }

  if (latestFeedback?.proposed_decision === "advance") {
    score += 90;
  }

  if (latestFeedback?.recommendation === "strong_yes") {
    score += 80;
  }

  if (latestFeedback?.recommendation === "yes") {
    score += 60;
  }

  if (latestFeedback?.recommendation === "mixed") {
    score += 20;
  }

  if (latestFeedback?.recommendation === "no") {
    score -= 30;
  }

  return score;
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
        const matchesSignalFocus =
          !filters.signalFocus ||
          (filters.signalFocus === "upcoming_interview" &&
            Boolean(application.interview_signal.next_interview_at)) ||
          (filters.signalFocus === "feedback_ready" &&
            Boolean(application.interview_signal.latest_feedback)) ||
          (filters.signalFocus === "feedback_missing" &&
            application.interview_signal.pending_feedback) ||
          (filters.signalFocus === "favorable_feedback" &&
            hasFavorableFeedback(application)) ||
          (filters.signalFocus === "watchout_feedback" &&
            hasWatchoutFeedback(application));

        return matchesQuery && matchesJob && matchesCv && matchesMatchMode && matchesSignalFocus;
      })
      .sort((left, right) => {
        const leftUpdatedAt = left.application.updated_at ?? left.application.created_at;
        const rightUpdatedAt = right.application.updated_at ?? right.application.created_at;
        const leftTime = new Date(leftUpdatedAt).getTime();
        const rightTime = new Date(rightUpdatedAt).getTime();

        if (filters.sort === "priority_desc") {
          const leftScore = getShortlistPriorityScore(left);
          const rightScore = getShortlistPriorityScore(right);

          if (leftScore !== rightScore) {
            return rightScore - leftScore;
          }
        }

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
    filters.signalFocus,
    filters.sort,
    filters.withCvOnly,
    shortlistRows
  ]);

  const activeFilterCount = [
    filters.query,
    filters.jobId,
    filters.matchMode,
    filters.signalFocus,
    filters.withCvOnly ? "cv" : "",
    filters.sort !== "priority_desc" ? filters.sort : ""
  ].filter(Boolean).length;

  const stats = useMemo(() => {
    let withSignal = 0;
    let good = 0;
    let strong = 0;
    let upcoming = 0;
    let pendingFeedback = 0;
    let favorable = 0;

    for (const row of filteredRows) {
      if (row.match?.hasSignal) {
        withSignal += 1;
      }

      if ((row.match?.score ?? 0) >= 60) {
        good += 1;
      }

      if ((row.match?.score ?? 0) >= 78) {
        strong += 1;
      }

      if (row.application.interview_signal.next_interview_at) {
        upcoming += 1;
      }

      if (row.application.interview_signal.pending_feedback) {
        pendingFeedback += 1;
      }

      if (hasFavorableFeedback(row.application)) {
        favorable += 1;
      }
    }

    return { withSignal, good, strong, upcoming, pendingFeedback, favorable };
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
            <h2>Priorisez les dossiers avances avec le niveau de signal metier, entretien et feedback</h2>
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
            <span>Signal entretien</span>
            <select
              value={filters.signalFocus}
              onChange={(event) =>
                setFilters((previous) => ({
                  ...previous,
                  signalFocus: event.target.value as Filters["signalFocus"]
                }))
              }
            >
              <option value="">Tous les signaux</option>
              <option value="upcoming_interview">Entretien a venir</option>
              <option value="feedback_ready">Feedback deja saisi</option>
              <option value="feedback_missing">Feedback a saisir</option>
              <option value="favorable_feedback">Feedback favorable</option>
              <option value="watchout_feedback">Feedback avec reserves</option>
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
              <option value="priority_desc">Priorite shortlist</option>
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
            <span className="tag tag--info">{stats.upcoming} entretien(s) a venir</span>
            <span className="tag tag--danger">{stats.pendingFeedback} feedback(s) a saisir</span>
            <span className="tag tag--success">{stats.favorable} feedback(s) favorables</span>
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
          La priorisation croise le matching, les rendez-vous a venir, les feedbacks saisis et les comptes-rendus encore attendus.
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
                    const interviewSignal = row.application.interview_signal;
                    const latestFeedback = interviewSignal.latest_feedback;
                    const recommendation = latestFeedback
                      ? getInterviewRecommendationMeta(latestFeedback.recommendation)
                      : null;
                    const proposedDecision = latestFeedback
                      ? getInterviewProposedDecisionMeta(latestFeedback.proposed_decision)
                      : null;
                    const latestInterviewStatus = interviewSignal.latest_interview_status
                      ? getInterviewStatusMeta(interviewSignal.latest_interview_status)
                      : null;

                    return (
                      <article key={row.application.id} className="document-card pipeline-card">
                        <div className="dashboard-card__top">
                          <div>
                            <strong>{row.application.candidate_name}</strong>
                            <p>{row.application.job_title}</p>
                          </div>
                          <div className="dashboard-card__badges">
                            {recommendation ? (
                              <span className={`tag tag--${recommendation.tone}`}>{recommendation.label}</span>
                            ) : null}
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

                        <div className="shortlist-signal-card">
                          <div className="document-meta">
                            <span>{interviewSignal.interviews_count} entretien(s)</span>
                            {latestInterviewStatus ? (
                              <span>{latestInterviewStatus.label}</span>
                            ) : (
                              <span>Aucun entretien</span>
                            )}
                            {interviewSignal.next_interview_at ? (
                              <span>Prochain le {formatDateTimeDisplay(interviewSignal.next_interview_at)}</span>
                            ) : null}
                          </div>

                          {latestFeedback ? (
                            <>
                              <p>{latestFeedback.summary}</p>
                              <small>
                                {proposedDecision?.label ?? "Decision"} ·{" "}
                                {getInterviewNextActionLabel(latestFeedback.next_action)}
                              </small>
                            </>
                          ) : interviewSignal.pending_feedback ? (
                            <p className="form-caption">
                              Un entretien termine attend encore son compte-rendu structure.
                            </p>
                          ) : interviewSignal.next_interview_at ? (
                            <p className="form-caption">
                              Rendez-vous planifie : pensez a preparer le dossier et la prochaine decision.
                            </p>
                          ) : (
                            <p className="form-caption">
                              Aucun signal entretien structure sur ce dossier pour le moment.
                            </p>
                          )}
                        </div>

                        <div className="job-card__footer">
                          <small>
                            Dernier mouvement le{" "}
                            {formatDisplayDate(row.application.updated_at ?? row.application.created_at)}
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
