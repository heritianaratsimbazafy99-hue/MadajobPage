import Link from "next/link";

import { DashboardShell } from "@/components/dashboard/shell";
import { CandidateCvUpload } from "@/components/profile/candidate-cv-upload";
import { CandidateProfileForm } from "@/components/profile/candidate-profile-form";
import {
  getApplicationStatusMeta,
  isFinalApplicationStatus
} from "@/lib/application-status";
import { getCandidateProfileInsights } from "@/lib/candidate-profile";
import { requireRole } from "@/lib/auth";
import { formatDisplayDate } from "@/lib/format";
import {
  getCandidateApplications,
  getCandidateWorkspace
} from "@/lib/jobs";

export default async function CandidateDashboardPage() {
  const profile = await requireRole(["candidat"]);
  const applications = await getCandidateApplications(profile.id);
  const candidateProfile = await getCandidateWorkspace(profile);
  const profileInsights = getCandidateProfileInsights(candidateProfile);
  const latestApplication = applications[0];
  const activeApplicationsCount = applications.filter(
    (application) => !isFinalApplicationStatus(application.status)
  ).length;
  const latestApplicationStatus = latestApplication
    ? getApplicationStatusMeta(latestApplication.status)
    : null;

  return (
    <DashboardShell
      title="Votre espace candidat"
      description="Retrouvez votre profil, votre CV principal et le suivi de vos candidatures dans un espace de travail dedie."
      profile={profile}
      currentPath="/app/candidat"
    >
      <section className="dashboard-grid dashboard-grid--four">
        <article className="panel metric-panel">
          <span>Candidatures actives</span>
          <strong>{activeApplicationsCount}</strong>
          <small>
            {applications.length > 0
              ? `${applications.length} dossier(s) visible(s) dans votre suivi`
              : "aucune candidature en cours"}
          </small>
        </article>
        <article className="panel metric-panel">
          <span>Profil</span>
          <strong>{profileInsights.completion}%</strong>
          <small>
            {profileInsights.completedCount}/{profileInsights.totalCount} rubriques prioritaires
          </small>
        </article>
        <article className="panel metric-panel">
          <span>CV principal</span>
          <strong>{candidateProfile.primary_cv ? "Actif" : "Absent"}</strong>
          <small>
            {candidateProfile.primary_cv
              ? candidateProfile.primary_cv.file_name
              : "televersez votre CV pour l'attacher a vos prochaines candidatures"}
          </small>
        </article>
        <article className="panel metric-panel">
          <span>Derniere action</span>
          <strong>{latestApplicationStatus ? latestApplicationStatus.label : "Aucune"}</strong>
          <small>{latestApplication ? formatDisplayDate(latestApplication.created_at) : "postulez a une offre pour demarrer"}</small>
        </article>
      </section>

      <section className="dashboard-workspace">
        <div className="dashboard-column">
          <div className="dashboard-section">
            <div className="dashboard-section__head">
              <div>
                <p className="eyebrow">Candidatures</p>
                <h2>Suivi recent</h2>
              </div>
              <Link className="text-link" href="/app/candidat/candidatures">
                Voir toutes mes candidatures
              </Link>
            </div>

            <div className="dashboard-list">
              {applications.length > 0 ? (
                applications.map((application) => {
                  const status = getApplicationStatusMeta(application.status);

                  return (
                    <article key={application.id} className="panel list-card dashboard-card">
                      <div className="dashboard-card__top">
                        <div>
                          <h3>{application.job_title}</h3>
                          <p>{application.organization_name || "Organisation"}</p>
                        </div>
                        <span className="tag">{status.label}</span>
                      </div>
                      <p>{status.description}</p>
                      <div className="job-card__meta">
                        <span>Soumis le {formatDisplayDate(application.created_at)}</span>
                      </div>
                      <div className="job-card__footer">
                        <small>{status.candidateHint}</small>
                        <Link href={`/app/candidat/candidatures/${application.id}`}>
                          Ouvrir le dossier
                        </Link>
                      </div>
                    </article>
                  );
                })
              ) : (
                <article className="panel list-card dashboard-card dashboard-card--empty">
                  <h3>Aucune candidature pour le moment</h3>
                  <p>Commencez par explorer les offres disponibles et deposez votre premiere candidature depuis la plateforme.</p>
                </article>
              )}
            </div>
          </div>
        </div>

        <aside className="dashboard-column dashboard-column--aside">
          <CandidateCvUpload
            candidateId={profile.id}
            currentDocument={candidateProfile.primary_cv}
            recentDocuments={candidateProfile.recent_documents}
          />

          <CandidateProfileForm profile={candidateProfile} />

          <div className="panel dashboard-sidecard">
            <p className="eyebrow">Etat du dossier</p>
            <h2>{profileInsights.readinessLabel}</h2>
            <p className="form-caption">{profileInsights.readinessDescription}</p>
            <ul className="dashboard-mini-list">
              {profileInsights.nextActions.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <div className="dashboard-action-stack">
              <Link className="btn btn-primary btn-block" href="/app/candidat/offres">
                Explorer les offres
              </Link>
              <Link className="btn btn-secondary btn-block" href="/app/candidat/candidatures">
                Voir mes candidatures
              </Link>
              <Link className="btn btn-secondary btn-block" href="/espace/candidat">
                Voir le parcours candidat
              </Link>
            </div>
          </div>
        </aside>
      </section>
    </DashboardShell>
  );
}
