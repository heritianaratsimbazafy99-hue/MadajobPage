"use client";

import Link from "next/link";
import { useDeferredValue, useEffect, useMemo, useState, useTransition } from "react";

import { quickUpdateUserStatusAction } from "@/app/actions/admin-actions";
import { formatDisplayDate } from "@/lib/format";
import type { ManagedUserSummary, OrganizationOption } from "@/lib/types";

type AdminUsersBoardProps = {
  adminProfileId: string;
  users: ManagedUserSummary[];
  organizations: OrganizationOption[];
};

type Filters = {
  query: string;
  role: string;
  organizationId: string;
  status: string;
  focus:
    | ""
    | "internal"
    | "inactive_accounts"
    | "inactive_internal"
    | "recruiters_without_org"
    | "candidates_to_review";
  sort:
    | "recent"
    | "oldest"
    | "applications_desc"
    | "jobs_desc"
    | "completion_desc"
    | "name_asc";
};

const initialFilters: Filters = {
  query: "",
  role: "",
  organizationId: "",
  status: "",
  focus: "",
  sort: "recent"
};

export function AdminUsersBoard({
  adminProfileId,
  users,
  organizations
}: AdminUsersBoardProps) {
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [boardUsers, setBoardUsers] = useState(users);
  const [feedback, setFeedback] = useState<{
    kind: "success" | "error";
    message: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();
  const deferredQuery = useDeferredValue(filters.query);

  useEffect(() => {
    setBoardUsers(users);
    setFeedback(null);
  }, [users]);

  const filteredUsers = useMemo(() => {
    const query = deferredQuery.trim().toLowerCase();

    return boardUsers
      .filter((user) => {
        const matchesQuery =
          !query ||
          [
            user.full_name,
            user.email,
            user.organization_name,
            user.current_position,
            user.headline,
            user.city,
            user.phone
          ]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(query));

        const matchesRole = !filters.role || user.role === filters.role;
        const matchesOrganization =
          !filters.organizationId || user.organization_id === filters.organizationId;
        const matchesStatus =
          !filters.status ||
          (filters.status === "active" ? user.is_active : !user.is_active);
        const matchesFocus =
          !filters.focus ||
          (filters.focus === "internal" && user.role !== "candidat") ||
          (filters.focus === "inactive_accounts" && !user.is_active) ||
          (filters.focus === "inactive_internal" &&
            user.role !== "candidat" &&
            !user.is_active) ||
          (filters.focus === "recruiters_without_org" &&
            user.role === "recruteur" &&
            !user.organization_id) ||
          (filters.focus === "candidates_to_review" &&
            user.role === "candidat" &&
            ((user.candidate_profile_completion ?? 0) < 70 ||
              user.applications_count === 0));

        return (
          matchesQuery &&
          matchesRole &&
          matchesOrganization &&
          matchesStatus &&
          matchesFocus
        );
      })
      .sort((left, right) => {
        if (filters.sort === "applications_desc" && left.applications_count !== right.applications_count) {
          return right.applications_count - left.applications_count;
        }

        if (filters.sort === "jobs_desc" && left.jobs_count !== right.jobs_count) {
          return right.jobs_count - left.jobs_count;
        }

        if (
          filters.sort === "completion_desc" &&
          (left.candidate_profile_completion ?? -1) !== (right.candidate_profile_completion ?? -1)
        ) {
          return (right.candidate_profile_completion ?? -1) - (left.candidate_profile_completion ?? -1);
        }

        if (filters.sort === "name_asc") {
          const leftLabel = left.full_name || left.email || "Utilisateur";
          const rightLabel = right.full_name || right.email || "Utilisateur";

          return leftLabel.localeCompare(rightLabel, "fr");
        }

        const leftDate = new Date(left.updated_at || left.created_at).getTime();
        const rightDate = new Date(right.updated_at || right.created_at).getTime();

        if (filters.sort === "oldest") {
          return leftDate - rightDate;
        }

        return rightDate - leftDate;
      });
  }, [
    boardUsers,
    deferredQuery,
    filters.focus,
    filters.organizationId,
    filters.role,
    filters.sort,
    filters.status
  ]);

  const activeFilterCount = [
    filters.query,
    filters.role,
    filters.organizationId,
    filters.status,
    filters.focus,
    filters.sort !== "recent" ? filters.sort : ""
  ].filter(Boolean).length;

  async function handleQuickStatusToggle(userId: string, nextIsActive: boolean) {
    const previousUser = boardUsers.find((user) => user.id === userId);

    if (!previousUser || previousUser.is_active === nextIsActive || isPending) {
      return;
    }

    setBoardUsers((current) =>
      current.map((user) =>
        user.id === userId
          ? {
              ...user,
              is_active: nextIsActive,
              updated_at: new Date().toISOString()
            }
          : user
      )
    );
    setFeedback(null);

    startTransition(() => {
      void quickUpdateUserStatusAction(userId, nextIsActive)
        .then((result) => {
          if (result.status === "error") {
            setBoardUsers((current) =>
              current.map((user) => (user.id === userId ? previousUser : user))
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
          setBoardUsers((current) =>
            current.map((user) => (user.id === userId ? previousUser : user))
          );
          setFeedback({
            kind: "error",
            message: "La mise a jour rapide du compte a echoue. Reessayez."
          });
        });
    });
  }

  return (
    <div className="jobs-board">
      <section className="dashboard-form">
        <div className="dashboard-form__head">
          <div>
            <p className="eyebrow">Utilisateurs & droits</p>
            <h2>Priorisez les activations, les rattachements et les comptes a surveiller</h2>
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
              <option value="internal">Comptes internes</option>
              <option value="inactive_accounts">Comptes inactifs</option>
              <option value="inactive_internal">Internes inactifs</option>
              <option value="recruiters_without_org">Recruteurs sans organisation</option>
              <option value="candidates_to_review">Candidats a revoir</option>
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
              <option value="applications_desc">Plus de candidatures</option>
              <option value="jobs_desc">Plus d'offres</option>
              <option value="completion_desc">Profil le plus complet</option>
              <option value="name_asc">Nom A-Z</option>
              <option value="oldest">Plus anciens</option>
            </select>
          </label>
        </div>

        <div className="dashboard-card__top">
          <div className="dashboard-card__badges">
            <span className="tag tag--success">
              {boardUsers.filter((user) => user.is_active).length} actif(s)
            </span>
            <span className="tag tag--muted">
              {boardUsers.filter((user) => !user.is_active).length} inactif(s)
            </span>
            <span className="tag tag--info">
              {boardUsers.filter((user) => user.role !== "candidat").length} interne(s)
            </span>
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
            {activeFilterCount} filtre(s) actif(s) pour isoler les comptes prioritaires.
          </p>
        ) : null}

        {feedback ? (
          <p className={feedback.kind === "error" ? "form-feedback form-feedback--error" : "form-feedback"}>
            {feedback.message}
          </p>
        ) : null}
      </section>

      <section className="jobs-results">
        {filteredUsers.length > 0 ? (
          filteredUsers.map((user) => {
            const isSelf = user.id === adminProfileId;
            const isReactivationBlocked =
              !user.is_active && user.role === "recruteur" && !user.organization_id;

            return (
              <article key={user.id} className="panel job-card jobs-result-card">
                <div className="jobs-result-card__head">
                  <div className="dashboard-card__badges">
                    <span className="tag">{user.role}</span>
                    <span className={`tag ${user.is_active ? "tag--success" : "tag--muted"}`}>
                      {user.is_active ? "Actif" : "Inactif"}
                    </span>
                    {user.role === "recruteur" && !user.organization_id ? (
                      <span className="tag tag--danger">Sans organisation</span>
                    ) : null}
                    {user.role === "candidat" &&
                    (user.candidate_profile_completion ?? 0) < 70 ? (
                      <span className="tag tag--muted">Profil a completer</span>
                    ) : null}
                  </div>
                  <small>Mise a jour le {formatDisplayDate(user.updated_at)}</small>
                </div>

                <h2>{user.full_name || user.email || "Utilisateur Madajob"}</h2>
                <p>
                  {user.organization_name ||
                    (user.role === "candidat"
                      ? "Compte candidat sans organisation rattachee"
                      : "Sans organisation rattachee")}
                </p>

                <div className="job-card__meta">
                  {user.email ? <span>{user.email}</span> : null}
                  {user.phone ? <span>{user.phone}</span> : null}
                  {user.city ? <span>{user.city}</span> : null}
                  <span>{user.jobs_count} offre(s)</span>
                  <span>{user.applications_count} candidature(s)</span>
                  {user.role === "candidat" ? (
                    <span>{user.candidate_profile_completion ?? 0}% profil</span>
                  ) : null}
                </div>

                <div className="job-card__footer">
                  <small>
                    {isReactivationBlocked
                      ? "Rattachez une organisation avant reactivation"
                      : `Cree le ${formatDisplayDate(user.created_at)}`}
                  </small>
                  <div className="dashboard-card__badges">
                    {isSelf ? (
                      <span className="tag tag--info">Votre compte</span>
                    ) : (
                      <button
                        type="button"
                        className={user.is_active ? "btn btn-ghost" : "btn btn-primary"}
                        disabled={isPending || isReactivationBlocked}
                        onClick={() => void handleQuickStatusToggle(user.id, !user.is_active)}
                      >
                        {user.is_active ? "Desactiver" : "Reactiver"}
                      </button>
                    )}
                    <Link href={`/app/admin/utilisateurs/${user.id}`}>Ouvrir la fiche</Link>
                  </div>
                </div>
              </article>
            );
          })
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
