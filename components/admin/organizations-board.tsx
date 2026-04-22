"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";

import { formatDisplayDate } from "@/lib/format";
import type { ManagedOrganizationSummary } from "@/lib/types";

type OrganizationsBoardProps = {
  organizations: ManagedOrganizationSummary[];
};

type Filters = {
  query: string;
  kind: string;
  status: string;
  sort: "activity" | "members" | "jobs" | "applications";
};

const initialFilters: Filters = {
  query: "",
  kind: "",
  status: "",
  sort: "activity"
};

export function OrganizationsBoard({ organizations }: OrganizationsBoardProps) {
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const deferredQuery = useDeferredValue(filters.query);

  const kindOptions = useMemo(
    () =>
      Array.from(new Set(organizations.map((organization) => organization.kind).filter(Boolean))).sort((a, b) =>
        a.localeCompare(b, "fr")
      ),
    [organizations]
  );

  const filteredOrganizations = useMemo(() => {
    const query = deferredQuery.trim().toLowerCase();

    return organizations
      .filter((organization) => {
        const matchesQuery =
          !query ||
          [organization.name, organization.slug, organization.kind]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(query));

        const matchesKind = !filters.kind || organization.kind === filters.kind;
        const matchesStatus =
          !filters.status ||
          (filters.status === "active" ? organization.is_active : !organization.is_active);

        return matchesQuery && matchesKind && matchesStatus;
      })
      .sort((left, right) => {
        if (filters.sort === "members" && left.members_count !== right.members_count) {
          return right.members_count - left.members_count;
        }

        if (filters.sort === "jobs" && left.active_jobs_count !== right.active_jobs_count) {
          return right.active_jobs_count - left.active_jobs_count;
        }

        if (filters.sort === "applications" && left.applications_count !== right.applications_count) {
          return right.applications_count - left.applications_count;
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
  }, [deferredQuery, filters.kind, filters.sort, filters.status, organizations]);

  const activeFilterCount = [
    filters.query,
    filters.kind,
    filters.status,
    filters.sort !== "activity" ? filters.sort : ""
  ].filter(Boolean).length;

  return (
    <div className="jobs-board">
      <section className="dashboard-form">
        <div className="dashboard-form__head">
          <div>
            <p className="eyebrow">Organisations</p>
            <h2>Pilotez les entites clientes et internes depuis un module dedie</h2>
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
              <option value="activity">Activite recente</option>
              <option value="members">Plus de membres</option>
              <option value="jobs">Plus d'offres actives</option>
              <option value="applications">Plus de candidatures</option>
            </select>
          </label>
        </div>

        {activeFilterCount > 0 ? (
          <div className="jobs-board__actions">
            <div className="dashboard-card__badges">
              <span className="tag tag--muted">{filteredOrganizations.length} resultat(s)</span>
            </div>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setFilters(initialFilters)}
            >
              Reinitialiser les filtres
            </button>
          </div>
        ) : null}
      </section>

      <section className="jobs-results">
        {filteredOrganizations.length > 0 ? (
          filteredOrganizations.map((organization) => (
            <article key={organization.id} className="panel job-card jobs-result-card">
              <div className="jobs-result-card__head">
                <div className="jobs-result-card__badges">
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

              <div className="job-card__footer">
                <small>
                  {organization.latest_application_at
                    ? `Derniere candidature le ${formatDisplayDate(organization.latest_application_at)}`
                    : organization.latest_job_at
                      ? `Derniere offre le ${formatDisplayDate(organization.latest_job_at)}`
                      : "Pas encore d'activite"}
                </small>
                <Link href={`/app/admin/organisations/${organization.id}`}>Ouvrir la fiche</Link>
              </div>
            </article>
          ))
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
