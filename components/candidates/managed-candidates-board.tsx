"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";

import { formatDisplayDate } from "@/lib/format";
import {
  getBestJobMatchForCandidate,
  type MatchableJob
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
  withCvOnly: boolean;
  matchLevel: "" | "strong" | "good";
  sort: "recent" | "match";
};

const initialFilters: Filters = {
  query: "",
  city: "",
  withCvOnly: false,
  matchLevel: "",
  sort: "recent"
};

function getCities(candidates: ManagedCandidateSummary[]) {
  return Array.from(
    new Set(candidates.map((candidate) => candidate.city).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b, "fr"));
}

export function ManagedCandidatesBoard({
  candidates,
  jobs,
  basePath
}: ManagedCandidatesBoardProps) {
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const deferredQuery = useDeferredValue(filters.query);

  const cityOptions = useMemo(() => getCities(candidates), [candidates]);
  const bestMatchByCandidateId = useMemo(
    () =>
      new Map(
        candidates.map((candidate) => [
          candidate.id,
          getBestJobMatchForCandidate(
            {
              headline: candidate.headline,
              city: candidate.city,
              current_position: candidate.current_position,
              desired_position: candidate.desired_position,
              profile_completion: candidate.profile_completion
            },
            jobs
          )
        ])
      ),
    [candidates, jobs]
  );

  const filteredCandidates = useMemo(() => {
    const query = deferredQuery.trim().toLowerCase();

    return candidates
      .filter((candidate) => {
        const bestMatch = bestMatchByCandidateId.get(candidate.id) ?? null;
        const matchesQuery =
          !query ||
          [
            candidate.full_name,
            candidate.email,
            candidate.headline,
            candidate.current_position,
            candidate.desired_position,
            candidate.latest_job_title,
            bestMatch?.job.title ?? ""
          ]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(query));

        const matchesCity = !filters.city || candidate.city === filters.city;
        const matchesCv = !filters.withCvOnly || candidate.has_primary_cv;
        const matchesLevel =
          !filters.matchLevel ||
          (filters.matchLevel === "strong" &&
            Boolean(bestMatch?.match.hasSignal && bestMatch.match.score >= 78)) ||
          (filters.matchLevel === "good" &&
            Boolean(bestMatch?.match.hasSignal && bestMatch.match.score >= 60));

        return matchesQuery && matchesCity && matchesCv && matchesLevel;
      })
      .sort((left, right) => {
        if (filters.sort === "match") {
          const leftScore = bestMatchByCandidateId.get(left.id)?.match.score ?? 0;
          const rightScore = bestMatchByCandidateId.get(right.id)?.match.score ?? 0;

          if (leftScore !== rightScore) {
            return rightScore - leftScore;
          }
        }

        const leftDate = left.latest_application_at
          ? new Date(left.latest_application_at).getTime()
          : 0;
        const rightDate = right.latest_application_at
          ? new Date(right.latest_application_at).getTime()
          : 0;

        return rightDate - leftDate;
      });
  }, [
    bestMatchByCandidateId,
    candidates,
    deferredQuery,
    filters.city,
    filters.matchLevel,
    filters.sort,
    filters.withCvOnly
  ]);

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
              placeholder="Nom, email, headline, poste recherche..."
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
            <span>Compatibilite</span>
            <select
              value={filters.matchLevel}
              onChange={(event) =>
                setFilters((previous) => ({
                  ...previous,
                  matchLevel: event.target.value as Filters["matchLevel"]
                }))
              }
            >
              <option value="">Tous les niveaux</option>
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
              <option value="recent">Activite recente</option>
              <option value="match">Meilleur match</option>
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
      </section>

      <section className="jobs-results">
        {filteredCandidates.length > 0 ? (
          filteredCandidates.map((candidate) => {
            const bestMatch = bestMatchByCandidateId.get(candidate.id) ?? null;

            return (
              <article key={candidate.id} className="panel job-card jobs-result-card">
                <div className="jobs-result-card__head">
                  <div className="jobs-result-card__badges">
                    <span className="tag">{candidate.latest_status || "Profil"}</span>
                    {bestMatch && bestMatch.match.score >= 40 ? (
                      <span className={`tag tag--${bestMatch.match.tone}`}>{bestMatch.match.label}</span>
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

                {bestMatch && bestMatch.match.score >= 40 ? (
                  <p className="match-caption">
                    {bestMatch.match.reason} Offre cible: {bestMatch.job.title}.
                  </p>
                ) : null}

                <div className="job-card__footer">
                  <small>{bestMatch?.job.title || candidate.latest_job_title || "Aucune offre recente"}</small>
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
