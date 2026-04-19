import Link from "next/link";
import { notFound } from "next/navigation";

import { formatDisplayDate, getPublicJobBySlug } from "@/lib/jobs";

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
            <p>
              Dans la phase 3, cette page sera reliee au formulaire de candidature
              Supabase avec CV, profil candidat et suivi de statut.
            </p>
            <div className="hero__actions hero__actions--stack">
              <Link className="btn btn-primary btn-block" href="/inscription">
                Creer un compte candidat
              </Link>
              <Link className="btn btn-secondary btn-block" href="/connexion">
                Me connecter pour postuler
              </Link>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
