"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";

import { formatDisplayDate } from "@/lib/format";
import type { ManagedCandidateSummary } from "@/lib/types";

type ManagedCandidatesBoardProps = {
  candidates: ManagedCandidateSummary[];
  basePath: "/app/recruteur/candidats" | "/app/admin/candidats";
};

type Filters = {
  query: string;
  city: string;
  withCvOnly: boolean;
};

const initialFilters: Filters = {
  query: "",
  city: "",
  withCvOnly: false
};

function getCities(candidates: ManagedCandidateSummary[]) {
  return Array.from(
    new Set(candidates.map((candidate) => candidate.city).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b, "fr"));
}

export function ManagedCandidatesBoard({
  candidates,
  basePath
}: ManagedCandidatesBoardProps) {
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const deferredQuery = useDeferredValue(filters.query);

  const cityOptions = useMemo(() => getCities(candidates), [candidates]);

  const filteredCandidates = useMemo(() => {
    const query = deferredQuery.trim().toLowerCase();

    return candidates.filter((candidate) => {
      const matchesQuery =
        !query ||
        [
          candidate.full_name,
          candidate.email,
          candidate.headline,
          candidate.current_position,
          candidate.desired_position,
          candidate.latest_job_title
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));

      const matchesCity = !filters.city || candidate.city === filters.city;
      const matchesCv = !filters.withCvOnly || candidate.has_primary_cv;

      return matchesQuery && matchesCity && matchesCv;
    });
  }, [candidates, deferredQuery, filters.city, filters.withCvOnly]);

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
          filteredCandidates.map((candidate) => (
            <article key={candidate.id} className="panel job-card jobs-result-card">
              <div className="jobs-result-card__head">
                <span className="tag">{candidate.latest_status || "Profil"}</span>
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

              <div className="job-card__footer">
                <small>{candidate.latest_job_title || "Aucune offre recente"}</small>
                <Link href={`${basePath}/${candidate.id}`}>Ouvrir le profil</Link>
              </div>
            </article>
          ))
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
