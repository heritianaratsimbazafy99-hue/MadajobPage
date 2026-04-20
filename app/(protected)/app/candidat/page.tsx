import Link from "next/link";

import { DashboardShell } from "@/components/dashboard/shell";
import { CandidateCvUpload } from "@/components/profile/candidate-cv-upload";
import { CandidateProfileForm } from "@/components/profile/candidate-profile-form";
import { requireRole } from "@/lib/auth";
import { formatDisplayDate } from "@/lib/format";
import {
  getCandidateApplications,
  getCandidateWorkspace
} from "@/lib/jobs";

const candidateChecklist = [
  "Completer le profil pour etre plus facilement identifie par les recruteurs.",
  "Centraliser votre CV principal et vos prochaines candidatures.",
  "Suivre les retours sans repasser par la vitrine institutionnelle."
];

export default async function CandidateDashboardPage() {
  const profile = await requireRole(["candidat"]);
  const applications = await getCandidateApplications(profile.id);
  const candidateProfile = await getCandidateWorkspace(profile);
  const latestApplication = applications[0];

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
          <strong>{applications.length}</strong>
          <small>{applications.length > 0 ? "dossiers visibles dans votre suivi" : "aucune candidature en cours"}</small>
        </article>
        <article className="panel metric-panel">
          <span>Profil</span>
          <strong>{candidateProfile.profile_completion}%</strong>
          <small>{candidateProfile.profile_completion > 0 ? "taux de completion actuel" : "completez votre dossier"}</small>
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
          <strong>{latestApplication ? latestApplication.status : "Aucune"}</strong>
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
              <Link className="text-link" href="/app/candidat/offres">
                Voir toutes les offres
              </Link>
            </div>

            <div className="dashboard-list">
              {applications.length > 0 ? (
                applications.map((application) => (
                  <article key={application.id} className="panel list-card dashboard-card">
                    <div className="dashboard-card__top">
                      <h3>{application.job_title}</h3>
                      <span className="tag">{application.status}</span>
                    </div>
                    <p>{application.organization_name || "Organisation"}</p>
                    <div className="job-card__meta">
                      <span>Soumis le {formatDisplayDate(application.created_at)}</span>
                    </div>
                  </article>
                ))
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
          />

          <CandidateProfileForm profile={candidateProfile} />

          <div className="panel dashboard-sidecard">
            <p className="eyebrow">Prochaines etapes</p>
            <h2>Gardez votre dossier actif.</h2>
            <ul className="dashboard-mini-list">
              {candidateChecklist.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <div className="dashboard-action-stack">
              <Link className="btn btn-primary btn-block" href="/app/candidat/offres">
                Explorer les offres
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
