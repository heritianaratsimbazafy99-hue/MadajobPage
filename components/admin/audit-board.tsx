"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";

import { formatDisplayDate } from "@/lib/format";
import type { AdminAuditEvent } from "@/lib/types";

type AuditBoardProps = {
  events: AdminAuditEvent[];
};

type Filters = {
  query: string;
  entityType: string;
  action: string;
  actor: string;
};

const initialFilters: Filters = {
  query: "",
  entityType: "",
  action: "",
  actor: ""
};

function getActionLabel(action: string) {
  if (action === "job_created") {
    return "Creation d'offre";
  }

  if (action === "job_updated") {
    return "Edition d'offre";
  }

  if (action === "job_status_changed") {
    return "Statut d'offre modifie";
  }

  if (action === "profile_access_updated") {
    return "Acces utilisateur modifie";
  }

  if (action === "user_invited") {
    return "Invitation envoyee";
  }

  if (action === "organization_updated") {
    return "Organisation mise a jour";
  }

  return action.replace(/[_-]+/g, " ");
}

function getEntityTypeLabel(entityType: string) {
  if (entityType === "profile") {
    return "Utilisateur";
  }

  if (entityType === "job_post") {
    return "Offre";
  }

  if (entityType === "organization") {
    return "Organisation";
  }

  return entityType;
}

function getEventSummary(event: AdminAuditEvent) {
  if (event.action === "job_status_changed") {
    return `Transition ${String(event.metadata.from_status ?? "inconnue")} → ${String(event.metadata.to_status ?? "inconnue")}`;
  }

  if (event.action === "profile_access_updated") {
    return `Role ${String(event.metadata.previous_role ?? "inconnu")} → ${String(event.metadata.next_role ?? "inconnu")}`;
  }

  if (event.action === "user_invited") {
    return `Invitation de ${String(event.metadata.invited_email ?? "utilisateur")} avec le role ${String(event.metadata.invited_role ?? "inconnu")}`;
  }

  if (event.action === "organization_updated") {
    return `Nom ${String(event.metadata.previous_name ?? "inconnu")} → ${String(event.metadata.next_name ?? "inconnu")}`;
  }

  if (event.action === "job_created") {
    return `Statut initial ${String(event.metadata.status ?? "draft")}`;
  }

  return "Evenement journalise dans le cockpit admin.";
}

export function AuditBoard({ events }: AuditBoardProps) {
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const deferredQuery = useDeferredValue(filters.query);

  const entityTypeOptions = useMemo(
    () =>
      Array.from(new Set(events.map((event) => event.entity_type).filter(Boolean))).sort((a, b) =>
        a.localeCompare(b, "fr")
      ),
    [events]
  );
  const actionOptions = useMemo(
    () =>
      Array.from(new Set(events.map((event) => event.action).filter(Boolean))).sort((a, b) =>
        a.localeCompare(b, "fr")
      ),
    [events]
  );
  const actorOptions = useMemo(
    () =>
      Array.from(new Set(events.map((event) => event.actor_name).filter(Boolean))).sort((a, b) =>
        a.localeCompare(b, "fr")
      ),
    [events]
  );

  const filteredEvents = useMemo(() => {
    const query = deferredQuery.trim().toLowerCase();

    return events.filter((event) => {
      const matchesQuery =
        !query ||
        [
          event.entity_label,
          event.actor_name,
          event.actor_email,
          event.action,
          event.entity_type
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));

      const matchesEntityType = !filters.entityType || event.entity_type === filters.entityType;
      const matchesAction = !filters.action || event.action === filters.action;
      const matchesActor = !filters.actor || event.actor_name === filters.actor;

      return matchesQuery && matchesEntityType && matchesAction && matchesActor;
    });
  }, [deferredQuery, events, filters.action, filters.actor, filters.entityType]);

  const activeFilterCount = [
    filters.query,
    filters.entityType,
    filters.action,
    filters.actor
  ].filter(Boolean).length;

  return (
    <div className="jobs-board">
      <section className="dashboard-form">
        <div className="dashboard-form__head">
          <div>
            <p className="eyebrow">Audit admin</p>
            <h2>Tracez les actions critiques utilisateurs, offres et organisations</h2>
          </div>
          <span className="tag">{filteredEvents.length} evenement(s)</span>
        </div>

        <div className="form-grid">
          <label className="field field--full">
            <span>Recherche</span>
            <input
              value={filters.query}
              onChange={(event) =>
                setFilters((previous) => ({ ...previous, query: event.target.value }))
              }
              placeholder="Entite, acteur, action..."
            />
          </label>

          <label className="field">
            <span>Entite</span>
            <select
              value={filters.entityType}
              onChange={(event) =>
                setFilters((previous) => ({ ...previous, entityType: event.target.value }))
              }
            >
              <option value="">Toutes les entites</option>
              {entityTypeOptions.map((entityType) => (
                <option key={entityType} value={entityType}>
                  {getEntityTypeLabel(entityType)}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Action</span>
            <select
              value={filters.action}
              onChange={(event) =>
                setFilters((previous) => ({ ...previous, action: event.target.value }))
              }
            >
              <option value="">Toutes les actions</option>
              {actionOptions.map((action) => (
                <option key={action} value={action}>
                  {getActionLabel(action)}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Acteur</span>
            <select
              value={filters.actor}
              onChange={(event) =>
                setFilters((previous) => ({ ...previous, actor: event.target.value }))
              }
            >
              <option value="">Tous les acteurs</option>
              {actorOptions.map((actor) => (
                <option key={actor} value={actor}>
                  {actor}
                </option>
              ))}
            </select>
          </label>
        </div>

        {activeFilterCount > 0 ? (
          <div className="jobs-board__actions">
            <div className="dashboard-card__badges">
              <span className="tag tag--muted">{filteredEvents.length} resultat(s)</span>
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
        {filteredEvents.length > 0 ? (
          filteredEvents.map((event) => (
            <article key={event.id} className="panel job-card jobs-result-card">
              <div className="jobs-result-card__head">
                <div className="jobs-result-card__badges">
                  <span className="tag">{getEntityTypeLabel(event.entity_type)}</span>
                  <span className="tag tag--muted">{getActionLabel(event.action)}</span>
                </div>
                <small>{formatDisplayDate(event.created_at)}</small>
              </div>

              <h2>{event.entity_label}</h2>
              <p>{getEventSummary(event)}</p>

              <div className="job-card__meta">
                <span>{event.actor_name}</span>
                {event.actor_email ? <span>{event.actor_email}</span> : null}
                <span>{event.entity_type}</span>
              </div>

              <div className="job-card__footer">
                <small>{event.entity_id}</small>
                {event.entity_href ? (
                  <Link href={event.entity_href}>Ouvrir la fiche</Link>
                ) : (
                  <span className="tag tag--muted">Sans lien</span>
                )}
              </div>
            </article>
          ))
        ) : (
          <article className="panel jobs-empty">
            <h2>Aucun evenement ne correspond a ces filtres</h2>
            <p>Elargissez les criteres pour retrouver une action ou un acteur.</p>
          </article>
        )}
      </section>
    </div>
  );
}
