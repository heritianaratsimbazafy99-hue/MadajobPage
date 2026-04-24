import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <p>
          Madajob © <span data-year>2026</span> · Createur d&apos;opportunites.
        </p>
        <div className="footer-links">
          <Link href="/candidats">Candidat</Link>
          <Link href="/formation">Formation</Link>
          <Link href="/externalisation">Externalisation</Link>
          <Link href="/entreprise">Entreprise</Link>
          <Link href="/espace">Notre plateforme de recrutement</Link>
          <Link href="/mentions-legales">Mentions legales</Link>
          <Link href="/politique-confidentialite">Confidentialite</Link>
          <Link href="/conditions-utilisation">Conditions</Link>
        </div>
      </div>
    </footer>
  );
}
