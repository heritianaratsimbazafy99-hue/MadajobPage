"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";

import { formatDisplayDate } from "@/lib/format";
import type { ManagedUserSummary, OrganizationOption } from "@/lib/types";

type AdminUsersBoardProps = {
  users: ManagedUserSummary[];
  organizations: OrganizationOption[];
};

type Filters = {
  query: string;
  role: string;
  organizationId: string;
  status: string;
};

const initialFilters: Filters = {
  query: "",
  role: "",
  organizationId: "",
  status: ""
};

export function AdminUsersBoard({ users, organizations }: AdminUsersBoardProps) {
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const deferredQuery = useDeferredValue(filters.query);

  const filteredUsers = useMemo(() => {
    const query = deferredQuery.trim().toLowerCase();

    return users.filter((user) => {
      const matchesQuery =
        !query ||
        [user.full_name, user.email, user.organization_name, user.current_position, user.headline]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));

      const matchesRole = !filters.role || user.role === filters.role;
      const matchesOrganization =
        !filters.organizationId || user.organization_id === filters.organizationId;
      const matchesStatus =
        !filters.status ||
        (filters.status === "active" ? user.is_active : !user.is_active);

      return matchesQuery && matchesRole && matchesOrganization && matchesStatus;
    });
  }, [deferredQuery, filters.organizationId, filters.role, filters.status, users]);

  return (
    <div className="jobs-board">
      <section className="dashboard-form">
        <div className="dashboard-form__head">
          <div>
            <p className="eyebrow">Utilisateurs & droits</p>
            <h2>Pilotez les acces plateforme par role, organisation et statut</h2>
          </div>
          <span className="tag">{filteredUsers.length} utilisateur(s)</span>
        </div>

        <div className="form-grid">
          <label className="field field--full">
            <span>Recherche</span>
            <input
              value={filters.query}
              onChange={(event) =>
                setFilters((previous) => ({ ...previous, query: event.target.value }))
              }
              placeholder="Nom, email, organisation, poste..."
            />
          </label>

          <label className="field">
            <span>Role</span>
            <select
              value={filters.role}
              onChange={(event) =>
                setFilters((previous) => ({ ...previous, role: event.target.value }))
              }
            >
              <option value="">Tous les roles</option>
              <option value="candidat">Candidat</option>
              <option value="recruteur">Recruteur</option>
              <option value="admin">Admin</option>
            </select>
          </label>

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
              {organizations.map((organization) => (
                <option key={organization.id} value={organization.id}>
                  {organization.name}
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
              <option value="">Tous</option>
              <option value="active">Actifs</option>
              <option value="inactive">Inactifs</option>
            </select>
          </label>
        </div>
      </section>

      <section className="jobs-results">
        {filteredUsers.length > 0 ? (
          filteredUsers.map((user) => (
            <article key={user.id} className="panel job-card jobs-result-card">
              <div className="jobs-result-card__head">
                <span className="tag">{user.role}</span>
                <small>{user.is_active ? "Compte actif" : "Compte desactive"}</small>
              </div>

              <h2>{user.full_name || user.email || "Utilisateur Madajob"}</h2>
              <p>{user.organization_name || "Sans organisation rattachee"}</p>

              <div className="job-card__meta">
                {user.email ? <span>{user.email}</span> : null}
                {user.city ? <span>{user.city}</span> : null}
                <span>{user.jobs_count} offre(s)</span>
                <span>{user.applications_count} candidature(s)</span>
              </div>

              <div className="job-card__footer">
                <small>Mise a jour le {formatDisplayDate(user.updated_at)}</small>
                <Link href={`/app/admin/utilisateurs/${user.id}`}>Ouvrir la fiche</Link>
              </div>
            </article>
          ))
        ) : (
          <article className="panel jobs-empty">
            <h2>Aucun utilisateur ne correspond a ces filtres</h2>
            <p>Elargissez les criteres pour retrouver le bon compte.</p>
          </article>
        )}
      </section>
    </div>
  );
}
