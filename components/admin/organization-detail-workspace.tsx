import Link from "next/link";

import { OrganizationAccessForm } from "@/components/admin/organization-access-form";
import { DashboardShell } from "@/components/dashboard/shell";
import { formatDisplayDate } from "@/lib/format";
import type { ManagedOrganizationDetail, Profile } from "@/lib/types";

type OrganizationDetailWorkspaceProps = {
  profile: Profile;
  organization: ManagedOrganizationDetail;
};

export function OrganizationDetailWorkspace({
  profile,
  organization
}: OrganizationDetailWorkspaceProps) {
  return (
    <DashboardShell
      title={organization.name}
      description="Pilotez une organisation, ses recruteurs, ses offres et ses volumes sans quitter le cockpit admin."
      profile={profile}
      currentPath="/app/admin/organisations"
    >
      <section className="dashboard-grid dashboard-grid--four">
        <article className="panel metric-panel">
          <span>Statut</span>
          <strong>{organization.is_active ? "Active" : "Inactive"}</strong>
          <small>{organization.kind}</small>
        </article>
        <article className="panel metric-panel">
          <span>Membres</span>
          <strong>{organization.members_count}</strong>
          <small>{organization.recruiters_count} recruteur(s)</small>
        </article>
        <article className="panel metric-panel">
          <span>Offres actives</span>
          <strong>{organization.active_jobs_count}</strong>
          <small>annonces actuellement publiees</small>
        </article>
        <article className="panel metric-panel">
          <span>Candidatures</span>
          <strong>{organization.applications_count}</strong>
          <small>{organization.shortlist_count} dossier(s) avances</small>
        </article>
      </section>

      <section className="dashboard-workspace">
        <div className="dashboard-column">
          <OrganizationAccessForm organization={organization} />

          <div className="dashboard-form">
            <div className="dashboard-form__head">
              <div>
                <p className="eyebrow">Utilisateurs rattaches</p>
                <h2>Comptes relies a cette organisation</h2>
              </div>
              <span className="tag">{organization.members.length} membre(s)</span>
            </div>

            <div className="dashboard-list">
              {organization.members.length > 0 ? (
                organization.members.map((member) => (
                  <article key={member.id} className="panel list-card dashboard-card">
                    <div className="dashboard-card__top">
                      <h3>{member.full_name || member.email || "Utilisateur Madajob"}</h3>
                      <span className="tag">{member.role}</span>
                    </div>
                    <div className="job-card__meta">
                      {member.email ? <span>{member.email}</span> : null}
                      {member.city ? <span>{member.city}</span> : null}
                      <span>{member.jobs_count} offre(s)</span>
                      <span>{member.applications_count} candidature(s)</span>
                    </div>
                    <div className="job-card__footer">
                      <small>{member.is_active ? "Compte actif" : "Compte inactif"}</small>
                      <Link href={`/app/admin/utilisateurs/${member.id}`}>Ouvrir la fiche</Link>
                    </div>
                  </article>
                ))
              ) : (
                <article className="panel list-card dashboard-card dashboard-card--empty">
                  <h3>Aucun membre rattache</h3>
                  <p>Les comptes admin ou recruteur lies a cette organisation apparaitront ici.</p>
                </article>
              )}
            </div>
          </div>

          <div className="dashboard-form">
            <div className="dashboard-form__head">
              <div>
                <p className="eyebrow">Offres recentes</p>
                <h2>Dernieres annonces de l&apos;organisation</h2>
              </div>
              <span className="tag">{organization.recent_jobs.length} offre(s)</span>
            </div>

            <div className="dashboard-list">
              {organization.recent_jobs.length > 0 ? (
                organization.recent_jobs.map((job) => (
                  <article key={job.id} className="panel list-card dashboard-card">
                    <div className="dashboard-card__top">
                      <h3>{job.title}</h3>
                      <span className="tag">{job.status}</span>
                    </div>
                    <div className="job-card__meta">
                      <span>{job.location}</span>
                      <span>{job.contract_type}</span>
                      <span>{job.work_mode}</span>
                      <span>{job.applications_count} candidature(s)</span>
                    </div>
                    <div className="job-card__footer">
                      <small>Creee le {formatDisplayDate(job.created_at)}</small>
                      <Link href={`/app/admin/offres/${job.id}`}>Ouvrir l&apos;offre</Link>
                    </div>
                  </article>
                ))
              ) : (
                <article className="panel list-card dashboard-card dashboard-card--empty">
                  <h3>Aucune offre recente</h3>
                  <p>Les prochaines annonces publiees ou brouillons de cette organisation apparaitront ici.</p>
                </article>
              )}
            </div>
          </div>

          <div className="dashboard-form">
            <div className="dashboard-form__head">
              <div>
                <p className="eyebrow">Candidatures recentes</p>
                <h2>Derniers dossiers remontes sur cette organisation</h2>
              </div>
              <span className="tag">{organization.recent_applications.length} dossier(s)</span>
            </div>

            <div className="dashboard-list">
              {organization.recent_applications.length > 0 ? (
                organization.recent_applications.map((application) => (
                  <article key={application.id} className="panel list-card dashboard-card">
                    <div className="dashboard-card__top">
                      <h3>{application.candidate_name}</h3>
                      <span className="tag">{application.status}</span>
                    </div>
                    <p>{application.job_title}</p>
                    <div className="job-card__meta">
                      <span>{application.candidate_email}</span>
                      <span>{application.job_location}</span>
                      <span>{application.has_cv ? "CV joint" : "CV non joint"}</span>
                    </div>
                    <div className="job-card__footer">
                      <small>Soumis le {formatDisplayDate(application.created_at)}</small>
                      <Link href={`/app/admin/candidatures/${application.id}`}>Ouvrir le dossier</Link>
                    </div>
                  </article>
                ))
              ) : (
                <article className="panel list-card dashboard-card dashboard-card--empty">
                  <h3>Aucune candidature recente</h3>
                  <p>Les dossiers lies aux offres de cette organisation apparaitront ici.</p>
                </article>
              )}
            </div>
          </div>
        </div>

        <aside className="dashboard-column dashboard-column--aside">
          <div className="panel dashboard-sidecard">
            <p className="eyebrow">Navigation</p>
            <h2>Gardez le contexte organisation sous la main.</h2>
            <div className="dashboard-action-stack">
              <Link className="btn btn-secondary btn-block" href="/app/admin/organisations">
                Retour aux organisations
              </Link>
              <Link className="btn btn-ghost btn-block" href="/app/admin/utilisateurs">
                Ouvrir les utilisateurs
              </Link>
              <Link className="btn btn-ghost btn-block" href="/app/admin/reporting">
                Ouvrir le reporting
              </Link>
            </div>
          </div>

          <div className="dashboard-form">
            <div className="dashboard-form__head">
              <div>
                <p className="eyebrow">Repere rapide</p>
                <h2>Cadence de l&apos;organisation</h2>
              </div>
              <span className="tag">{organization.slug}</span>
            </div>

            <div className="document-card">
              <strong>Derniere offre</strong>
              <p>
                {organization.latest_job_at
                  ? formatDisplayDate(organization.latest_job_at)
                  : "Aucune offre"}
              </p>
            </div>

            <div className="document-card">
              <strong>Derniere candidature</strong>
              <p>
                {organization.latest_application_at
                  ? formatDisplayDate(organization.latest_application_at)
                  : "Aucune candidature"}
              </p>
            </div>

            <div className="document-card">
              <strong>Shortlist</strong>
              <p>{organization.shortlist_count} dossier(s) avances</p>
            </div>
          </div>
        </aside>
      </section>
    </DashboardShell>
  );
}
