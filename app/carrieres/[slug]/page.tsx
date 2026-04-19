import Link from "next/link";
import { notFound } from "next/navigation";

import { JobApplyForm } from "@/components/jobs/job-apply-form";
import { getCurrentProfile } from "@/lib/auth";
import { formatDisplayDate } from "@/lib/format";
import {
  getCandidateApplicationForJob,
  getPublicJobBySlug
} from "@/lib/jobs";

type JobDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const { slug } = await params;
  const job = await getPublicJobBySlug(slug);

  if (!job) {
    notFound();
  }

  const profile = await getCurrentProfile();
  const application =
    profile?.role === "candidat"
      ? await getCandidateApplicationForJob(profile.id, job.id)
      : null;

  return (
    <main className="page-shell">
      <section className="section">
        <div className="container detail-layout">
          <article className="panel detail-card">
            <p className="eyebrow">Offre Madajob</p>
            <h1>{job.title}</h1>
            <p className="page-hero__lead">{job.summary}</p>
            <div className="job-card__meta">
              <span>{job.location}</span>
              <span>{job.contract_type}</span>
              <span>{job.work_mode}</span>
              <span>{job.sector}</span>
            </div>
            <p className="detail-date">
              Publication: {formatDisplayDate(job.published_at)}
            </p>
          </article>

          <aside className="panel detail-side-card">
            <h2>Prochaine etape</h2>
            {profile?.role === "candidat" ? (
              application ? (
                <div className="detail-side-card__stack">
                  <p>
                    Vous avez deja postule a cette offre depuis votre espace candidat.
                  </p>
                  <div className="panel dashboard-sidecard">
                    <p className="eyebrow">Statut actuel</p>
                    <h2>{application.status}</h2>
                    <p>Soumis le {formatDisplayDate(application.created_at)}</p>
                  </div>
                  <div className="hero__actions hero__actions--stack">
                    <Link className="btn btn-secondary btn-block" href="/app/candidat">
                      Ouvrir mon suivi
                    </Link>
                  </div>
                </div>
              ) : (
                <JobApplyForm jobId={job.id} jobSlug={job.slug} />
              )
            ) : (
              <>
                <p>
                  Connectez-vous en candidat pour postuler directement a cette offre
                  depuis la plateforme Madajob.
                </p>
                <div className="hero__actions hero__actions--stack">
                  <Link className="btn btn-primary btn-block" href="/inscription">
                    Creer un compte candidat
                  </Link>
                  <Link className="btn btn-secondary btn-block" href="/connexion">
                    Me connecter pour postuler
                  </Link>
                </div>
              </>
            )}
          </aside>
        </div>
      </section>
    </main>
  );
}
