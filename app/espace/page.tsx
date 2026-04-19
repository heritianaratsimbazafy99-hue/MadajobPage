import Link from "next/link";

export default function EspacePage() {
  return (
    <main className="page">
      <section className="hero">
        <div className="container hero-grid">
          <div data-reveal>
            <span className="eyebrow">Notre plateforme de recrutement</span>
            <h1>Choisissez votre acces a la plateforme Madajob</h1>
            <p className="lead">
              Le site institutionnel presente Madajob. Cette plateforme prend ensuite
              le relai pour les espaces candidat, recruteur et les connexions a votre
              environnement de travail.
            </p>
            <div className="hero-actions">
              <Link className="btn btn-primary" href="/espace/candidat">
                Espace candidat
              </Link>
              <Link className="btn btn-secondary" href="/espace/recruteur">
                Espace recruteur
              </Link>
              <Link className="btn btn-ghost" href="/connexion">
                Me connecter
              </Link>
            </div>
            <ul className="hero-points">
              <li>Profil et CV</li>
              <li>Offres et candidatures</li>
              <li>Pipeline recruteur</li>
              <li>Acces securise par role</li>
            </ul>
          </div>

          <div className="glass-panel hero-visual" data-reveal>
            <div className="stack-card">
              <h3>Acces disponibles</h3>
              <div className="visual-grid">
                <div className="mini-stat">
                  <strong>Candidat</strong>
                  <span>Creer un profil, deposer un CV et suivre ses candidatures.</span>
                </div>
                <div className="mini-stat">
                  <strong>Recruteur</strong>
                  <span>Publier des offres et piloter les candidatures liees a ses besoins.</span>
                </div>
                <div className="mini-stat">
                  <strong>Admin</strong>
                  <span>Superviser les utilisateurs, l&apos;activite et la moderation globale.</span>
                </div>
                <div className="mini-stat">
                  <strong>Supabase</strong>
                  <span>Socle auth, base de donnees, stockage CV et permissions par role.</span>
                </div>
              </div>
            </div>

            <div className="stack-card">
              <h3>Ce que la plateforme centralise</h3>
              <div className="tag-cloud">
                <span>Profils</span>
                <span>CV</span>
                <span>Offres</span>
                <span>Candidatures</span>
                <span>Pipelines</span>
                <span>Administration</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container split">
          <article className="panel" data-reveal>
            <span className="eyebrow">Candidat</span>
            <h3>Un espace pour creer son profil et postuler sans friction</h3>
            <p>
              Les candidats retrouvent leur profil, leur CV, l&apos;historique de leurs
              candidatures et les opportunites qui leur correspondent.
            </p>
            <div className="hero-actions">
              <Link className="btn btn-primary" href="/espace/candidat">
                Ouvrir l&apos;espace candidat
              </Link>
              <Link className="btn btn-secondary" href="/inscription">
                Creer un compte
              </Link>
            </div>
          </article>

          <article className="panel quote-card" data-reveal>
            <span className="eyebrow">Recruteur</span>
            <h3>Un espace dedie pour publier, filtrer et suivre</h3>
            <p>
              Les recruteurs accedent a leurs offres, leurs candidatures et a une vue
              plus claire sur leur pipeline de recrutement.
            </p>
            <div className="hero-actions">
              <Link className="btn btn-primary" href="/espace/recruteur">
                Ouvrir l&apos;espace recruteur
              </Link>
              <Link className="btn btn-secondary" href="/connexion">
                Me connecter
              </Link>
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}
