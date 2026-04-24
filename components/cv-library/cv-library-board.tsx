"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";

import { DashboardEmptyState } from "@/components/dashboard/empty-state";
import { MatchBreakdown } from "@/components/jobs/match-breakdown";
import {
  buildCvLibraryMatchingProfile,
  inferCvLibraryCandidateName
} from "@/lib/cv-library-insights";
import { formatDisplayDate, formatFileSize } from "@/lib/format";
import { getCandidateJobMatch, type MatchableJob } from "@/lib/matching";
import type { CvLibraryDocument } from "@/lib/types";

type CvLibraryBoardProps = {
  documents: CvLibraryDocument[];
  jobs: MatchableJob[];
  role: "recruteur" | "admin";
};

type Filters = {
  query: string;
  parsingStatus: string;
  tag: string;
  selectedJobId: string;
  parsedOnly: boolean;
  sort: "recent" | "match" | "name";
};

const initialFilters: Filters = {
  query: "",
  parsingStatus: "",
  tag: "",
  selectedJobId: "",
  parsedOnly: false,
  sort: "recent"
};

function getUniqueValues(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b, "fr")
  );
}

function getParsingTone(status: string) {
  if (status === "parsed") {
    return "success";
  }

  if (status === "unsupported") {
    return "warning";
  }

  if (status === "failed") {
    return "danger";
  }

  return "muted";
}

function getParsingLabel(status: string) {
  if (status === "parsed") {
    return "Parse";
  }

  if (status === "empty") {
    return "Texte vide";
  }

  if (status === "unsupported") {
    return "Parsing avance requis";
  }

  if (status === "failed") {
    return "Echec parsing";
  }

  return "En attente";
}

function getParsedExcerpt(text: string) {
  const cleanText = text.replace(/\s+/g, " ").trim();
  return cleanText.length > 260 ? `${cleanText.slice(0, 260)}...` : cleanText;
}

export function CvLibraryBoard({ documents, jobs, role }: CvLibraryBoardProps) {
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const deferredQuery = useDeferredValue(filters.query);
  const offersBasePath = role === "admin" ? "/app/admin/offres" : "/app/recruteur/offres";

  const selectedJob = useMemo(
    () => jobs.find((job) => job.id === filters.selectedJobId) ?? null,
    [filters.selectedJobId, jobs]
  );
  const tagOptions = useMemo(
    () => getUniqueValues(documents.flatMap((document) => document.tags)),
    [documents]
  );

  const rows = useMemo(() => {
    const query = deferredQuery.trim().toLowerCase();

    return documents
      .map((document) => {
        const match = selectedJob
          ? getCandidateJobMatch(buildCvLibraryMatchingProfile(document), selectedJob)
          : null;

        return {
          document,
          match
        };
      })
      .filter(({ document, match }) => {
        const displayName = document.candidate_name || inferCvLibraryCandidateName(document.file_name);
        const matchesQuery =
          !query ||
          [
            displayName,
            document.file_name,
            document.source_label ?? "",
            document.candidate_email ?? "",
            document.candidate_phone ?? "",
            document.parsed_text,
            document.tags.join(" "),
            match?.reason ?? "",
            match?.matchedKeywords.join(" ") ?? ""
          ]
            .filter(Boolean)
            .some((value) => value.toLowerCase().includes(query));
        const matchesStatus =
          !filters.parsingStatus || document.parsing_status === filters.parsingStatus;
        const matchesTag = !filters.tag || document.tags.includes(filters.tag);
        const matchesParsedOnly = !filters.parsedOnly || document.parsing_status === "parsed";

        return matchesQuery && matchesStatus && matchesTag && matchesParsedOnly;
      })
      .sort((left, right) => {
        if (filters.sort === "match" && selectedJob) {
          const leftScore = left.match?.score ?? 0;
          const rightScore = right.match?.score ?? 0;

          if (leftScore !== rightScore) {
            return rightScore - leftScore;
          }
        }

        if (filters.sort === "name") {
          const leftName = left.document.candidate_name || left.document.file_name;
          const rightName = right.document.candidate_name || right.document.file_name;
          return leftName.localeCompare(rightName, "fr");
        }

        return (
          new Date(right.document.created_at).getTime() -
          new Date(left.document.created_at).getTime()
        );
      });
  }, [
    deferredQuery,
    documents,
    filters.parsedOnly,
    filters.parsingStatus,
    filters.sort,
    filters.tag,
    selectedJob
  ]);

  const activeFilterCount = [
    filters.query,
    filters.parsingStatus,
    filters.tag,
    filters.selectedJobId,
    filters.parsedOnly ? "parsed_only" : "",
    filters.sort !== "recent" ? filters.sort : ""
  ].filter(Boolean).length;

  return (
    <div className="jobs-board cv-library-board">
      <section className="panel dashboard-form">
        <div className="dashboard-form__head">
          <div>
            <p className="eyebrow">Recherche CVtheque</p>
            <h2>Filtrer, lire et matcher les CV importes</h2>
          </div>
          <span className="tag">{rows.length} CV</span>
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
              placeholder="Nom, fichier, source, texte extrait, mot cle..."
            />
          </label>

          <label className="field">
            <span>Offre a matcher</span>
            <select
              value={filters.selectedJobId}
              onChange={(event) =>
                setFilters((previous) => ({
                  ...previous,
                  selectedJobId: event.target.value,
                  sort: event.target.value ? "match" : "recent"
                }))
              }
            >
              <option value="">Choisir une offre</option>
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.title}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Parsing</span>
            <select
              value={filters.parsingStatus}
              onChange={(event) =>
                setFilters((previous) => ({
                  ...previous,
                  parsingStatus: event.target.value
                }))
              }
            >
              <option value="">Tous les statuts</option>
              <option value="parsed">Parses</option>
              <option value="empty">Texte vide</option>
              <option value="unsupported">Parsing avance requis</option>
              <option value="failed">Echec parsing</option>
            </select>
          </label>

          <label className="field">
            <span>Tag</span>
            <select
              value={filters.tag}
              onChange={(event) =>
                setFilters((previous) => ({
                  ...previous,
                  tag: event.target.value
                }))
              }
            >
              <option value="">Tous les tags</option>
              {tagOptions.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
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
              <option value="recent">Plus recents</option>
              <option value="match" disabled={!selectedJob}>
                Meilleur match
              </option>
              <option value="name">Nom / fichier</option>
            </select>
          </label>
        </div>

        <div className="jobs-board__actions">
          <label className="checkbox-field">
            <input
              type="checkbox"
              checked={filters.parsedOnly}
              onChange={(event) =>
                setFilters((previous) => ({
                  ...previous,
                  parsedOnly: event.target.checked
                }))
              }
            />
            <span>Afficher uniquement les CV avec texte exploitable</span>
          </label>

          <span className="jobs-board__hint">
            {selectedJob
              ? `Matching actif sur : ${selectedJob.title}.`
              : "Choisissez une offre pour scorer les CV importes."}
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
        {rows.length > 0 ? (
          rows.map(({ document, match }) => {
            const displayName = document.candidate_name || inferCvLibraryCandidateName(document.file_name);
            const excerpt = getParsedExcerpt(document.parsed_text);

            return (
              <article key={document.id} className="panel job-card jobs-result-card cv-library-card">
                <div className="jobs-result-card__head">
                  <div className="jobs-result-card__badges">
                    <span className={`tag tag--${getParsingTone(document.parsing_status)}`}>
                      {getParsingLabel(document.parsing_status)}
                    </span>
                    {match ? (
                      <span className={`tag tag--${match.tone}`}>Match {match.score}%</span>
                    ) : null}
                    {document.tags.map((tag) => (
                      <span key={tag} className="tag tag--muted">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <small>Importe le {formatDisplayDate(document.created_at)}</small>
                </div>

                <h2>{displayName || document.file_name}</h2>
                <p>
                  {excerpt ||
                    document.parsing_error ||
                    "CV stocke. Le parsing avance ou IA pourra enrichir ce profil plus tard."}
                </p>

                <div className="job-card__meta">
                  <span>{document.file_name}</span>
                  {document.file_size ? <span>{formatFileSize(document.file_size)}</span> : null}
                  {document.source_label ? <span>{document.source_label}</span> : null}
                  {document.candidate_email ? <span>{document.candidate_email}</span> : null}
                </div>

                {match ? (
                  <div className="application-signal-card">
                    <strong>{match.label}</strong>
                    <p>{match.reason}</p>
                    <MatchBreakdown match={match} compact showNextStep />
                  </div>
                ) : null}

                <div className="job-card__footer">
                  <small>
                    {document.parsing_status === "parsed"
                      ? "Texte disponible pour matching natif et futur enrichissement IA."
                      : "Document conserve pour retraitement ulterieur."}
                  </small>
                  <div className="notification-card__actions">
                    {document.download_url ? (
                      <a href={document.download_url} target="_blank" rel="noreferrer">
                        Ouvrir le CV
                      </a>
                    ) : null}
                    {selectedJob ? (
                      <Link href={`${offersBasePath}/${selectedJob.id}`}>
                        Ouvrir l'offre
                      </Link>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })
        ) : (
          <DashboardEmptyState
            title={documents.length > 0 ? "Aucun CV ne correspond a ces filtres" : "CVtheque vide"}
            description={
              documents.length > 0
                ? "Elargissez la recherche ou importez un nouveau lot pour alimenter la CVtheque."
                : "Importez un premier lot de PDF, TXT, DOC ou DOCX pour commencer le matching hors comptes candidats."
            }
            actions={
              activeFilterCount > 0 ? (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setFilters(initialFilters)}
                >
                  Reinitialiser les filtres
                </button>
              ) : null
            }
          />
        )}
      </section>
    </div>
  );
}
