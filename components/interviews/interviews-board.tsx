"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";

import { getApplicationStatusMeta } from "@/lib/application-status";
import { formatDateTimeDisplay } from "@/lib/format";
import {
  getInterviewFormatLabel,
  getInterviewNextActionLabel,
  getInterviewProposedDecisionMeta,
  getInterviewRecommendationMeta,
  getSuggestedApplicationStatusFromInterviewDecision,
  getInterviewStatusMeta,
  interviewFormatOptions
} from "@/lib/interviews";
import type { InterviewScheduleItem, ManagedJob } from "@/lib/types";

type InterviewsBoardProps = {
  interviews: InterviewScheduleItem[];
  jobs: ManagedJob[];
  role: "recruteur" | "admin";
};

type Filters = {
  query: string;
  status: "" | "scheduled" | "completed" | "cancelled";
  format: "" | "phone" | "video" | "onsite" | "other";
  jobId: string;
  signalFocus:
    | ""
    | "today"
    | "overdue"
    | "feedback_missing"
    | "decision_ready"
    | "favorable_feedback"
    | "watchout_feedback";
  sort: "priority_desc" | "soonest" | "recent" | "candidate";
};

const initialFilters: Filters = {
  query: "",
  status: "",
  format: "",
  jobId: "",
  signalFocus: "",
  sort: "priority_desc"
};

function getApplicationStatusTone(status: string) {
  switch (status) {
    case "hired":
    case "shortlist":
      return "success";
    case "rejected":
      return "danger";
    case "screening":
    case "interview":
      return "info";
    default:
      return "muted";
  }
}

function isToday(value: string) {
  const date = new Date(value);
  const now = new Date();

  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function isOverdueScheduledInterview(interview: InterviewScheduleItem) {
  return interview.status === "scheduled" && new Date(interview.starts_at).getTime() < Date.now();
}

function isFeedbackMissing(interview: InterviewScheduleItem) {
  return interview.status === "completed" && !interview.feedback;
}

function hasFavorableFeedback(interview: InterviewScheduleItem) {
  const recommendation = interview.feedback?.recommendation;
  return recommendation === "strong_yes" || recommendation === "yes";
}

function hasWatchoutFeedback(interview: InterviewScheduleItem) {
  const recommendation = interview.feedback?.recommendation;
  return recommendation === "mixed" || recommendation === "no";
}

function getSuggestedStatus(interview: InterviewScheduleItem) {
  if (!interview.feedback) {
    return null;
  }

  return getSuggestedApplicationStatusFromInterviewDecision(
    interview.feedback.proposed_decision,
    interview.feedback.next_action
  );
}

function isDecisionReady(interview: InterviewScheduleItem) {
  const suggestedStatus = getSuggestedStatus(interview);
  return Boolean(interview.feedback && suggestedStatus && suggestedStatus !== interview.application_status);
}

function getInterviewPriorityScore(interview: InterviewScheduleItem) {
  let score = 0;

  if (isFeedbackMissing(interview)) {
    score += 320;
  }

  if (isOverdueScheduledInterview(interview)) {
    score += 280;
  }

  if (isDecisionReady(interview)) {
    score += 240;
  }

  if (interview.status === "scheduled" && isToday(interview.starts_at)) {
    score += 200;
  }

  if (hasFavorableFeedback(interview)) {
    score += 140;
  }

  if (hasWatchoutFeedback(interview)) {
    score += 120;
  }

  if (interview.feedback?.proposed_decision === "hire") {
    score += 100;
  }

  if (interview.feedback?.proposed_decision === "reject") {
    score += 80;
  }

  if (interview.status === "scheduled") {
    score += 40;
  }

  return score;
}

export function InterviewsBoard({ interviews, jobs, role }: InterviewsBoardProps) {
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const deferredQuery = useDeferredValue(filters.query);

  const applicationsBasePath =
    role === "admin" ? "/app/admin/candidatures" : "/app/recruteur/candidatures";
  const jobsBasePath = role === "admin" ? "/app/admin/offres" : "/app/recruteur/offres";

  const jobOptions = useMemo(
    () =>
      jobs
        .filter((job) => job.status !== "archived")
        .slice()
        .sort((left, right) => left.title.localeCompare(right.title, "fr")),
    [jobs]
  );

  const filteredInterviews = useMemo(() => {
    const query = deferredQuery.trim().toLowerCase();

    return interviews
      .filter((interview) => {
        const matchesQuery =
          !query ||
          [
            interview.candidate_name,
            interview.candidate_email,
            interview.job_title,
            interview.organization_name ?? "",
            interview.interviewer_name,
            interview.location ?? "",
            interview.feedback?.summary ?? "",
            interview.feedback?.strengths ?? "",
            interview.feedback?.concerns ?? ""
          ]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(query));

        const matchesStatus = !filters.status || interview.status === filters.status;
        const matchesFormat = !filters.format || interview.format === filters.format;
        const matchesJob = !filters.jobId || interview.job_id === filters.jobId;
        const matchesSignalFocus =
          !filters.signalFocus ||
          (filters.signalFocus === "today" && isToday(interview.starts_at)) ||
          (filters.signalFocus === "overdue" && isOverdueScheduledInterview(interview)) ||
          (filters.signalFocus === "feedback_missing" && isFeedbackMissing(interview)) ||
          (filters.signalFocus === "decision_ready" && isDecisionReady(interview)) ||
          (filters.signalFocus === "favorable_feedback" && hasFavorableFeedback(interview)) ||
          (filters.signalFocus === "watchout_feedback" && hasWatchoutFeedback(interview));

        return matchesQuery && matchesStatus && matchesFormat && matchesJob && matchesSignalFocus;
      })
      .sort((left, right) => {
        if (filters.sort === "priority_desc") {
          const leftScore = getInterviewPriorityScore(left);
          const rightScore = getInterviewPriorityScore(right);

          if (leftScore !== rightScore) {
            return rightScore - leftScore;
          }
        }

        if (filters.sort === "candidate") {
          const comparison = left.candidate_name.localeCompare(right.candidate_name, "fr");
          if (comparison !== 0) {
            return comparison;
          }
        }

        const leftTime = new Date(
          filters.sort === "recent" ? left.created_at : left.starts_at
        ).getTime();
        const rightTime = new Date(
          filters.sort === "recent" ? right.created_at : right.starts_at
        ).getTime();

        if (filters.sort === "recent") {
          return rightTime - leftTime;
        }

        return leftTime - rightTime;
      });
  }, [
    deferredQuery,
    filters.format,
    filters.jobId,
    filters.signalFocus,
    filters.sort,
    filters.status,
    interviews
  ]);

  const signalStats = useMemo(() => {
    let overdue = 0;
    let feedbackMissing = 0;
    let decisionReady = 0;
    let favorable = 0;

    for (const interview of filteredInterviews) {
      if (isOverdueScheduledInterview(interview)) {
        overdue += 1;
      }

      if (isFeedbackMissing(interview)) {
        feedbackMissing += 1;
      }

      if (isDecisionReady(interview)) {
        decisionReady += 1;
      }

      if (hasFavorableFeedback(interview)) {
        favorable += 1;
      }
    }

    return {
      overdue,
      feedbackMissing,
      decisionReady,
      favorable
    };
  }, [filteredInterviews]);

  const activeFilterCount = [
    filters.query,
    filters.status,
    filters.format,
    filters.jobId,
    filters.signalFocus,
    filters.sort !== "priority_desc" ? filters.sort : ""
  ].filter(Boolean).length;

  const statusColumns = useMemo(
    () => [
      {
        key: "scheduled",
        label: "Planifies",
        rows: filteredInterviews.filter((interview) => interview.status === "scheduled")
      },
      {
        key: "completed",
        label: "Termines",
        rows: filteredInterviews.filter((interview) => interview.status === "completed")
      },
      {
        key: "cancelled",
        label: "Annules",
        rows: filteredInterviews.filter((interview) => interview.status === "cancelled")
      }
    ],
    [filteredInterviews]
  );

  return (
    <div className="jobs-board">
      <section className="dashboard-form">
        <div className="dashboard-form__head">
          <div>
            <p className="eyebrow">Pilotage des entretiens</p>
            <h2>Centralisez les rendez-vous recruteur sans perdre le lien avec le dossier</h2>
          </div>
          <span className="tag">{filteredInterviews.length} entretien(s)</span>
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
              placeholder="Candidat, offre, organisation, intervenant..."
            />
          </label>

          <label className="field">
            <span>Statut</span>
            <select
              value={filters.status}
              onChange={(event) =>
                setFilters((previous) => ({
                  ...previous,
                  status: event.target.value as Filters["status"]
                }))
              }
            >
              <option value="">Tous</option>
              <option value="scheduled">Planifies</option>
              <option value="completed">Termines</option>
              <option value="cancelled">Annules</option>
            </select>
          </label>

          <label className="field">
            <span>Format</span>
            <select
              value={filters.format}
              onChange={(event) =>
                setFilters((previous) => ({
                  ...previous,
                  format: event.target.value as Filters["format"]
                }))
              }
            >
              <option value="">Tous</option>
              {interviewFormatOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Offre</span>
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
                  {[job.title, job.location].filter(Boolean).join(" · ")}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Signal</span>
            <select
              value={filters.signalFocus}
              onChange={(event) =>
                setFilters((previous) => ({
                  ...previous,
                  signalFocus: event.target.value as Filters["signalFocus"]
                }))
              }
            >
              <option value="">Tous</option>
              <option value="today">Entretiens du jour</option>
              <option value="overdue">Entretiens en retard</option>
              <option value="feedback_missing">Feedbacks manquants</option>
              <option value="decision_ready">Decisions a appliquer</option>
              <option value="favorable_feedback">Feedbacks favorables</option>
              <option value="watchout_feedback">Feedbacks reserves</option>
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
              <option value="priority_desc">Priorite d'action</option>
              <option value="soonest">Plus proches</option>
              <option value="recent">Plus recents</option>
              <option value="candidate">Nom candidat</option>
            </select>
          </label>
        </div>

        <div className="interviews-board__stats">
          <article className="document-card">
            <strong>{signalStats.feedbackMissing}</strong>
            <p>feedback(s) manquant(s)</p>
          </article>
          <article className="document-card">
            <strong>{signalStats.decisionReady}</strong>
            <p>decision(s) a appliquer</p>
          </article>
          <article className="document-card">
            <strong>{signalStats.overdue}</strong>
            <p>entretien(s) en retard</p>
          </article>
          <article className="document-card">
            <strong>{signalStats.favorable}</strong>
            <p>feedback(s) favorable(s)</p>
          </article>
        </div>

        <p className="jobs-board__hint">
          {activeFilterCount > 0
            ? `${activeFilterCount} filtre(s) actif(s) pour concentrer les rendez-vous critiques.`
            : "Le module met en avant les feedbacks manquants, les decisions a appliquer et les entretiens du jour."}
        </p>
      </section>

      <section className="interviews-board">
        {statusColumns.map((column) => (
          <div key={column.key} className="dashboard-form interviews-board__column">
            <div className="dashboard-form__head">
              <div>
                <p className="eyebrow">{column.label}</p>
                <h2>{column.rows.length} entretien(s)</h2>
              </div>
            </div>

            <div className="dashboard-list">
              {column.rows.length > 0 ? (
                column.rows.map((interview) => {
                  const interviewStatus = getInterviewStatusMeta(interview.status);
                  const applicationStatus = getApplicationStatusMeta(interview.application_status);
                  const applicationTone = getApplicationStatusTone(interview.application_status);
                  const recommendationMeta = interview.feedback
                    ? getInterviewRecommendationMeta(interview.feedback.recommendation)
                    : null;
                  const proposedDecisionMeta = interview.feedback
                    ? getInterviewProposedDecisionMeta(interview.feedback.proposed_decision)
                    : null;
                  const suggestedStatus = getSuggestedStatus(interview);
                  const suggestedStatusMeta = suggestedStatus
                    ? getApplicationStatusMeta(suggestedStatus)
                    : null;
                  const showDecisionLink = Boolean(
                    interview.feedback && suggestedStatus && suggestedStatus !== interview.application_status
                  );

                  return (
                    <article key={interview.id} className="panel list-card dashboard-card">
                      <div className="dashboard-card__top">
                        <div>
                          <h3>{interview.candidate_name}</h3>
                          <p>{interview.job_title}</p>
                        </div>
                        <div className="dashboard-card__badges">
                          <span className={`tag tag--${interviewStatus.tone}`}>{interviewStatus.label}</span>
                          <span className={`tag tag--${applicationTone}`}>{applicationStatus.label}</span>
                        </div>
                      </div>

                      <div className="job-card__meta">
                        <span>{getInterviewFormatLabel(interview.format)}</span>
                        <span>{formatDateTimeDisplay(interview.starts_at)}</span>
                        <span>{interview.organization_name ?? "Madajob"}</span>
                      </div>

                      <p>{interview.interviewer_name}</p>
                      {interview.location ? <p className="form-caption">Lieu : {interview.location}</p> : null}

                      <div className="dashboard-card__badges">
                        {isFeedbackMissing(interview) ? (
                          <span className="tag tag--danger">Feedback manquant</span>
                        ) : null}
                        {isOverdueScheduledInterview(interview) ? (
                          <span className="tag tag--danger">En retard</span>
                        ) : null}
                        {showDecisionLink ? (
                          <span className="tag tag--warning">Decision a appliquer</span>
                        ) : null}
                        {isToday(interview.starts_at) ? (
                          <span className="tag tag--info">Aujourd'hui</span>
                        ) : null}
                      </div>

                      {interview.feedback ? (
                        <div className="interview-feedback-preview">
                          <div className="dashboard-card__top">
                            <div>
                              <strong>{proposedDecisionMeta?.label}</strong>
                              <p>{getInterviewNextActionLabel(interview.feedback.next_action)}</p>
                            </div>
                            <span className={`tag tag--${recommendationMeta?.tone ?? "muted"}`}>
                              {recommendationMeta?.label ?? "Feedback"}
                            </span>
                          </div>
                          <p>{interview.feedback.summary}</p>
                          <div className="document-meta">
                            <span>{interview.feedback.author_name}</span>
                            <span>Maj {formatDateTimeDisplay(interview.feedback.updated_at)}</span>
                          </div>
                          {suggestedStatusMeta ? (
                            <p className="form-caption">
                              Statut suggere apres entretien : {suggestedStatusMeta.label}
                            </p>
                          ) : null}
                        </div>
                      ) : interview.status === "completed" ? (
                        <p className="form-caption">Compte-rendu encore manquant pour cet entretien termine.</p>
                      ) : null}

                      <div className="notification-card__actions">
                        <Link href={`${applicationsBasePath}/${interview.application_id}`}>Ouvrir le dossier</Link>
                        <Link href={`${applicationsBasePath}/${interview.application_id}#interview-${interview.id}`}>
                          {interview.feedback ? "Voir le feedback" : "Saisir le feedback"}
                        </Link>
                        {showDecisionLink ? (
                          <Link href={`${applicationsBasePath}/${interview.application_id}#decision-post-entretien`}>
                            Appliquer la decision
                          </Link>
                        ) : null}
                        {interview.job_id ? (
                          <Link href={`${jobsBasePath}/${interview.job_id}`}>Ouvrir l'offre</Link>
                        ) : null}
                        {interview.meeting_url ? (
                          <Link href={interview.meeting_url} target="_blank" rel="noreferrer">
                            Lien entretien
                          </Link>
                        ) : null}
                      </div>
                    </article>
                  );
                })
              ) : (
                <article className="panel list-card dashboard-card dashboard-card--empty">
                  <h3>Aucun entretien dans cette colonne</h3>
                  <p>Les rendez-vous lies aux candidatures apparaitront ici automatiquement.</p>
                </article>
              )}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
