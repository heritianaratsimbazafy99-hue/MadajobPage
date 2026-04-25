import Link from "next/link";

import { DashboardShell } from "@/components/dashboard/shell";
import { CandidateProfileForm } from "@/components/profile/candidate-profile-form";
import { enrichCandidateProfileWithCvText } from "@/lib/candidate-cv-text";
import { getCandidateProfileInsights } from "@/lib/candidate-profile";
import { requireRole } from "@/lib/auth";
import { getCandidateWorkspace } from "@/lib/jobs";

export default async function CandidateProfilePage() {
  const profile = await requireRole(["candidat"]);
  const rawCandidateProfile = await getCandidateWorkspace(profile);
  const candidateProfile = await enrichCandidateProfileWithCvText(profile, rawCandidateProfile);
  const profileInsights = getCandidateProfileInsights(candidateProfile);

  return (
    <DashboardShell
      title="Profil candidat"
      description="Renseignez votre identite, votre cible et vos preferences dans un espace dedie, plus clair que le tableau de bord."
      profile={profile}
      currentPath="/app/candidat/profil"
    >
      <section className="candidate-profile-workspace">
        <aside className="candidate-profile-rail">
          <div className="panel dashboard-sidecard candidate-profile-progress-card">
            <p className="eyebrow">Avancement</p>
            <div className="candidate-profile-progress-card__meter">
              <strong>{profileInsights.completion}%</strong>
              <span>profil complete</span>
            </div>
            <div className="job-quality-meter" aria-hidden="true">
              <span style={{ width: `${profileInsights.completion}%` }} />
            </div>
            <p className="form-caption">{profileInsights.readinessDescription}</p>
          </div>

          <div className="panel dashboard-sidecard">
            <p className="eyebrow">Parcours conseille</p>
            <h2>Renseignez d'abord ce qui debloque le matching.</h2>
            <ul className="dashboard-mini-list">
              {profileInsights.nextActions.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="panel dashboard-sidecard">
            <p className="eyebrow">Raccourcis</p>
            <div className="dashboard-action-stack">
              <Link className="btn btn-secondary btn-block" href="/app/candidat/documents">
                Gerer mes CV
              </Link>
              <Link className="btn btn-secondary btn-block" href="/app/candidat/alertes">
                Ajuster mes alertes
              </Link>
              <Link className="btn btn-secondary btn-block" href="/app/candidat">
                Retour au tableau de bord
              </Link>
            </div>
          </div>
        </aside>

        <div className="candidate-profile-main">
          <CandidateProfileForm profile={candidateProfile} />
        </div>
      </section>
    </DashboardShell>
  );
}
