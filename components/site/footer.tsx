import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container site-footer__grid">
        <div>
          <p className="eyebrow">Madajob</p>
          <p className="footer-copy">
            Cabinet RH, formation, externalisation et plateforme carriere pour
            connecter les entreprises, les talents et les equipes Madajob.
          </p>
        </div>

        <div>
          <p className="footer-title">Institutionnel</p>
          <div className="footer-links">
            <Link href="/candidats">Candidat</Link>
            <Link href="/formation">Formation</Link>
            <Link href="/externalisation">Externalisation</Link>
            <Link href="/entreprise">Entreprise</Link>
          </div>
        </div>

        <div>
          <p className="footer-title">Plateforme</p>
          <div className="footer-links">
            <Link href="/espace">Espace candidat / recruteur</Link>
            <Link href="/carrieres">Offres d'emploi</Link>
            <Link href="/connexion">Connexion</Link>
            <Link href="/inscription">Inscription candidat</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
