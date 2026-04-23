"use client";

import Link from "next/link";
import { useDeferredValue, useEffect, useMemo, useState, useTransition } from "react";

import { quickUpdateOrganizationStatusAction } from "@/app/actions/admin-actions";
import { formatDisplayDate } from "@/lib/format";
import {
  getManagedOrganizationPriorityMeta,
  getManagedOrganizationPriorityScore,
  summarizeManagedOrganizations,
  type ManagedOrganizationPriorityKey
} from "@/lib/managed-organization-insights";
import type { ManagedOrganizationSummary } from "@/lib/types";

type OrganizationsBoardProps = {
  organizations: ManagedOrganizationSummary[];
};

type Filters = {
  query: string;
  kind: string;
  status: string;
  focus: "" | ManagedOrganizationPriorityKey;
  sort:
    | "priority"
    | "activity"
    | "members"
    | "jobs"
    | "applications"
    | "shortlist"
    | "name";
};

const initialFilters: Filters = {
  query: "",
  kind: "",
  status: "",
  focus: "",
  sort: "priority"
};

function getOrganizationSignalCopy(organization: ManagedOrganizationSummary) {
  if (!organization.is_active) {
    return {
      title: "Activation a arbitrer",
      body: "Cette organisation est inactive. Verifiez si elle doit etre reactivee ou maintenue hors circuit."
    };
  }

  if (organization.recruiters_count === 0) {
    return {
      title: "Couverture recruteur absente",
      body: "Aucun recruteur n'est rattache pour porter la diffusion et le traitement du pipeline."
    };
  }

  if (organization.active_jobs_count === 0 && organization.applications_count > 0) {
    return {
      title: "Pipeline sans diffusion active",
      body: "Des candidatures existent encore mais aucune offre publiee n'est actuellement en ligne."
    };
  }

  if (organization.shortlist_count > 0) {
    return {
      title: "Dossiers avances a suivre",
      body: "La shortlist ou les entretiens justifient une supervision plus rapprochee de l'organisation."
    };
  }

  return {
    title: "Cadence a surveiller",
    body: "Le cockpit garde cette organisation visible pour aider l'arbitrage de diffusion et d'activite."
  };
}

export function OrganizationsBoard({ organizations }: OrganizationsBoardProps) {
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [boardOrganizations, setBoardOrganizations] = useState(organizations);
  const [feedback, setFeedback] = useState<{
    kind: "success" | "error";
    message: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();
  const deferredQuery = useDeferredValue(filters.query);

  useEffect(() => {
    setBoardOrganizations(organizations);
    setFeedback(null);
  }, [organizations]);

  const boardSummary = useMemo(
    () => summarizeManagedOrganizations(boardOrganizations),
    [boardOrganizations]
  );

  const kindOptions = useMemo(
    () =>
      Array.from(
        new Set(boardOrganizations.map((organization) => organization.kind).filter(Boolean))
      ).sort((a, b) => a.localeCompare(b, "fr")),
    [boardOrganizations]
  );

  const filteredOrganizations = useMemo(() => {
    const query = deferredQuery.trim().toLowerCase();

    return boardOrganizations
      .filter((organization) => {
        const priorityMeta = getManagedOrganizationPriorityMeta(organization);
        const matchesQuery =
          !query ||
          [
            organization.name,
            organization.slug,
            organization.kind,
            priorityMeta.label,
            priorityMeta.description
          ]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(query));

        const matchesKind = !filters.kind || organization.kind === filters.kind;
        const matchesStatus =
          !filters.status ||
          (filters.status === "active" ? organization.is_active : !organization.is_active);
        const matchesFocus = !filters.focus || priorityMeta.key === filters.focus;

        return matchesQuery && matchesKind && matchesStatus && matchesFocus;
      })
      .sort((left, right) => {
        if (filters.sort === "priority") {
          const leftScore = getManagedOrganizationPriorityScore(left);
          const rightScore = getManagedOrganizationPriorityScore(right);

          if (leftScore !== rightScore) {
            return rightScore - leftScore;
          }
        }

        if (filters.sort === "members" && left.members_count !== right.members_count) {
          return right.members_count - left.members_count;
        }

        if (filters.sort === "jobs" && left.active_jobs_count !== right.active_jobs_count) {
          return right.active_jobs_count - left.active_jobs_count;
        }

        if (filters.sort === "applications" && left.applications_count !== right.applications_count) {
          return right.applications_count - left.applications_count;
        }

        if (filters.sort === "shortlist" && left.shortlist_count !== right.shortlist_count) {
          return right.shortlist_count - left.shortlist_count;
        }

        if (filters.sort === "name") {
          return left.name.localeCompare(right.name, "fr");
        }

        const leftTime = left.latest_application_at
          ? new Date(left.latest_application_at).getTime()
          : left.latest_job_at
            ? new Date(left.latest_job_at).getTime()
            : 0;
        const rightTime = right.latest_application_at
          ? new Date(right.latest_application_at).getTime()
          : right.latest_job_at
            ? new Date(right.latest_job_at).getTime()
            : 0;

        return rightTime - leftTime;
      });
  }, [boardOrganizations, deferredQuery, filters.focus, filters.kind, filters.sort, filters.status]);

  const filteredSummary = useMemo(
    () => summarizeManagedOrganizations(filteredOrganizations),
    [filteredOrganizations]
  );

  const activeFilterCount = [
    filters.query,
    filters.kind,
    filters.status,
    filters.focus,
    filters.sort !== "priority" ? filters.sort : ""
  ].filter(Boolean).length;

  async function handleQuickStatusToggle(organizationId: string, nextIsActive: boolean) {
    const previousOrganization = boardOrganizations.find(
      (organization) => organization.id === organizationId
    );

    if (!previousOrganization || previousOrganization.is_active === nextIsActive || isPending) {
      return;
    }

    setBoardOrganizations((current) =>
      current.map((organization) =>
        organization.id === organizationId
          ? {
              ...organization,
              is_active: nextIsActive
            }
          : organization
      )
    );
    setFeedback(null);

    startTransition(() => {
      void quickUpdateOrganizationStatusAction(organizationId, nextIsActive)
        .then((result) => {
          if (result.status === "error") {
            setBoardOrganizations((current) =>
              current.map((organization) =>
                organization.id === organizationId ? previousOrganization : organization
              )
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
          setBoardOrganizations((current) =>
            current.map((organization) =>
              organization.id === organizationId ? previousOrganization : organization
            )
          );
          setFeedback({
            kind: "error",
            message: "La mise a jour rapide de l'organisation a echoue. Reessayez."
          });
        });
    });
  }

  return (
    <div className="jobs-board">
      <section className="dashboard-form">
        <div className="dashboard-form__head">
          <div>
            <p className="eyebrow">Organisations</p>
            <h2>Priorisez les organisations a surveiller, les trous de couverture et les pipelines a arbitrer</h2>
          </div>
          <span className="tag">{filteredOrganizations.length} organisation(s)</span>
        </div>

        <div className="form-grid">
          <label className="field field--full">
            <span>Recherche</span>
            <input
              value={filters.query}
              onChange={(event) =>
                setFilters((previous) => ({ ...previous, query: event.target.value }))
              }
              placeholder="Nom, slug, type..."
            />
          </label>

          <label className="field">
            <span>Type</span>
            <select
              value={filters.kind}
              onChange={(event) =>
                setFilters((previous) => ({ ...previous, kind: event.target.value }))
              }
            >
              <option value="">Tous les types</option>
              {kindOptions.map((kind) => (
                <option key={kind} value={kind}>
                  {kind}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Statut</span>
            <select
              value={filters.status}
              onChange={(event) =>
                setFilters((previous) => ({ ...previous, status: event.target.value }))
              }
            >
              <option value="">Toutes</option>
              <option value="active">Actives</option>
              <option value="inactive">Inactives</option>
            </select>
          </label>

          <label className="field">
            <span>Priorite admin</span>
            <select
              value={filters.focus}
              onChange={(event) =>
                setFilters((previous) => ({
                  ...previous,
                  focus: event.target.value as Filters["focus"]
                }))
              }
            >
              <option value="">Toutes les vues</option>
              <option value="inactive_org">Inactives</option>
              <option value="without_recruiters">Sans recruteur</option>
              <option value="without_jobs">Sans offre active</option>
              <option value="advanced_pipeline">Pipeline avance</option>
              <option value="dormant">Dormantes</option>
              <option value="healthy">Saines</option>
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
              <option value="priority">Priorite</option>
              <option value="activity">Activite recente</option>
              <option value="members">Plus de membres</option>
              <option value="jobs">Plus d'offres actives</option>
              <option value="applications">Plus de candidatures</option>
              <option value="shortlist">Plus de dossiers avances</option>
              <option value="name">Nom A-Z</option>
            </select>
          </label>
        </div>

        <div className="interviews-board__stats">
          <article className="document-card">
            <strong>{filteredSummary.activeCount}</strong>
            <p>active(s)</p>
          </article>
          <article className="document-card">
            <strong>{filteredSummary.withoutRecruitersCount}</strong>
            <p>sans recruteur</p>
          </article>
          <article className="document-card">
            <strong>{filteredSummary.withoutJobsCount}</strong>
            <p>sans offre active</p>
          </article>
          <article className="document-card">
            <strong>{filteredSummary.advancedPipelineCount}</strong>
            <p>pipeline(s) avance(s)</p>
          </article>
          <article className="document-card">
            <strong>{filteredSummary.dormantCount}</strong>
            <p>dormante(s)</p>
          </article>
        </div>

        <div className="jobs-board__actions">
          <div className="dashboard-card__badges">
            <span className="tag tag--success">{boardSummary.activeCount} active(s)</span>
            <span className="tag tag--muted">{boardSummary.withoutRecruitersCount} sans recruteur</span>
            <span className="tag tag--info">{boardSummary.withoutJobsCount} sans offre active</span>
            <span className="tag tag--success">{boardSummary.advancedPipelineCount} pipeline(s) avance(s)</span>
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
          {activeFilterCount > 0
            ? `${activeFilterCount} filtre(s) actif(s) pour isoler les organisations prioritaires.`
            : "Le tri par priorite remonte d'abord les organisations inactives, sans recruteur, sans diffusion active ou avec un pipeline avance a arbitrer."}
        </p>

        {feedback ? (
          <p className={feedback.kind === "error" ? "form-feedback form-feedback--error" : "form-feedback"}>
            {feedback.message}
          </p>
        ) : null}
      </section>

      <section className="jobs-results">
        {filteredOrganizations.length > 0 ? (
          filteredOrganizations.map((organization) => {
            const priorityMeta = getManagedOrganizationPriorityMeta(organization);
            const signalCopy = getOrganizationSignalCopy(organization);

            return (
              <article key={organization.id} className="panel job-card jobs-result-card">
                <div className="jobs-result-card__head">
                  <div className="jobs-result-card__badges">
                    <span className={`tag tag--${priorityMeta.tone}`}>{priorityMeta.label}</span>
                    <span className="tag">{organization.kind}</span>
                    <span className={`tag ${organization.is_active ? "tag--success" : "tag--muted"}`}>
                      {organization.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <small>{organization.slug}</small>
                </div>

                <h2>{organization.name}</h2>
                <p>{organization.members_count} membre(s) rattache(s)</p>

                <div className="job-card__meta">
                  <span>{organization.recruiters_count} recruteur(s)</span>
                  <span>{organization.active_jobs_count} offre(s) active(s)</span>
                  <span>{organization.applications_count} candidature(s)</span>
                  <span>{organization.shortlist_count} dossier(s) avances</span>
                </div>

                <div className="application-signal-card">
                  <strong>{signalCopy.title}</strong>
                  <p>{signalCopy.body}</p>
                  <small>{priorityMeta.description}</small>
                </div>

                <div className="job-card__footer">
                  <small>
                    {organization.latest_application_at
                      ? `Derniere candidature le ${formatDisplayDate(organization.latest_application_at)}`
                      : organization.latest_job_at
                        ? `Derniere offre le ${formatDisplayDate(organization.latest_job_at)}`
                        : "Pas encore d'activite"}
                  </small>
                  <div className="dashboard-card__badges">
                    <button
                      type="button"
                      className={organization.is_active ? "btn btn-ghost" : "btn btn-primary"}
                      disabled={isPending}
                      onClick={() =>
                        void handleQuickStatusToggle(
                          organization.id,
                          !organization.is_active
                        )
                      }
                    >
                      {organization.is_active ? "Desactiver" : "Reactiver"}
                    </button>
                    <Link href={`/app/admin/organisations/${organization.id}`}>Ouvrir la fiche</Link>
                  </div>
                </div>
              </article>
            );
          })
        ) : (
          <article className="panel jobs-empty">
            <h2>Aucune organisation ne correspond a ces filtres</h2>
            <p>Elargissez les criteres pour retrouver la bonne entite.</p>
          </article>
        )}
      </section>
    </div>
  );
}
