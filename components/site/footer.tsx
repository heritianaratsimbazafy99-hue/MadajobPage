import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container site-footer__grid">
        <div>
          <p className="eyebrow">Madajob</p>
          <p className="footer-copy">
            Plateforme RH, recrutement et site carriere natif pour connecter les
            talents, les recruteurs et l'equipe Madajob.
          </p>
        </div>

        <div>
          <p className="footer-title">Parcours</p>
          <div className="footer-links">
            <Link href="/candidats">Espace candidats</Link>
            <Link href="/recruteurs">Espace recruteurs</Link>
            <Link href="/carrieres">Offres d'emploi</Link>
          </div>
        </div>

        <div>
          <p className="footer-title">Acces</p>
          <div className="footer-links">
            <Link href="/connexion">Connexion</Link>
            <Link href="/inscription">Inscription candidat</Link>
            <Link href="/app/admin">Espace admin</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
