import Link from "next/link";

export default function EspacePage() {
  return (
    <main className="page-shell">
      <section className="section">
        <div className="container page-hero">
          <div>
            <p className="eyebrow">Plateforme Madajob</p>
            <h1>Choisissez votre entree vers la plateforme</h1>
            <p className="page-hero__lead">
              Le site institutionnel presente Madajob. Cet espace vous amene ensuite
              vers les parcours operationnels candidat, recruteur ou connexion directe.
            </p>
          </div>

          <div className="panel checklist-card">
            <h2>Acces disponibles</h2>
            <ul>
              <li>Candidat: profil, CV, candidatures, suivi</li>
              <li>Recruteur: offres, candidatures, pipeline</li>
              <li>Admin: supervision globale</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="section section--muted">
        <div className="container split-grid">
          <article className="panel audience-card">
            <p className="eyebrow">Candidat</p>
            <h2>Mon espace candidat</h2>
            <p>Creer votre profil, televerser votre CV et suivre vos candidatures.</p>
            <div className="hero__actions">
              <Link className="btn btn-primary" href="/espace/candidat">
                Decouvrir le parcours
              </Link>
              <Link className="btn btn-secondary" href="/inscription">
                Creer un compte
              </Link>
            </div>
          </article>

          <article className="panel audience-card">
            <p className="eyebrow">Recruteur</p>
            <h2>Mon espace recruteur</h2>
            <p>Publier, suivre et piloter vos besoins avec une vue adaptee a votre role.</p>
            <div className="hero__actions">
              <Link className="btn btn-primary" href="/espace/recruteur">
                Decouvrir le parcours
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
