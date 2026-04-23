import Link from "next/link";
import { notFound } from "next/navigation";

import { DashboardShell } from "@/components/dashboard/shell";
import { JobApplyForm } from "@/components/jobs/job-apply-form";
import { MatchBreakdown } from "@/components/jobs/match-breakdown";
import { getApplicationStatusMeta } from "@/lib/application-status";
import { requireRole } from "@/lib/auth";
import { getCandidateProfileInsights } from "@/lib/candidate-profile";
import { buildCandidateJobOpportunities } from "@/lib/candidate-job-insights";
import { formatDateTimeDisplay, formatDisplayDate } from "@/lib/format";
import {
  getCandidateApplicationSummaries,
  getCandidateWorkspace,
  getPublicJobBySlug,
  getPublicJobs
} from "@/lib/jobs";

type CandidateJobDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

function splitDetailBlock(value: string | undefined) {
  return (value ?? "")
    .split(/\r?\n|•/g)
    .map((item) => item.trim())
    .filter(Boolean);
}

export default async function CandidateJobDetailPage({
  params
}: CandidateJobDetailPageProps) {
  const profile = await requireRole(["candidat"]);
  const { slug } = await params;
  const job = await getPublicJobBySlug(slug);

  if (!job) {
    notFound();
  }

  const [candidateProfile, applications, publicJobs] = await Promise.all([
    getCandidateWorkspace(profile),
    getCandidateApplicationSummaries(profile.id),
    getPublicJobs({ limit: 36, sort: "featured" })
  ]);

  const profileInsights = getCandidateProfileInsights(candidateProfile);
  const currentOpportunity =
    buildCandidateJobOpportunities([job], applications, candidateProfile)[0] ?? null;
  const application = currentOpportunity?.application ?? null;
  const applicationStatus = application ? getApplicationStatusMeta(application.status) : null;
  const relatedOpportunities = buildCandidateJobOpportunities(
    publicJobs.filter((entry) => entry.id !== job.id),
    applications,
    candidateProfile
  )
    .filter(
      (entry) =>
        entry.isAvailable &&
        (entry.job.sector === job.sector ||
          entry.job.location === job.location ||
          entry.match.score >= 60)
    )
    .slice(0, 3);

  const responsibilities = splitDetailBlock(job.responsibilities);
  const requirements = splitDetailBlock(job.requirements);
  const benefits = splitDetailBlock(job.benefits);

  return (
    <DashboardShell
      title={job.title}
      description="Consultez le poste en profondeur, comprenez votre niveau d'alignement et postulez directement depuis votre espace candidat."
      profile={profile}
      currentPath="/app/candidat/offres"
    >
      <section className="dashboard-grid dashboard-grid--four">
        <article className="panel metric-panel">
          <span>Compatibilite estimee</span>
          <strong>{currentOpportunity?.match.label ?? "A evaluer"}</strong>
          <small>
            {currentOpportunity?.match.hasSignal
              ? "matching calcule a partir de votre profil"
              : "profil encore trop leger pour un matching fiable"}
          </small>
        </article>
        <article className="panel metric-panel">
          <span>CV principal</span>
          <strong>{candidateProfile.primary_cv ? "Pret" : "A ajouter"}</strong>
          <small>
            {candidateProfile.primary_cv
              ? candidateProfile.primary_cv.file_name
              : "utile pour rattacher un CV a vos prochaines candidatures"}
          </small>
        </article>
        <article className="panel metric-panel">
          <span>Etat du dossier</span>
          <strong>{applicationStatus?.label ?? "Disponible"}</strong>
          <small>
            {application?.interview_signal.next_interview_at
              ? `entretien le ${formatDisplayDate(application.interview_signal.next_interview_at)}`
              : application
                ? `candidature envoyee le ${formatDisplayDate(application.created_at)}`
                : "aucune candidature sur cette offre"}
          </small>
        </article>
        <article className="panel metric-panel">
          <span>Publication</span>
          <strong>{formatDisplayDate(job.published_at)}</strong>
          <small>{job.is_featured ? "offre mise en avant" : "offre publiee"}</small>
        </article>
      </section>

      <section className="dashboard-workspace">
        <div className="dashboard-column">
          <article className="panel detail-card dashboard-card">
            <div className="dashboard-card__top">
              <p className="eyebrow">Offre active</p>
              <div className="dashboard-card__badges">
                <span className={`tag tag--${currentOpportunity?.match.tone ?? "muted"}`}>
                  {currentOpportunity?.match.label ?? "Offre disponible"}
                </span>
                <span className="tag">{job.is_featured ? "Mise en avant" : "Disponible"}</span>
              </div>
            </div>
            <h2>{job.title}</h2>
            <p className="page-hero__lead">{job.summary}</p>
            <div className="job-card__meta">
              {job.department ? <span>{job.department}</span> : null}
              <span>{job.location}</span>
              <span>{job.contract_type}</span>
              <span>{job.work_mode}</span>
              <span>{job.sector}</span>
            </div>
            <p className="detail-date">Publication : {formatDisplayDate(job.published_at)}</p>
          </article>

          <div className="dashboard-form">
            <div className="dashboard-form__head">
              <div>
                <p className="eyebrow">Lecture rapide</p>
                <h2>Pourquoi cette offre merite votre attention</h2>
              </div>
              <span className={`tag tag--${currentOpportunity?.match.tone ?? "muted"}`}>
                {currentOpportunity?.match.label ?? "Signal indisponible"}
              </span>
            </div>

            <div className="candidate-jobs-summary-grid">
              <article className="document-card candidate-jobs-summary-card">
                <strong>Signal de matching</strong>
                <p>
                  {currentOpportunity?.match.reason ??
                    "Completez votre profil pour obtenir une lecture plus fiable de l'alignement avec ce poste."}
                </p>
                {currentOpportunity?.match ? (
                  <MatchBreakdown match={currentOpportunity.match} compact showNextStep />
                ) : (
                  <small>Aucun mot clef fort detecte pour le moment.</small>
                )}
              </article>

              <article className="document-card candidate-jobs-summary-card">
                <strong>Readiness candidat</strong>
                <p>{profileInsights.readinessDescription}</p>
                <small>
                  {profileInsights.missingItems.length > 0
                    ? `${profileInsights.missingItems.length} element(s) prioritaire(s) peuvent encore renforcer votre dossier.`
                    : "Votre profil couvre deja les rubriques essentielles pour candidater."}
                </small>
              </article>

              <article className="document-card candidate-jobs-summary-card">
                <strong>Suite recommandee</strong>
                <p>
                  {application
                    ? applicationStatus?.candidateHint ??
                      "Le suivi de cette offre continue depuis votre dossier candidat."
                    : candidateProfile.primary_cv
                      ? "Vous pouvez candidater directement depuis cette page avec votre CV principal actuel."
                      : "Vous pouvez candidater maintenant, puis renforcer votre CV principal pour les prochaines opportunites."}
                </p>
                <small>
                  {application?.interview_signal.next_interview_at
                    ? `Prochain entretien le ${formatDateTimeDisplay(application.interview_signal.next_interview_at)}.`
                    : "Toutes les evolutions de ce poste resteront visibles dans votre espace candidat."}
                </small>
              </article>
            </div>
          </div>

          <div className="dashboard-form">
            <div className="dashboard-form__head">
              <div>
                <p className="eyebrow">Contenu du poste</p>
                <h2>Ce qu'il faut retenir avant de candidater</h2>
              </div>
              <span className="tag">{job.sector}</span>
            </div>

            <div className="candidate-job-detail-grid">
              <article className="document-card">
                <strong>Responsabilites</strong>
                {responsibilities.length > 0 ? (
                  <ul className="dashboard-mini-list dashboard-mini-list--compact">
                    {responsibilities.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p>Les missions detaillees seront precisees avec le recruteur au cours du processus.</p>
                )}
              </article>

              <article className="document-card">
                <strong>Profil recherche</strong>
                {requirements.length > 0 ? (
                  <ul className="dashboard-mini-list dashboard-mini-list--compact">
                    {requirements.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p>Le resume de l'offre couvre deja l'essentiel. Appuyez-vous sur le matching pour evaluer la proximite avec votre profil.</p>
                )}
              </article>

              <article className="document-card">
                <strong>Avantages et cadre</strong>
                {benefits.length > 0 ? (
                  <ul className="dashboard-mini-list dashboard-mini-list--compact">
                    {benefits.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p>Les avantages du poste n'ont pas encore ete detailles publiquement sur cette offre.</p>
                )}
              </article>
            </div>
          </div>

          {relatedOpportunities.length > 0 ? (
            <div className="dashboard-section">
              <div className="dashboard-section__head">
                <div>
                  <p className="eyebrow">Opportunites proches</p>
                  <h2>Autres offres a garder en vue</h2>
                </div>
                <Link className="text-link" href="/app/candidat/offres">
                  Retour a la liste des offres
                </Link>
              </div>

              <div className="dashboard-list">
                {relatedOpportunities.map((entry) => (
                  <article key={entry.job.id} className="panel list-card dashboard-card">
                    <div className="dashboard-card__top">
                      <div>
                        <h3>{entry.job.title}</h3>
                        <p>{entry.job.organization_name || "Madajob"}</p>
                      </div>
                      <span className={`tag tag--${entry.match.tone}`}>{entry.match.label}</span>
                    </div>
                    <p>{entry.match.reason}</p>
                    <MatchBreakdown match={entry.match} compact />
                    <div className="job-card__meta">
                      <span>{entry.job.location}</span>
                      <span>{entry.job.contract_type}</span>
                      <span>{entry.job.work_mode}</span>
                      <span>{entry.job.sector}</span>
                    </div>
                    <div className="job-card__footer">
                      <small>Publie le {formatDisplayDate(entry.job.published_at)}</small>
                      <Link href={`/app/candidat/offres/${entry.job.slug}`}>Voir l'offre</Link>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <aside className="dashboard-column dashboard-column--aside">
          {application ? (
            <div className="panel dashboard-sidecard detail-side-card__stack">
              <p className="eyebrow">Candidature envoyee</p>
              <h2>Vous avez deja postule a cette offre.</h2>
              <p>Statut actuel : {applicationStatus?.label ?? application.status}</p>
              {applicationStatus ? <p>{applicationStatus.description}</p> : null}
              <p>Soumis le {formatDisplayDate(application.created_at)}</p>
              {application.interview_signal.next_interview_at ? (
                <div className="document-card">
                  <strong>Prochain entretien</strong>
                  <p>{formatDateTimeDisplay(application.interview_signal.next_interview_at)}</p>
                  <small>
                    Retrouvez tous les details du rendez-vous dans votre dossier candidat.
                  </small>
                </div>
              ) : null}
              <div className="dashboard-action-stack">
                <Link
                  className="btn btn-primary btn-block"
                  href={`/app/candidat/candidatures/${application.id}`}
                >
                  Ouvrir mon dossier
                </Link>
                <Link className="btn btn-secondary btn-block" href="/app/candidat/candidatures">
                  Voir toutes mes candidatures
                </Link>
                <Link className="btn btn-ghost btn-block" href="/app/candidat/offres">
                  Retour a la liste des offres
                </Link>
              </div>
            </div>
          ) : (
            <JobApplyForm
              jobId={job.id}
              jobSlug={job.slug}
              primaryCvName={candidateProfile.primary_cv?.file_name ?? null}
              matchLabel={currentOpportunity?.match.label ?? null}
              matchReason={currentOpportunity?.match.reason ?? null}
              profileReadinessLabel={profileInsights.readinessLabel}
              profileReadinessDescription={profileInsights.readinessDescription}
            />
          )}

          <div className="panel dashboard-sidecard">
            <p className="eyebrow">Navigation</p>
            <h2>Continuez depuis votre espace candidat.</h2>
            <div className="dashboard-action-stack">
              <Link className="btn btn-secondary btn-block" href="/app/candidat/offres">
                Retour a la liste des offres
              </Link>
              <Link className="btn btn-secondary btn-block" href="/app/candidat/candidatures">
                Voir mes candidatures
              </Link>
              <Link className="btn btn-secondary btn-block" href="/app/candidat">
                Retour au cockpit candidat
              </Link>
            </div>
          </div>
        </aside>
      </section>
    </DashboardShell>
  );
}
