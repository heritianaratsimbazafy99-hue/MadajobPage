import Link from "next/link";

import { formatDisplayDate } from "@/lib/format";
import { getRecentPublicJobs } from "@/lib/jobs";

export default async function CarrieresPage() {
  const jobs = await getRecentPublicJobs(10);

  return (
    <main className="page-shell">
      <section className="section">
        <div className="container page-hero page-hero--tight">
          <div>
            <p className="eyebrow">Site carriere</p>
            <h1>Consultez les 10 offres les plus recentes et postulez dans un parcours natif Madajob.</h1>
            <p className="page-hero__lead">
              Cette vitrine institutionnelle met en avant les annonces les plus recentes.
              Pour une recherche plus avancee, les candidats retrouvent ensuite un espace
              dedie dans la plateforme Madajob.
            </p>
          </div>
        </div>
      </section>

      <section className="section section--muted">
        <div className="container job-grid">
          {jobs.length > 0 ? (
            jobs.map((job) => (
              <article key={job.id} className="panel job-card">
                {job.is_featured ? <span className="tag">Mise en avant</span> : null}
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
            ))
          ) : (
            <article className="panel job-card">
              <h2>Aucune offre publiee pour le moment</h2>
              <p>Les prochaines opportunites apparaitront ici des qu&apos;elles seront publiees.</p>
            </article>
          )}
        </div>
      </section>
    </main>
  );
}
