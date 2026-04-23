"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";

import { formatDisplayDate } from "@/lib/format";
import {
  getAdminAuditActionLabel,
  getAdminAuditEntityTypeLabel,
  getAdminAuditEventDetailChips,
  getAdminAuditEventMeta,
  getAdminAuditEventPriorityScore,
  getAdminAuditEventSummary,
  matchesAdminAuditFocus,
  summarizeAdminAuditEvents,
  type AdminAuditFocusKey
} from "@/lib/managed-audit-insights";
import type { AdminAuditEvent } from "@/lib/types";

type AuditBoardProps = {
  events: AdminAuditEvent[];
};

type Filters = {
  query: string;
  entityType: string;
  action: string;
  actor: string;
  focus: "" | AdminAuditFocusKey;
  window: "" | "24h" | "7d" | "30d";
  sort: "recent" | "sensitive" | "actor_asc";
};

type PriorityView = {
  title: string;
  count: number;
  description: string;
  focus: AdminAuditFocusKey;
};

const initialFilters: Filters = {
  query: "",
  entityType: "",
  action: "",
  actor: "",
  focus: "",
  window: "",
  sort: "recent"
};

const oneDayInMs = 86_400_000;

function getDaysSince(dateValue: string) {
  return (Date.now() - new Date(dateValue).getTime()) / oneDayInMs;
}

function getToneClass(tone: "info" | "success" | "danger" | "muted") {
  if (tone === "danger") {
    return "tag tag--danger";
  }

  if (tone === "success") {
    return "tag tag--success";
  }

  if (tone === "info") {
    return "tag tag--info";
  }

  return "tag tag--muted";
}

export function AuditBoard({ events }: AuditBoardProps) {
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const deferredQuery = useDeferredValue(filters.query);
  const summary = useMemo(() => summarizeAdminAuditEvents(events), [events]);

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

  const priorityViews = useMemo(
    () =>
      [
        {
          title: "Evenements sensibles",
          count: summary.sensitiveCount,
          description: "Changements de droits, activations ou transitions critiques a verifier vite.",
          focus: "sensitive"
        },
        {
          title: "Acces internes",
          count: summary.accessCount,
          description: "Arbitrages de roles, activation ou rattachement sur les comptes internes.",
          focus: "access"
        },
        {
          title: "Invitations",
          count: summary.invitationCount,
          description: "Invitations internes a croiser avec le suivi onboarding et les droits cibles.",
          focus: "invitations"
        },
        {
          title: "Statuts offres",
          count: summary.jobStatusCount,
          description: "Transitions d'offres qui impactent la diffusion et le pipeline candidat.",
          focus: "job_status"
        }
      ] satisfies PriorityView[],
    [summary]
  );

  const filteredEvents = useMemo(() => {
    const query = deferredQuery.trim().toLowerCase();

    return events
      .filter((event) => {
        const matchesQuery =
          !query ||
          [
            event.entity_label,
            event.actor_name,
            event.actor_email,
            event.action,
            event.entity_type,
            JSON.stringify(event.metadata)
          ]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(query));

        const matchesEntityType = !filters.entityType || event.entity_type === filters.entityType;
        const matchesAction = !filters.action || event.action === filters.action;
        const matchesActor = !filters.actor || event.actor_name === filters.actor;
        const matchesFocus =
          !filters.focus || matchesAdminAuditFocus(event, filters.focus);
        const matchesWindow =
          !filters.window ||
          (filters.window === "24h" && getDaysSince(event.created_at) <= 1) ||
          (filters.window === "7d" && getDaysSince(event.created_at) <= 7) ||
          (filters.window === "30d" && getDaysSince(event.created_at) <= 30);

        return (
          matchesQuery &&
          matchesEntityType &&
          matchesAction &&
          matchesActor &&
          matchesFocus &&
          matchesWindow
        );
      })
      .sort((left, right) => {
        if (filters.sort === "actor_asc") {
          return left.actor_name.localeCompare(right.actor_name, "fr");
        }

        if (filters.sort === "sensitive") {
          const leftScore = getAdminAuditEventPriorityScore(left);
          const rightScore = getAdminAuditEventPriorityScore(right);

          if (leftScore !== rightScore) {
            return rightScore - leftScore;
          }
        }

        return new Date(right.created_at).getTime() - new Date(left.created_at).getTime();
      });
  }, [
    deferredQuery,
    events,
    filters.action,
    filters.actor,
    filters.entityType,
    filters.focus,
    filters.sort,
    filters.window
  ]);

  const activeFilterCount = [
    filters.query,
    filters.entityType,
    filters.action,
    filters.actor,
    filters.focus,
    filters.window,
    filters.sort !== "recent" ? filters.sort : ""
  ].filter(Boolean).length;

  function applyFocus(nextFocus: AdminAuditFocusKey) {
    setFilters((previous) => ({
      ...previous,
      focus: previous.focus === nextFocus ? "" : nextFocus
    }));
  }

  return (
    <div className="jobs-board">
      <section className="dashboard-workspace">
        <div className="dashboard-column">
          <div className="dashboard-section">
            <div className="dashboard-section__head">
              <div>
                <p className="eyebrow">Vues audit</p>
                <h2>Isolez d'abord les evenements qui demandent un arbitrage rapide</h2>
              </div>
              <span className="tag">{summary.total} evenement(s)</span>
            </div>

            <div className="supervision-grid">
              {priorityViews.map((view) => {
                const isActive = filters.focus === view.focus;

                return (
                  <article key={view.title} className="panel list-card dashboard-card">
                    <div className="dashboard-card__top">
                      <h3>{view.title}</h3>
                      <span className={view.count > 0 ? "tag tag--danger" : "tag tag--muted"}>
                        {view.count}
                      </span>
                    </div>
                    <p>{view.description}</p>
                    <div className="dashboard-action-stack">
                      <button
                        type="button"
                        className={isActive ? "btn btn-secondary btn-block" : "btn btn-ghost btn-block"}
                        onClick={() => applyFocus(view.focus)}
                      >
                        {isActive ? "Retirer la vue" : "Filtrer cette vue"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </div>

        <aside className="dashboard-column dashboard-column--aside">
          <div className="panel dashboard-sidecard">
            <p className="eyebrow">A investiguer maintenant</p>
            <h2>
              {summary.topPriorityEvent
                ? getAdminAuditActionLabel(summary.topPriorityEvent.action)
                : "Aucun signal prioritaire"}
            </h2>
            <p>
              {summary.topPriorityEvent
                ? getAdminAuditEventSummary(summary.topPriorityEvent)
                : "La timeline est vide pour le moment."}
            </p>

            {summary.topPriorityEvent ? (
              <div className="dashboard-list">
                <article className="panel list-card dashboard-card">
                  <div className="dashboard-card__top">
                    <h3>{summary.topPriorityEvent.entity_label}</h3>
                    <span className={getToneClass(getAdminAuditEventMeta(summary.topPriorityEvent).tone)}>
                      {getAdminAuditEventMeta(summary.topPriorityEvent).label}
                    </span>
                  </div>
                  <div className="job-card__meta">
                    <span>{summary.topPriorityEvent.actor_name}</span>
                    <span>{formatDisplayDate(summary.topPriorityEvent.created_at)}</span>
                  </div>
                  <div className="dashboard-action-stack">
                    <button
                      type="button"
                      className="btn btn-ghost btn-block"
                      onClick={() => applyFocus("sensitive")}
                    >
                      Ouvrir les sensibles
                    </button>
                    {summary.topPriorityEvent.entity_href ? (
                      <Link
                        className="btn btn-secondary btn-block"
                        href={summary.topPriorityEvent.entity_href}
                      >
                        Ouvrir la fiche liee
                      </Link>
                    ) : null}
                  </div>
                </article>
              </div>
            ) : null}
          </div>
        </aside>
      </section>

      <section className="dashboard-form">
        <div className="dashboard-form__head">
          <div>
            <p className="eyebrow">Timeline admin</p>
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
              placeholder="Entite, acteur, action, metadata..."
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
                  {getAdminAuditEntityTypeLabel(entityType)}
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
                  {getAdminAuditActionLabel(action)}
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

          <label className="field">
            <span>Vue metier</span>
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
              <option value="sensitive">Evenements sensibles</option>
              <option value="access">Acces internes</option>
              <option value="invitations">Invitations</option>
              <option value="organizations">Organisations</option>
              <option value="jobs">Offres</option>
              <option value="job_status">Transitions de statut offre</option>
            </select>
          </label>

          <label className="field">
            <span>Periode</span>
            <select
              value={filters.window}
              onChange={(event) =>
                setFilters((previous) => ({
                  ...previous,
                  window: event.target.value as Filters["window"]
                }))
              }
            >
              <option value="">Toute la periode</option>
              <option value="24h">Dernieres 24h</option>
              <option value="7d">7 derniers jours</option>
              <option value="30d">30 derniers jours</option>
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
              <option value="sensitive">Plus prioritaires</option>
              <option value="actor_asc">Acteur A-Z</option>
            </select>
          </label>
        </div>

        <div className="dashboard-card__top">
          <div className="dashboard-card__badges">
            <span className="tag tag--danger">{summary.sensitiveCount} sensible(s)</span>
            <span className="tag tag--info">
              {summary.accessCount + summary.invitationCount} acces / invitation(s)
            </span>
            <span className="tag tag--muted">{summary.jobCount} evenement(s) offre</span>
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
          <p className="form-caption">
            {activeFilterCount} filtre(s) actif(s) pour isoler une timeline metier precise.
          </p>
        ) : (
          <p className="form-caption">
            Passez en tri prioritaire pour faire remonter d'abord les changements les plus sensibles.
          </p>
        )}
      </section>

      <section className="jobs-results">
        {filteredEvents.length > 0 ? (
          filteredEvents.map((event) => {
            const meta = getAdminAuditEventMeta(event);
            const chips = getAdminAuditEventDetailChips(event);

            return (
              <article key={event.id} className="panel job-card jobs-result-card">
                <div className="jobs-result-card__head">
                  <div className="jobs-result-card__badges">
                    <span className="tag">{getAdminAuditEntityTypeLabel(event.entity_type)}</span>
                    <span className={getToneClass(meta.tone)}>{meta.label}</span>
                    {meta.isSensitive ? <span className="tag tag--danger">A verifier</span> : null}
                  </div>
                  <small>{formatDisplayDate(event.created_at)}</small>
                </div>

                <h2>{event.entity_label}</h2>
                <p>{getAdminAuditEventSummary(event)}</p>
                <p className="form-caption">{meta.description}</p>

                <div className="job-card__meta">
                  <span>{event.actor_name}</span>
                  {event.actor_email ? <span>{event.actor_email}</span> : null}
                  <span>{getAdminAuditActionLabel(event.action)}</span>
                </div>

                {chips.length > 0 ? (
                  <div className="dashboard-card__badges">
                    {chips.map((chip) => (
                      <span key={chip} className="tag tag--muted">
                        {chip}
                      </span>
                    ))}
                  </div>
                ) : null}

                <div className="job-card__footer">
                  <small>{event.entity_id}</small>
                  {event.entity_href ? (
                    <Link href={event.entity_href}>Ouvrir la fiche</Link>
                  ) : (
                    <span className="tag tag--muted">Sans lien</span>
                  )}
                </div>
              </article>
            );
          })
        ) : (
          <article className="panel jobs-empty">
            <h2>Aucun evenement ne correspond a ces filtres</h2>
            <p>Elargissez les criteres pour retrouver une action, un acteur ou une fenetre temporelle plus large.</p>
          </article>
        )}
      </section>
    </div>
  );
}
