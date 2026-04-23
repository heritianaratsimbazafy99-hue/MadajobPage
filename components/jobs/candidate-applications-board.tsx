"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";

import {
  getApplicationStatusMeta,
  isFinalApplicationStatus
} from "@/lib/application-status";
import { formatDateTimeDisplay, formatDisplayDate } from "@/lib/format";
import { getInterviewFormatLabel, getInterviewStatusMeta } from "@/lib/interviews";
import type { CandidateApplicationSummary } from "@/lib/types";

type CandidateApplicationsBoardProps = {
  applications: CandidateApplicationSummary[];
};

type Filters = {
  query: string;
  status: string;
  signalFocus: "" | "upcoming_interview" | "with_interviews" | "advanced" | "final";
  withCvOnly: boolean;
  activeOnly: boolean;
  sort: "priority_desc" | "recent" | "oldest";
};

const initialFilters: Filters = {
  query: "",
  status: "",
  signalFocus: "",
  withCvOnly: false,
  activeOnly: false,
  sort: "priority_desc"
};

function getUniqueStatuses(applications: CandidateApplicationSummary[]) {
  return Array.from(new Set(applications.map((application) => application.status))).sort((a, b) =>
    a.localeCompare(b, "fr")
  );
}

function getApplicationSortDate(application: CandidateApplicationSummary) {
  return application.updated_at || application.created_at;
}

function hasUpcomingInterview(application: CandidateApplicationSummary) {
  return Boolean(application.interview_signal.next_interview_at);
}

function hasInterviewHistory(application: CandidateApplicationSummary) {
  return application.interview_signal.interviews_count > 0;
}

function isAdvancedStatus(status: string) {
  return status === "shortlist" || status === "interview";
}

function getCandidateApplicationPriorityScore(application: CandidateApplicationSummary) {
  let score = 0;

  if (application.interview_signal.next_interview_at) {
    score += 260;

    const daysUntilInterview =
      (new Date(application.interview_signal.next_interview_at).getTime() - Date.now()) / 86_400_000;

    if (daysUntilInterview <= 1) {
      score += 80;
    } else if (daysUntilInterview <= 3) {
      score += 40;
    }
  }

  if (application.status === "interview") {
    score += 180;
  }

  if (application.status === "shortlist") {
    score += 120;
  }

  if (application.status === "screening") {
    score += 80;
  }

  if (application.interview_signal.interviews_count > 0) {
    score += 60;
  }

  if (application.has_cv) {
    score += 20;
  }

  if (isFinalApplicationStatus(application.status)) {
    score -= 100;
  }

  return score;
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
      const matchesSignalFocus =
        !filters.signalFocus ||
        (filters.signalFocus === "upcoming_interview" && hasUpcomingInterview(application)) ||
        (filters.signalFocus === "with_interviews" && hasInterviewHistory(application)) ||
        (filters.signalFocus === "advanced" && isAdvancedStatus(application.status)) ||
        (filters.signalFocus === "final" && isFinalApplicationStatus(application.status));

      return matchesQuery && matchesStatus && matchesCv && matchesActive && matchesSignalFocus;
    });

    return matchingApplications.sort((left, right) => {
      if (filters.sort === "priority_desc") {
        const leftScore = getCandidateApplicationPriorityScore(left);
        const rightScore = getCandidateApplicationPriorityScore(right);

        if (leftScore !== rightScore) {
          return rightScore - leftScore;
        }
      }

      const leftDate = new Date(getApplicationSortDate(left)).getTime();
      const rightDate = new Date(getApplicationSortDate(right)).getTime();

      return filters.sort === "oldest" ? leftDate - rightDate : rightDate - leftDate;
    });
  }, [
    applications,
    deferredQuery,
    filters.activeOnly,
    filters.signalFocus,
    filters.sort,
    filters.status,
    filters.withCvOnly
  ]);

  const signalStats = useMemo(() => {
    let active = 0;
    let withInterviews = 0;
    let upcoming = 0;
    let final = 0;

    for (const application of filteredApplications) {
      if (isFinalApplicationStatus(application.status)) {
        final += 1;
      } else {
        active += 1;
      }

      if (application.interview_signal.interviews_count > 0) {
        withInterviews += 1;
      }

      if (application.interview_signal.next_interview_at) {
        upcoming += 1;
      }
    }

    return {
      active,
      withInterviews,
      upcoming,
      final
    };
  }, [filteredApplications]);

  const activeFilterCount = [
    filters.query,
    filters.status,
    filters.signalFocus,
    filters.withCvOnly ? "cv" : "",
    filters.activeOnly ? "active" : "",
    filters.sort !== "priority_desc" ? filters.sort : ""
  ].filter(Boolean).length;

  return (
    <div className="jobs-board">
      <section className="dashboard-form">
        <div className="dashboard-form__head">
          <div>
            <p className="eyebrow">Suivi detaille</p>
            <h2>Priorisez vos dossiers avec les entretiens et les etapes les plus importantes</h2>
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
              <option value="upcoming_interview">Entretien a venir</option>
              <option value="with_interviews">Avec historique entretien</option>
              <option value="advanced">Dossiers avances</option>
              <option value="final">Dossiers finalises</option>
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
              <option value="priority_desc">Priorite du moment</option>
              <option value="recent">Plus recentes</option>
              <option value="oldest">Plus anciennes</option>
            </select>
          </label>
        </div>

        <div className="interviews-board__stats">
          <article className="document-card">
            <strong>{signalStats.active}</strong>
            <p>dossier(s) encore actif(s)</p>
          </article>
          <article className="document-card">
            <strong>{signalStats.withInterviews}</strong>
            <p>avec au moins un entretien</p>
          </article>
          <article className="document-card">
            <strong>{signalStats.upcoming}</strong>
            <p>entretien(s) a venir</p>
          </article>
          <article className="document-card">
            <strong>{signalStats.final}</strong>
            <p>dossier(s) finalise(s)</p>
          </article>
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

        <p className="jobs-board__hint">
          {activeFilterCount > 0
            ? `${activeFilterCount} filtre(s) actif(s) pour concentrer vos dossiers prioritaires.`
            : "Les candidatures avec entretien a venir et les dossiers encore actifs remontent en priorite."}
        </p>
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
            const latestInterviewStatus = application.interview_signal.latest_interview_status
              ? getInterviewStatusMeta(application.interview_signal.latest_interview_status)
              : null;

            return (
              <article key={application.id} className="panel job-card jobs-result-card">
                <div className="jobs-result-card__head">
                  <div className="dashboard-card__badges">
                    <span className="tag">{status.label}</span>
                    {application.interview_signal.next_interview_format ? (
                      <span className="tag tag--info">
                        {getInterviewFormatLabel(application.interview_signal.next_interview_format)}
                      </span>
                    ) : null}
                  </div>
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

                <div className="application-signal-card">
                  <div className="document-meta">
                    <span>{application.interview_signal.interviews_count} entretien(s)</span>
                    {latestInterviewStatus ? (
                      <span>{latestInterviewStatus.label}</span>
                    ) : (
                      <span>Aucun entretien</span>
                    )}
                    {application.interview_signal.next_interview_at ? (
                      <span>
                        Prochain le {formatDateTimeDisplay(application.interview_signal.next_interview_at)}
                      </span>
                    ) : null}
                  </div>

                  {application.interview_signal.next_interview_at ? (
                    <>
                      <p>
                        Votre prochain entretien est deja planifie. Ouvrez le dossier pour revoir
                        les informations utiles et vous preparer.
                      </p>
                      <small>
                        {application.interview_signal.next_interview_location ||
                          application.interview_signal.next_interview_timezone ||
                          "Les details logistiques restent disponibles dans le suivi complet."}
                      </small>
                    </>
                  ) : application.interview_signal.interviews_count > 0 ? (
                    <>
                      <p>
                        Ce dossier a deja un historique d'entretien. Vous pouvez revisiter le suivi
                        complet pour voir les rendez-vous passes.
                      </p>
                      <small>{status.candidateHint}</small>
                    </>
                  ) : (
                    <>
                      <p>Aucun entretien n'est encore planifie sur ce dossier pour le moment.</p>
                      <small>{status.candidateHint}</small>
                    </>
                  )}
                </div>

                <div className="job-card__footer">
                  <small>
                    {application.cover_letter
                      ? "Message de candidature present"
                      : hasUpcomingInterview(application)
                        ? "Gardez un oeil sur votre dossier pour preparer le prochain echange."
                        : status.candidateHint}
                  </small>
                  <div className="notification-card__actions">
                    <Link href={`/app/candidat/candidatures/${application.id}`}>
                      Ouvrir le dossier
                    </Link>
                    <Link href={`/app/candidat/offres/${application.job_slug}`}>
                      Revoir l'offre
                    </Link>
                    {application.interview_signal.next_interview_meeting_url ? (
                      <Link
                        href={application.interview_signal.next_interview_meeting_url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Rejoindre l'entretien
                      </Link>
                    ) : null}
                  </div>
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
