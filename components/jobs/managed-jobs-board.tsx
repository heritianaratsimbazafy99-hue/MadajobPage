"use client";

import Link from "next/link";
import { useDeferredValue, useEffect, useMemo, useState, useTransition } from "react";

import { quickUpdateJobStatusAction } from "@/app/actions/job-actions";
import { formatDisplayDate } from "@/lib/format";
import {
  getManagedJobPriorityMeta,
  getManagedJobPriorityScore,
  summarizeManagedJobs,
  type ManagedJobPriorityKey
} from "@/lib/managed-job-insights";
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
  focus: "" | ManagedJobPriorityKey;
  sort: "priority_desc" | "recent" | "oldest" | "applications_desc";
};

const initialFilters: ManagedFilters = {
  query: "",
  status: "",
  location: "",
  organizationId: "",
  focus: "",
  sort: "priority_desc"
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

  const boardSummary = useMemo(() => summarizeManagedJobs(boardJobs), [boardJobs]);

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
        const priorityMeta = getManagedJobPriorityMeta(job);
        const matchesQuery =
          !query ||
          [
            job.title,
            job.summary,
            job.location,
            job.contract_type,
            job.work_mode,
            job.sector,
            job.organization_name,
            priorityMeta.label,
            priorityMeta.description
          ]
            .filter((value): value is string => typeof value === "string" && value.length > 0)
            .some((value) => value.toLowerCase().includes(query));

        const matchesStatus = !filters.status || job.status === filters.status;
        const matchesLocation = !filters.location || job.location === filters.location;
        const matchesOrganization =
          !filters.organizationId || job.organization_id === filters.organizationId;
        const matchesFocus = !filters.focus || priorityMeta.key === filters.focus;

        return matchesQuery && matchesStatus && matchesLocation && matchesOrganization && matchesFocus;
      })
      .sort((left, right) => {
        if (filters.sort === "priority_desc") {
          const leftScore = getManagedJobPriorityScore(left);
          const rightScore = getManagedJobPriorityScore(right);

          if (leftScore !== rightScore) {
            return rightScore - leftScore;
          }
        }

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
    filters.focus,
    filters.location,
    filters.organizationId,
    filters.sort,
    filters.status
  ]);

  const filteredSummary = useMemo(() => summarizeManagedJobs(filteredJobs), [filteredJobs]);

  const activeFilterCount = [
    filters.query,
    filters.status,
    filters.location,
    filters.organizationId,
    filters.focus,
    filters.sort !== "priority_desc" ? filters.sort : ""
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
                ? "Priorisez la diffusion, les offres sans traction et les annonces dont la cloture approche"
                : "Retrouvez les annonces qui demandent une action concrete sur la diffusion ou le pipeline"}
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
              value={filters.focus}
              onChange={(event) =>
                setFilters((previous) => ({
                  ...previous,
                  focus: event.target.value as ManagedFilters["focus"]
                }))
              }
            >
              <option value="">
                {isAdminView ? "Toutes les priorites" : "Toutes les offres"}
              </option>
              <option value="to_publish">
                {isAdminView ? "A publier en priorite" : "Brouillons a publier"}
              </option>
              <option value="closing_soon">Cloture proche</option>
              <option value="live_without_candidates">Publiees sans candidatures</option>
              <option value="active_pipeline">Pipeline actif</option>
              <option value="inactive">A surveiller</option>
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
              <option value="priority_desc">Priorite</option>
              <option value="recent">Activite recente</option>
              <option value="applications_desc">Plus de candidatures</option>
              <option value="oldest">Plus anciennes</option>
            </select>
          </label>
        </div>

        <div className="interviews-board__stats">
          <article className="document-card">
            <strong>{filteredSummary.draftCount}</strong>
            <p>brouillon(s)</p>
          </article>
          <article className="document-card">
            <strong>{filteredSummary.withoutApplicationsCount}</strong>
            <p>publiee(s) sans candidatures</p>
          </article>
          <article className="document-card">
            <strong>{filteredSummary.closingSoonCount}</strong>
            <p>cloture(s) proche(s)</p>
          </article>
          <article className="document-card">
            <strong>{filteredSummary.activePipelineCount}</strong>
            <p>pipeline(s) actif(s)</p>
          </article>
        </div>

        <div className="jobs-board__actions">
          <div className="dashboard-card__badges">
            <span className="tag tag--muted">{boardSummary.draftCount} brouillon(s)</span>
            <span className="tag tag--info">{boardSummary.publishedCount} publiee(s)</span>
            <span className="tag tag--danger">{boardSummary.withoutApplicationsCount} sans candidature</span>
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

        <p className="jobs-board__hint">
          {activeFilterCount > 0
            ? `${activeFilterCount} filtre(s) actif(s) pour isoler les offres les plus prioritaires.`
            : "Les offres a publier, a relancer ou a arbitrer rapidement remontent automatiquement en tete."}
        </p>

        {feedback ? (
          <p className={feedback.kind === "error" ? "form-feedback form-feedback--error" : "form-feedback"}>
            {feedback.message}
          </p>
        ) : null}
      </section>

      <section className="jobs-results">
        {filteredJobs.length > 0 ? (
          filteredJobs.map((job) => {
            const priorityMeta = getManagedJobPriorityMeta(job);

            return (
              <article key={job.id} className="panel job-card jobs-result-card">
                <div className="jobs-result-card__head">
                  <div className="jobs-result-card__badges">
                    <span className="tag">{job.status}</span>
                    <span className={`tag tag--${priorityMeta.tone}`}>{priorityMeta.label}</span>
                    {job.is_featured ? <span className="tag tag--success">Mise en avant</span> : null}
                  </div>
                  <small>Mise a jour le {formatDisplayDate(job.updated_at)}</small>
                </div>

                <h2>{job.title}</h2>
                <p>{priorityMeta.description}</p>

                <div className="job-card__meta">
                  {isAdminView ? <span>{job.organization_name || "Madajob"}</span> : null}
                  <span>{job.location}</span>
                  <span>{job.contract_type}</span>
                  <span>{job.work_mode}</span>
                  <span>{job.applications_count} candidature(s)</span>
                  {job.closing_at ? <span>Cloture le {formatDisplayDate(job.closing_at)}</span> : null}
                </div>

                <div className="application-signal-card">
                  <strong>{job.summary}</strong>
                  <p>
                    {job.status === "published" && job.applications_count === 0
                      ? "L'annonce est diffusee mais n'a pas encore converti en candidatures."
                      : job.status === "published" && job.applications_count >= 5
                        ? "Le pipeline est deja alimente. L'enjeu principal est maintenant le traitement des dossiers."
                        : job.status === "draft"
                          ? "L'offre peut etre relue, finalisee puis publiee directement depuis la liste."
                          : "Cette offre reste disponible pour pilotage depuis sa fiche detaillee."}
                  </p>
                </div>

                <div className="job-card__footer">
                  <small>
                    Publiee le {formatDisplayDate(job.published_at)}{job.department ? ` · ${job.department}` : ""}
                  </small>
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
            );
          })
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
