"use client";

import Link from "next/link";
import { useDeferredValue, useEffect, useMemo, useState, useTransition } from "react";

import { quickUpdateJobStatusAction } from "@/app/actions/job-actions";
import { formatDisplayDate } from "@/lib/format";
import type { ManagedJob } from "@/lib/types";

type ManagedJobsBoardProps = {
  jobs: ManagedJob[];
  basePath: "/app/recruteur/offres" | "/app/admin/offres";
};

type ManagedFilters = {
  query: string;
  status: string;
  location: string;
  organizationId: string;
  moderation: "" | "to_publish" | "live_without_candidates" | "active" | "closed_or_archived";
  sort: "recent" | "oldest" | "applications_desc";
};

const initialFilters: ManagedFilters = {
  query: "",
  status: "",
  location: "",
  organizationId: "",
  moderation: "",
  sort: "recent"
};

function getUniqueValues(values: string[]) {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b, "fr"));
}

export function ManagedJobsBoard({ jobs, basePath }: ManagedJobsBoardProps) {
  const [filters, setFilters] = useState<ManagedFilters>(initialFilters);
  const [boardJobs, setBoardJobs] = useState(jobs);
  const [feedback, setFeedback] = useState<{ kind: "success" | "error"; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const deferredQuery = useDeferredValue(filters.query);
  const isAdminView = basePath === "/app/admin/offres";

  useEffect(() => {
    setBoardJobs(jobs);
    setFeedback(null);
  }, [jobs]);

  const filterOptions = useMemo(
    () => ({
      statuses: getUniqueValues(boardJobs.map((job) => job.status)),
      locations: getUniqueValues(boardJobs.map((job) => job.location)),
      organizations: boardJobs
        .filter((job) => job.organization_id && job.organization_name)
        .map((job) => ({
          id: job.organization_id as string,
          name: job.organization_name as string
        }))
        .filter(
          (option, index, array) =>
            array.findIndex((item) => item.id === option.id) === index
        )
        .sort((left, right) => left.name.localeCompare(right.name, "fr"))
    }),
    [boardJobs]
  );

  const filteredJobs = useMemo(() => {
    const query = deferredQuery.trim().toLowerCase();

    return boardJobs
      .filter((job) => {
        const matchesQuery =
          !query ||
          [
            job.title,
            job.summary,
            job.location,
            job.contract_type,
            job.work_mode,
            job.sector,
            job.organization_name
          ]
            .filter((value): value is string => typeof value === "string" && value.length > 0)
            .some((value) => value.toLowerCase().includes(query));

        const matchesStatus = !filters.status || job.status === filters.status;
        const matchesLocation = !filters.location || job.location === filters.location;
        const matchesOrganization =
          !filters.organizationId || job.organization_id === filters.organizationId;
        const matchesModeration =
          !filters.moderation ||
          (filters.moderation === "to_publish" && job.status === "draft") ||
          (filters.moderation === "live_without_candidates" &&
            job.status === "published" &&
            job.applications_count === 0) ||
          (filters.moderation === "active" && job.status === "published") ||
          (filters.moderation === "closed_or_archived" &&
            (job.status === "closed" || job.status === "archived"));

        return matchesQuery && matchesStatus && matchesLocation && matchesOrganization && matchesModeration;
      })
      .sort((left, right) => {
        if (filters.sort === "applications_desc" && left.applications_count !== right.applications_count) {
          return right.applications_count - left.applications_count;
        }

        const leftDate = new Date(left.updated_at || left.created_at).getTime();
        const rightDate = new Date(right.updated_at || right.created_at).getTime();

        if (filters.sort === "oldest") {
          return leftDate - rightDate;
        }

        return rightDate - leftDate;
      });
  }, [
    boardJobs,
    deferredQuery,
    filters.location,
    filters.moderation,
    filters.organizationId,
    filters.sort,
    filters.status
  ]);

  const activeFilterCount = [
    filters.query,
    filters.status,
    filters.location,
    filters.organizationId,
    filters.moderation,
    filters.sort !== "recent" ? filters.sort : ""
  ].filter(Boolean).length;

  async function handleQuickStatusUpdate(jobId: string, nextStatus: ManagedJob["status"]) {
    const targetJob = boardJobs.find((job) => job.id === jobId);

    if (!targetJob || targetJob.status === nextStatus || isPending) {
      return;
    }

    const previousJob = { ...targetJob };
    const now = new Date().toISOString();

    setBoardJobs((previous) =>
      previous.map((job) =>
        job.id === jobId
          ? {
              ...job,
              status: nextStatus,
              published_at: nextStatus === "published" ? now : job.published_at,
              closing_at: nextStatus === "closed" ? now : nextStatus === "draft" ? null : job.closing_at,
              updated_at: now
            }
          : job
      )
    );
    setFeedback(null);

    startTransition(() => {
      void quickUpdateJobStatusAction(jobId, nextStatus)
        .then((result) => {
          if (result.status === "error") {
            setBoardJobs((previous) =>
              previous.map((job) => (job.id === jobId ? previousJob : job))
            );
            setFeedback({
              kind: "error",
              message: result.message
            });
            return;
          }

          setFeedback({
            kind: "success",
            message: result.message
          });
        })
        .catch(() => {
          setBoardJobs((previous) =>
            previous.map((job) => (job.id === jobId ? previousJob : job))
          );
          setFeedback({
            kind: "error",
            message: "La mise a jour rapide de l'offre a echoue. Reessayez."
          });
        });
    });
  }

  function getQuickActions(job: ManagedJob) {
    if (job.status === "draft") {
      return [
        { value: "published" as const, label: "Publier", variant: "btn btn-primary" },
        { value: "archived" as const, label: "Archiver", variant: "btn btn-ghost" }
      ];
    }

    if (job.status === "published") {
      return [
        { value: "closed" as const, label: "Fermer", variant: "btn btn-primary" },
        { value: "draft" as const, label: "Brouillon", variant: "btn btn-secondary" },
        { value: "archived" as const, label: "Archiver", variant: "btn btn-ghost" }
      ];
    }

    if (job.status === "closed") {
      return [
        { value: "published" as const, label: "Reouvrir", variant: "btn btn-primary" },
        { value: "archived" as const, label: "Archiver", variant: "btn btn-secondary" }
      ];
    }

    return [
      { value: "draft" as const, label: "Restaurer", variant: "btn btn-secondary" },
      { value: "published" as const, label: "Republier", variant: "btn btn-primary" }
    ];
  }

  return (
    <div className="jobs-board">
      <section className="dashboard-form">
        <div className="dashboard-form__head">
          <div>
            <p className="eyebrow">
              {isAdminView ? "Moderation des offres" : "Gestion des offres"}
            </p>
            <h2>
              {isAdminView
                ? "Priorisez la diffusion, reperez les annonces a publier et arbitrez rapidement les statuts"
                : "Retrouvez, filtrez et ouvrez vos annonces"}
            </h2>
          </div>
          <span className="tag">{filteredJobs.length} offre(s)</span>
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
              placeholder="Titre, secteur, contrat, mot cle..."
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
              {filterOptions.statuses.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
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
              {filterOptions.locations.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          {isAdminView ? (
            <label className="field">
              <span>Organisation</span>
              <select
                value={filters.organizationId}
                onChange={(event) =>
                  setFilters((previous) => ({
                    ...previous,
                    organizationId: event.target.value
                  }))
                }
              >
                <option value="">Toutes les organisations</option>
                {filterOptions.organizations.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <label className="field">
            <span>{isAdminView ? "Priorite" : "Focus suivi"}</span>
            <select
              value={filters.moderation}
              onChange={(event) =>
                setFilters((previous) => ({
                  ...previous,
                  moderation: event.target.value as ManagedFilters["moderation"]
                }))
              }
            >
              <option value="">
                {isAdminView ? "Toutes les priorites" : "Toutes les offres"}
              </option>
              <option value="to_publish">
                {isAdminView ? "A publier en priorite" : "Brouillons a traiter"}
              </option>
              <option value="active">
                {isAdminView ? "Actives a suivre" : "Actives"}
              </option>
              <option value="live_without_candidates">
                {isAdminView
                  ? "Publiees sans candidatures"
                  : "Actives sans candidatures"}
              </option>
              <option value="closed_or_archived">Fermees ou archivees</option>
            </select>
          </label>

          <label className="field">
            <span>Tri</span>
            <select
              value={filters.sort}
              onChange={(event) =>
                setFilters((previous) => ({
                  ...previous,
                  sort: event.target.value as ManagedFilters["sort"]
                }))
              }
            >
              <option value="recent">Activite recente</option>
              <option value="applications_desc">Plus de candidatures</option>
              <option value="oldest">Plus anciennes</option>
            </select>
          </label>
        </div>

        <div className="jobs-board__actions">
          <div className="dashboard-card__badges">
            <span className="tag tag--muted">
              {boardJobs.filter((job) => job.status === "draft").length} brouillon(s)
            </span>
            <span className="tag tag--info">
              {boardJobs.filter((job) => job.status === "published").length} publiee(s)
            </span>
            {isAdminView ? (
              <span className="tag tag--muted">
                {
                  boardJobs.filter(
                    (job) => job.status === "published" && job.applications_count === 0
                  ).length
                }{" "}
                sans candidature
              </span>
            ) : null}
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

        {activeFilterCount > 0 ? (
          <p className="jobs-board__hint">
            {activeFilterCount} filtre(s) actif(s) pour isoler les offres les plus
            prioritaires.
          </p>
        ) : null}

        {feedback ? (
          <p className={feedback.kind === "error" ? "form-feedback form-feedback--error" : "form-feedback"}>
            {feedback.message}
          </p>
        ) : null}
      </section>

      <section className="jobs-results">
        {filteredJobs.length > 0 ? (
          filteredJobs.map((job) => (
            <article key={job.id} className="panel job-card jobs-result-card">
              <div className="jobs-result-card__head">
                <div className="jobs-result-card__badges">
                  <span className="tag">{job.status}</span>
                  {job.is_featured ? <span className="tag tag--success">Mise en avant</span> : null}
                  {job.status === "draft" ? (
                    <span className="tag tag--muted">A publier</span>
                  ) : null}
                  {job.status === "published" && job.applications_count === 0 ? (
                    <span className="tag tag--muted">Sans candidatures</span>
                  ) : null}
                </div>
                <small>Mise a jour le {formatDisplayDate(job.updated_at)}</small>
              </div>
              <h2>{job.title}</h2>
              <p>{job.summary}</p>
              <div className="job-card__meta">
                {isAdminView ? <span>{job.organization_name || "Madajob"}</span> : null}
                <span>{job.location}</span>
                <span>{job.contract_type}</span>
                <span>{job.work_mode}</span>
                <span>{job.applications_count} candidature(s)</span>
              </div>
              <div className="job-card__footer">
                <small>Publiee le {formatDisplayDate(job.published_at)}</small>
                <Link href={`${basePath}/${job.id}`}>Gerer l'offre</Link>
              </div>

              <div className="job-quick-actions">
                {getQuickActions(job).map((action) => (
                  <button
                    key={action.value}
                    type="button"
                    className={action.variant}
                    disabled={isPending}
                    onClick={() => void handleQuickStatusUpdate(job.id, action.value)}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </article>
          ))
        ) : (
          <article className="panel jobs-empty">
            <h2>Aucune offre ne correspond a ces filtres</h2>
            <p>Ajustez votre recherche pour retrouver une annonce existante.</p>
          </article>
        )}
      </section>
    </div>
  );
}
