import Image from "next/image";
import Link from "next/link";

import airMadagascar from "@/assets/clients/air-madagascar.png";
import bniMadagascar from "@/assets/clients/bni-madagascar.png";
import canalPlus from "@/assets/clients/canal-plus.png";
import colas from "@/assets/clients/colas.jpeg";
import star from "@/assets/clients/star.jpeg";
import telma from "@/assets/clients/telma.png";
import { SetupNotice } from "@/components/site/setup-notice";
import { isSupabaseConfigured } from "@/lib/env";
import { formatDisplayDate, getPublicJobs } from "@/lib/jobs";

const partnerLogos = [
  { src: canalPlus, alt: "Canal Plus" },
  { src: airMadagascar, alt: "Air Madagascar" },
  { src: bniMadagascar, alt: "BNI Madagascar" },
  { src: telma, alt: "Telma" },
  { src: colas, alt: "Colas Madagascar" },
  { src: star, alt: "Star" }
];

export default async function HomePage() {
  const jobs = await getPublicJobs();
  const featuredJobs = jobs.slice(0, 3);

  return (
    <main>
      <section className="hero">
        <div className="container hero__grid">
          <div>
            <p className="eyebrow">Plateforme RH Madajob</p>
            <h1>Un site carriere natif pour convertir les talents et outiller les recruteurs.</h1>
            <p className="hero__lead">
              Nous separons clairement les parcours candidats, recruteurs et admin
              pour offrir une experience plus fluide, plus rapide et plus credible.
            </p>
            <div className="hero__actions">
              <Link className="btn btn-primary" href="/candidats">
                Espace candidats
              </Link>
              <Link className="btn btn-secondary" href="/recruteurs">
                Espace recruteurs
              </Link>
            </div>
          </div>

          <div className="hero-panel">
            <div className="stat-card">
              <span>Parcours separes</span>
              <strong>3 espaces cles</strong>
              <p>Candidat, recruteur et admin avec droits et interfaces adaptes.</p>
            </div>
            <div className="stat-card">
              <span>Performance</span>
              <strong>Images optimisees</strong>
              <p>Next Image, WebP, lazy loading et cache CDN pour de meilleurs temps de chargement.</p>
            </div>
            <div className="stat-card">
              <span>Evolution</span>
              <strong>Socle Supabase</strong>
              <p>Auth, PostgreSQL, Storage et RLS pour une V1 propre et evolutive.</p>
            </div>
          </div>
        </div>
      </section>

      {!isSupabaseConfigured ? (
        <div className="container">
          <SetupNotice />
        </div>
      ) : null}

      <section className="section">
        <div className="container split-grid">
          <article className="panel audience-card">
            <p className="eyebrow">Candidats</p>
            <h2>Un espace personnel pour gerer profil, CV et candidatures.</h2>
            <p>
              Les candidats accedent a leurs documents, leurs informations et le suivi
              de leurs candidatures sans voir les notes internes.
            </p>
            <Link href="/candidats" className="text-link">
              Decouvrir le parcours candidat
            </Link>
          </article>

          <article className="panel audience-card">
            <p className="eyebrow">Recruteurs</p>
            <h2>Un espace dedie pour publier, suivre et convertir plus vite.</h2>
            <p>
              Les recruteurs gerent leurs offres et voient uniquement les candidatures
              reliees a leurs besoins, sans exposition excessive de la base CV.
            </p>
            <Link href="/recruteurs" className="text-link">
              Decouvrir le parcours recruteur
            </Link>
          </article>
        </div>
      </section>

      <section className="section section--muted">
        <div className="container">
          <div className="section-heading">
            <p className="eyebrow">Offres en avant</p>
            <h2>Des annonces natives, rapides a publier et plus faciles a consulter.</h2>
          </div>

          <div className="job-grid">
            {featuredJobs.map((job) => (
              <article key={job.id} className="panel job-card">
                <span className="tag">{job.contract_type}</span>
                <h3>{job.title}</h3>
                <p>{job.summary}</p>
                <div className="job-card__meta">
                  <span>{job.location}</span>
                  <span>{job.work_mode}</span>
                </div>
                <div className="job-card__footer">
                  <small>Publie le {formatDisplayDate(job.published_at)}</small>
                  <Link href={`/carrieres/${job.slug}`}>Voir l'offre</Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-heading">
            <p className="eyebrow">References</p>
            <h2>Des marques majeures font deja confiance a Madajob.</h2>
          </div>
          <div className="partners-grid">
            {partnerLogos.map((logo) => (
              <div key={logo.alt} className="partner-card">
                <Image src={logo.src} alt={logo.alt} width={180} height={84} />
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
