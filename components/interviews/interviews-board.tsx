"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";

import { getApplicationStatusMeta } from "@/lib/application-status";
import { formatDateTimeDisplay } from "@/lib/format";
import {
  getInterviewFormatLabel,
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
  sort: "soonest" | "recent" | "candidate";
};

const initialFilters: Filters = {
  query: "",
  status: "",
  format: "",
  jobId: "",
  sort: "soonest"
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
            interview.location ?? ""
          ]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(query));

        const matchesStatus = !filters.status || interview.status === filters.status;
        const matchesFormat = !filters.format || interview.format === filters.format;
        const matchesJob = !filters.jobId || interview.job_id === filters.jobId;

        return matchesQuery && matchesStatus && matchesFormat && matchesJob;
      })
      .sort((left, right) => {
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

        return leftTime - rightTime;
      });
  }, [deferredQuery, filters.format, filters.jobId, filters.sort, filters.status, interviews]);

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
              <option value="soonest">Plus proches</option>
              <option value="recent">Plus recents</option>
              <option value="candidate">Nom candidat</option>
            </select>
          </label>
        </div>
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

                      <div className="notification-card__actions">
                        <Link href={`${applicationsBasePath}/${interview.application_id}`}>Ouvrir le dossier</Link>
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
