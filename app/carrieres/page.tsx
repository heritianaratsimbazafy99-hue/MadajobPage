import Link from "next/link";

import { PublicCareersBoard } from "@/components/jobs/public-careers-board";
import { getPublicJobs } from "@/lib/jobs";

export default async function CarrieresPage() {
  const jobs = await getPublicJobs({ limit: 48, sort: "featured" });
  const featuredCount = jobs.filter((job) => job.is_featured).length;
  const locationsCount = new Set(jobs.map((job) => job.location).filter(Boolean)).size;
  const sectorsCount = new Set(jobs.map((job) => job.sector).filter(Boolean)).size;

  return (
    <main className="page-shell">
      <section className="section">
        <div className="container career-hero">
          <div className="career-hero__copy">
            <p className="eyebrow">Carrieres Madajob</p>
            <h1>Les offres publiees par Madajob, consultables depuis la vitrine.</h1>
            <p>
              Retrouvez les annonces actives, filtrez les postes ouverts et postulez ensuite
              dans un parcours natif relie a votre espace candidat.
            </p>
            <div className="hero__actions">
              <Link className="btn btn-primary" href="/inscription">
                Creer mon espace candidat
              </Link>
              <Link className="btn btn-secondary" href="/connexion">
                Me connecter
              </Link>
            </div>
          </div>

          <aside className="career-hero__panel">
            <article>
              <strong>{jobs.length}</strong>
              <span>offre(s) active(s)</span>
            </article>
            <article>
              <strong>{featuredCount}</strong>
              <span>mise(s) en avant</span>
            </article>
            <article>
              <strong>{locationsCount}</strong>
              <span>lieu(x) de recrutement</span>
            </article>
            <article>
              <strong>{sectorsCount}</strong>
              <span>secteur(s)</span>
            </article>
          </aside>
        </div>
      </section>

      <section className="section section--muted career-section">
        <div className="container">
          <PublicCareersBoard jobs={jobs} />
        </div>
      </section>
    </main>
  );
}
