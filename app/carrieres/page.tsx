import Link from "next/link";

import { formatDisplayDate } from "@/lib/format";
import { getPublicJobs } from "@/lib/jobs";

export default async function CarrieresPage() {
  const jobs = await getPublicJobs();

  return (
    <main className="page-shell">
      <section className="section">
        <div className="container page-hero page-hero--tight">
          <div>
            <p className="eyebrow">Site carriere</p>
            <h1>Consultez les opportunites et postulez dans un parcours natif Madajob.</h1>
            <p className="page-hero__lead">
              Une experience plus rapide que l'ancien site externe, avec une meilleure
              lecture des offres et une integration directe avec vos comptes.
            </p>
          </div>
        </div>
      </section>

      <section className="section section--muted">
        <div className="container job-grid">
          {jobs.map((job) => (
            <article key={job.id} className="panel job-card">
              {job.is_featured ? <span className="tag">Featured</span> : null}
              <h2>{job.title}</h2>
              <p>{job.summary}</p>
              <div className="job-card__meta">
                <span>{job.location}</span>
                <span>{job.contract_type}</span>
                <span>{job.work_mode}</span>
              </div>
              <div className="job-card__footer">
                <small>Publie le {formatDisplayDate(job.published_at)}</small>
                <Link href={`/carrieres/${job.slug}`}>Voir le detail</Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
