"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";

import { DashboardEmptyState } from "@/components/dashboard/empty-state";
import { CandidateSaveJobButton } from "@/components/jobs/candidate-save-job-button";
import { MatchBreakdown } from "@/components/jobs/match-breakdown";
import {
  getApplicationStatusMeta,
  isFinalApplicationStatus
} from "@/lib/application-status";
import type {
  CandidateJobOpportunity
} from "@/lib/candidate-job-insights";
import { formatDateTimeDisplay, formatDisplayDate } from "@/lib/format";

type CandidateJobsBoardProps = {
  opportunities: CandidateJobOpportunity[];
};

type Filters = {
  query: string;
  location: string;
  contractType: string;
  workMode: string;
  sector: string;
  applicationState: "" | "available" | "applied" | "active_applied";
  focus: "" | "strong_match" | "ready_to_apply" | "saved" | "featured" | "upcoming_interview";
  featuredOnly: boolean;
  sort: "priority_desc" | "recent" | "match" | "featured" | "oldest";
};

const initialFilters: Filters = {
  query: "",
  location: "",
  contractType: "",
  workMode: "",
  sector: "",
  applicationState: "",
  focus: "",
  featuredOnly: false,
  sort: "priority_desc"
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

function getOpportunitySortDate(opportunity: CandidateJobOpportunity) {
  return opportunity.job.published_at || opportunity.application?.updated_at || "";
}

export function CandidateJobsBoard({ opportunities }: CandidateJobsBoardProps) {
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const deferredQuery = useDeferredValue(filters.query);

  const options = useMemo(
    () => ({
      locations: getUniqueValues(opportunities.map((entry) => entry.job.location)),
      contractTypes: getUniqueValues(opportunities.map((entry) => entry.job.contract_type)),
      workModes: getUniqueValues(opportunities.map((entry) => entry.job.work_mode)),
      sectors: getUniqueValues(opportunities.map((entry) => entry.job.sector))
    }),
    [opportunities]
  );

  const filteredOpportunities = useMemo(() => {
    const query = deferredQuery.trim().toLowerCase();

    const matchingOpportunities = opportunities.filter((entry) => {
      const { job, application, match } = entry;
      const matchesQuery =
        !query ||
        [
          job.title,
          job.summary,
          job.location,
          job.contract_type,
          job.work_mode,
          job.sector,
          match.reason,
          match.matchedKeywords.join(" "),
          match.breakdown.map((item) => item.value).join(" "),
          match.nextStep
        ]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(query));

      const matchesLocation = !filters.location || job.location === filters.location;
      const matchesContract = !filters.contractType || job.contract_type === filters.contractType;
      const matchesWorkMode = !filters.workMode || job.work_mode === filters.workMode;
      const matchesSector = !filters.sector || job.sector === filters.sector;
      const matchesApplicationState =
        !filters.applicationState ||
        (filters.applicationState === "available" && entry.isAvailable) ||
        (filters.applicationState === "applied" && application !== null) ||
        (filters.applicationState === "active_applied" && entry.isActiveApplied);
      const matchesFocus =
        !filters.focus ||
        (filters.focus === "strong_match" && entry.isAvailable && match.hasSignal && match.score >= 78) ||
        (filters.focus === "ready_to_apply" && entry.isReadyToApply) ||
        (filters.focus === "saved" && entry.isSaved) ||
        (filters.focus === "featured" && job.is_featured) ||
        (filters.focus === "upcoming_interview" && entry.hasUpcomingInterview);
      const matchesFeatured = !filters.featuredOnly || job.is_featured;

      return (
        matchesQuery &&
        matchesLocation &&
        matchesContract &&
        matchesWorkMode &&
        matchesSector &&
        matchesApplicationState &&
        matchesFocus &&
        matchesFeatured
      );
    });

    return matchingOpportunities.sort((left, right) => {
      const leftDate = new Date(getOpportunitySortDate(left)).getTime();
      const rightDate = new Date(getOpportunitySortDate(right)).getTime();

      if (filters.sort === "priority_desc") {
        if (left.priorityScore !== right.priorityScore) {
          return right.priorityScore - left.priorityScore;
        }
      }

      if (filters.sort === "match") {
        if (left.match.score !== right.match.score) {
          return right.match.score - left.match.score;
        }
      }

      if (filters.sort === "featured") {
        if (left.job.is_featured !== right.job.is_featured) {
          return left.job.is_featured ? -1 : 1;
        }
      }

      if (filters.sort === "oldest") {
        return leftDate - rightDate;
      }

      return rightDate - leftDate;
    });
  }, [
    deferredQuery,
    filters.applicationState,
    filters.contractType,
    filters.featuredOnly,
    filters.focus,
    filters.location,
    filters.sector,
    filters.sort,
    filters.workMode,
    opportunities
  ]);

  const signalStats = useMemo(() => {
    let available = 0;
    let strongMatch = 0;
    let saved = 0;
    let activeApplied = 0;
    let upcomingInterview = 0;

    for (const entry of filteredOpportunities) {
      if (entry.isAvailable) {
        available += 1;
      }

      if (entry.isAvailable && entry.match.hasSignal && entry.match.score >= 78) {
        strongMatch += 1;
      }

      if (entry.isSaved) {
        saved += 1;
      }

      if (entry.isActiveApplied) {
        activeApplied += 1;
      }

      if (entry.hasUpcomingInterview) {
        upcomingInterview += 1;
      }
    }

    return {
      available,
      strongMatch,
      saved,
      activeApplied,
      upcomingInterview
    };
  }, [filteredOpportunities]);

  const activeFilterCount = [
    filters.query,
    filters.location,
    filters.contractType,
    filters.workMode,
    filters.sector,
    filters.applicationState,
    filters.focus,
    filters.featuredOnly ? "featured" : "",
    filters.sort !== "priority_desc" ? filters.sort : ""
  ].filter(Boolean).length;

  return (
    <div className="jobs-board">
      <section className="panel dashboard-form">
        <div className="dashboard-form__head">
          <div>
            <p className="eyebrow">Recherche avancee</p>
            <h2>Priorisez les vraies opportunites et les dossiers deja en mouvement</h2>
          </div>
          <span className="tag">{filteredOpportunities.length} offre(s)</span>
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
            <span>Focus</span>
            <select
              value={filters.focus}
              onChange={(event) =>
                setFilters((previous) => ({
                  ...previous,
                  focus: event.target.value as Filters["focus"]
                }))
              }
            >
              <option value="">Vue globale</option>
              <option value="strong_match">Forts matchs disponibles</option>
              <option value="ready_to_apply">Pretes a candidater</option>
              <option value="saved">Offres sauvegardees</option>
              <option value="featured">Mises en avant</option>
              <option value="upcoming_interview">Avec entretien a venir</option>
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
              <option value="priority_desc">Priorite</option>
              <option value="recent">Plus recentes</option>
              <option value="match">Meilleur match</option>
              <option value="featured">Mises en avant d'abord</option>
              <option value="oldest">Plus anciennes</option>
            </select>
          </label>
        </div>

        <div className="interviews-board__stats">
          <article className="document-card">
            <strong>{signalStats.available}</strong>
            <p>offre(s) encore disponibles</p>
          </article>
          <article className="document-card">
            <strong>{signalStats.strongMatch}</strong>
            <p>fort(s) match(s) non postules</p>
          </article>
          <article className="document-card">
            <strong>{signalStats.activeApplied}</strong>
            <p>dossier(s) deja en mouvement</p>
          </article>
          <article className="document-card">
            <strong>{signalStats.saved}</strong>
            <p>offre(s) sauvegardee(s)</p>
          </article>
          <article className="document-card">
            <strong>{signalStats.upcomingInterview}</strong>
            <p>offre(s) avec entretien a venir</p>
          </article>
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

          <span className="jobs-board__hint">
            {activeFilterCount > 0
              ? `${activeFilterCount} filtre(s) actif(s).`
              : "Les offres les plus pertinentes et les dossiers deja avances remontent automatiquement en tete."}
          </span>

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
        {filteredOpportunities.length > 0 ? (
          filteredOpportunities.map((entry) => {
            const { job, application, match } = entry;
            const applicationStatus = application
              ? getApplicationStatusMeta(application.status)
              : null;
            const shouldHighlightMatch =
              entry.isAvailable && match.hasSignal && match.score >= 40;

            return (
              <article key={job.id} className="panel job-card jobs-result-card">
                <div className="jobs-result-card__head">
                  <div className="jobs-result-card__badges">
                    <span
                      className={`tag ${
                        applicationStatus
                          ? ""
                          : shouldHighlightMatch
                            ? `tag--${match.tone}`
                            : job.is_featured
                              ? "tag--info"
                              : ""
                      }`.trim()}
                    >
                      {applicationStatus
                        ? applicationStatus.label
                        : shouldHighlightMatch
                          ? match.label
                          : job.is_featured
                            ? "Mise en avant"
                            : "Disponible"}
                    </span>
                    {job.is_featured && !applicationStatus ? (
                      <span className="tag tag--info">Visible en priorite</span>
                    ) : null}
                    {entry.isSaved ? (
                      <span className="tag tag--success">Sauvegardee</span>
                    ) : null}
                    {application?.interview_signal.next_interview_at ? (
                      <span className="tag tag--info">Entretien a venir</span>
                    ) : null}
                  </div>
                  <small>Publie le {formatDisplayDate(job.published_at)}</small>
                </div>

                <h2>{job.title}</h2>
                <p>
                  {applicationStatus
                    ? applicationStatus.description
                    : shouldHighlightMatch
                      ? match.reason
                      : job.summary}
                </p>

                <div className="job-card__meta">
                  <span>{job.location}</span>
                  <span>{job.contract_type}</span>
                  <span>{job.work_mode}</span>
                  <span>{job.sector}</span>
                  {shouldHighlightMatch && match.matchedKeywords.length > 0 ? (
                    <span>{match.matchedKeywords.join(", ")}</span>
                  ) : null}
                </div>

                <div className="application-signal-card">
                  <strong>
                    {application
                      ? application.interview_signal.next_interview_at
                        ? "Dossier deja en mouvement"
                        : isFinalApplicationStatus(application.status)
                          ? "Dossier deja finalise"
                          : "Dossier actif"
                      : entry.isReadyToApply
                        ? "Bonne opportunite a candidater"
                        : match.hasSignal
                          ? "Potentiel a examiner"
                          : "Matching a completer"}
                  </strong>
                  <p>
                    {application?.interview_signal.next_interview_at
                      ? `Prochain entretien le ${formatDateTimeDisplay(application.interview_signal.next_interview_at)}.`
                      : application
                        ? `Candidature envoyee le ${formatDisplayDate(application.created_at)}.`
                        : match.reason}
                  </p>
                  {!application && match.hasSignal ? (
                    <MatchBreakdown match={match} compact />
                  ) : null}
                  <small>
                    {application
                      ? applicationStatus?.candidateHint
                      : match.hasSignal
                        ? match.nextStep
                        : "Completez votre profil pour ameliorer le matching."}
                  </small>
                </div>

                <div className="job-card__footer">
                  <small>
                    {application
                      ? application.interview_signal.next_interview_at
                        ? "Le dossier est deja actif dans votre suivi candidat."
                        : "Vous pouvez suivre ce dossier directement depuis votre espace candidat."
                      : entry.isSaved
                        ? "Offre sauvegardee pour une decision plus tard."
                        : job.organization_name || "Madajob"}
                  </small>
                  <div className="notification-card__actions">
                    <CandidateSaveJobButton
                      jobId={job.id}
                      initialSaved={entry.isSaved}
                      compact
                    />
                    {application ? (
                      <Link href={`/app/candidat/candidatures/${application.id}`}>
                        Suivre ma candidature
                      </Link>
                    ) : (
                      <Link href={`/app/candidat/offres/${job.slug}`}>Voir l'offre</Link>
                    )}
                    {application && !isFinalApplicationStatus(application.status) ? (
                      <Link href={`/app/candidat/offres/${job.slug}`}>Relire l'offre</Link>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })
        ) : (
          <DashboardEmptyState
            title="Aucune offre ne correspond a ces filtres"
            description="Relancez une recherche plus large ou revenez a vos candidatures actives pour garder le rythme."
            actions={
              <>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setFilters(initialFilters)}
                >
                  Reinitialiser les filtres
                </button>
                <Link className="btn btn-ghost" href="/app/candidat/candidatures">
                  Ouvrir mes candidatures
                </Link>
              </>
            }
          />
        )}
      </section>
    </div>
  );
}
