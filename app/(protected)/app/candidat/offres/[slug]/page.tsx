import Link from "next/link";
import { notFound } from "next/navigation";

import { DashboardShell } from "@/components/dashboard/shell";
import { JobApplyForm } from "@/components/jobs/job-apply-form";
import { requireRole } from "@/lib/auth";
import { formatDisplayDate } from "@/lib/format";
import {
  getCandidateApplicationForJob,
  getCandidatePrimaryDocument,
  getPublicJobBySlug
} from "@/lib/jobs";

type CandidateJobDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function CandidateJobDetailPage({
  params
}: CandidateJobDetailPageProps) {
  const profile = await requireRole(["candidat"]);
  const { slug } = await params;
  const job = await getPublicJobBySlug(slug);

  if (!job) {
    notFound();
  }

  const application = await getCandidateApplicationForJob(profile.id, job.id);
  const primaryCv = await getCandidatePrimaryDocument(profile.id);

  return (
    <DashboardShell
      title={job.title}
      description="Consultez le detail du poste et postulez directement depuis votre espace candidat sans revenir vers la vitrine institutionnelle."
      profile={profile}
      currentPath="/app/candidat/offres"
    >
      <section className="dashboard-workspace">
        <div className="dashboard-column">
          <article className="panel detail-card dashboard-card">
            <div className="dashboard-card__top">
              <p className="eyebrow">Offre active</p>
              <span className="tag">{job.is_featured ? "Mise en avant" : "Disponible"}</span>
            </div>
            <h2>{job.title}</h2>
            <p className="page-hero__lead">{job.summary}</p>
            <div className="job-card__meta">
              <span>{job.location}</span>
              <span>{job.contract_type}</span>
              <span>{job.work_mode}</span>
              <span>{job.sector}</span>
            </div>
            <p className="detail-date">Publication : {formatDisplayDate(job.published_at)}</p>
            <div className="dashboard-action-stack">
              <Link className="btn btn-ghost btn-block" href="/app/candidat/offres">
                Retour a la liste des offres
              </Link>
            </div>
          </article>
        </div>

        <aside className="dashboard-column dashboard-column--aside">
          {application ? (
            <div className="panel dashboard-sidecard detail-side-card__stack">
              <p className="eyebrow">Candidature envoyee</p>
              <h2>Vous avez deja postule a cette offre.</h2>
              <p>Statut actuel : {application.status}</p>
              <p>Soumis le {formatDisplayDate(application.created_at)}</p>
              <div className="dashboard-action-stack">
                <Link className="btn btn-secondary btn-block" href="/app/candidat">
                  Voir mon suivi candidat
                </Link>
              </div>
            </div>
          ) : (
            <JobApplyForm
              jobId={job.id}
              jobSlug={job.slug}
              primaryCvName={primaryCv?.file_name ?? null}
            />
          )}
        </aside>
      </section>
    </DashboardShell>
  );
}
