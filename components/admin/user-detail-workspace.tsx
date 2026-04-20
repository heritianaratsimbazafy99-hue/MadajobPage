import Link from "next/link";

import { UserAccessForm } from "@/components/admin/user-access-form";
import { DashboardShell } from "@/components/dashboard/shell";
import { formatDisplayDate } from "@/lib/format";
import type { ManagedUserDetail, OrganizationOption, Profile } from "@/lib/types";

type UserDetailWorkspaceProps = {
  profile: Profile;
  user: ManagedUserDetail;
  organizations: OrganizationOption[];
};

export function UserDetailWorkspace({
  profile,
  user,
  organizations
}: UserDetailWorkspaceProps) {
  return (
    <DashboardShell
      title={user.full_name || user.email || "Utilisateur Madajob"}
      description="Administrez les droits et visualisez l'activite rattachee a ce compte sans quitter la plateforme."
      profile={profile}
      currentPath="/app/admin/utilisateurs"
    >
      <section className="dashboard-grid dashboard-grid--four">
        <article className="panel metric-panel">
          <span>Role</span>
          <strong>{user.role}</strong>
          <small>{user.is_active ? "Compte actif" : "Compte inactif"}</small>
        </article>
        <article className="panel metric-panel">
          <span>Organisation</span>
          <strong>{user.organization_name || "Aucune"}</strong>
          <small>rattachement actuel</small>
        </article>
        <article className="panel metric-panel">
          <span>Candidatures</span>
          <strong>{user.applications_count}</strong>
          <small>flux lies a ce compte</small>
        </article>
        <article className="panel metric-panel">
          <span>Offres</span>
          <strong>{user.jobs_count}</strong>
          <small>annonces creees par cet utilisateur</small>
        </article>
      </section>

      <section className="dashboard-workspace">
        <div className="dashboard-column">
          <UserAccessForm adminProfile={profile} user={user} organizations={organizations} />

          {user.role === "candidat" ? (
            <div className="dashboard-form">
              <div className="dashboard-form__head">
                <div>
                  <p className="eyebrow">Vue candidat</p>
                  <h2>Elements de profil utiles au pilotage</h2>
                </div>
                <span className="tag">{user.candidate_profile_completion ?? 0}%</span>
              </div>

              <div className="job-card__meta">
                {user.email ? <span>{user.email}</span> : null}
                {user.phone ? <span>{user.phone}</span> : null}
                {user.city ? <span>{user.city}</span> : null}
                <span>{user.country}</span>
              </div>

              {user.headline ? <p>{user.headline}</p> : null}
              {user.bio ? <p className="form-caption">{user.bio}</p> : null}

              <div className="form-grid">
                <div className="document-card">
                  <strong>Poste actuel</strong>
                  <p>{user.current_position || "Non renseigne"}</p>
                </div>
                <div className="document-card">
                  <strong>Poste cible</strong>
                  <p>{user.desired_position || "Non renseigne"}</p>
                </div>
              </div>

              {user.skills_text ? (
                <div className="document-card">
                  <strong>Competences</strong>
                  <p>{user.skills_text}</p>
                </div>
              ) : null}

              <div className="dashboard-action-stack">
                <Link className="btn btn-secondary btn-block" href={`/app/admin/candidats/${user.id}`}>
                  Ouvrir la fiche candidat
                </Link>
              </div>
            </div>
          ) : null}

          {user.recent_applications.length > 0 ? (
            <div className="dashboard-form">
              <div className="dashboard-form__head">
                <div>
                  <p className="eyebrow">Activite candidature</p>
                  <h2>Derniers dossiers lies a ce compte</h2>
                </div>
                <span className="tag">{user.recent_applications.length} dossier(s)</span>
              </div>

              <div className="dashboard-list">
                {user.recent_applications.map((application) => (
                  <article key={application.id} className="panel list-card dashboard-card">
                    <div className="dashboard-card__top">
                      <h3>{application.job_title}</h3>
                      <span className="tag">{application.status}</span>
                    </div>
                    <div className="job-card__meta">
                      <span>{application.organization_name}</span>
                      <span>{application.job_location}</span>
                      <span>{application.contract_type}</span>
                    </div>
                    <div className="job-card__footer">
                      <small>Soumis le {formatDisplayDate(application.created_at)}</small>
                      <Link href={`/app/admin/candidatures/${application.id}`}>Ouvrir le dossier</Link>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ) : null}

          {user.recent_jobs.length > 0 ? (
            <div className="dashboard-form">
              <div className="dashboard-form__head">
                <div>
                  <p className="eyebrow">Activite offres</p>
                  <h2>Dernieres annonces creees</h2>
                </div>
                <span className="tag">{user.recent_jobs.length} offre(s)</span>
              </div>

              <div className="dashboard-list">
                {user.recent_jobs.map((job) => (
                  <article key={job.id} className="panel list-card dashboard-card">
                    <div className="dashboard-card__top">
                      <h3>{job.title}</h3>
                      <span className="tag">{job.status}</span>
                    </div>
                    <div className="job-card__meta">
                      <span>{job.location}</span>
                      <span>{job.contract_type}</span>
                      <span>{job.work_mode}</span>
                    </div>
                    <div className="job-card__footer">
                      <small>Creee le {formatDisplayDate(job.created_at)}</small>
                      <Link href={`/app/admin/offres/${job.id}`}>Ouvrir l'offre</Link>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <aside className="dashboard-column dashboard-column--aside">
          <div className="panel dashboard-sidecard">
            <p className="eyebrow">Controle</p>
            <h2>Pilotez les acces sans perdre le contexte.</h2>
            <div className="dashboard-action-stack">
              <Link className="btn btn-secondary btn-block" href="/app/admin/utilisateurs">
                Retour a la liste utilisateurs
              </Link>
              <Link className="btn btn-ghost btn-block" href="/app/admin">
                Retour au cockpit admin
              </Link>
            </div>
          </div>

          <div className="dashboard-form">
            <div className="dashboard-form__head">
              <div>
                <p className="eyebrow">Journal rapide</p>
                <h2>Repere temporel</h2>
              </div>
              <span className="tag">{user.role}</span>
            </div>

            <div className="document-card">
              <strong>Creation du compte</strong>
              <p>{formatDisplayDate(user.created_at)}</p>
            </div>

            <div className="document-card">
              <strong>Derniere mise a jour</strong>
              <p>{formatDisplayDate(user.updated_at)}</p>
            </div>

            <div className="document-card">
              <strong>Etat du compte</strong>
              <p>{user.is_active ? "Actif" : "Inactif"}</p>
            </div>
          </div>
        </aside>
      </section>
    </DashboardShell>
  );
}
