import Link from "next/link";

export default function NotFound() {
  return (
    <main className="page-shell">
      <section className="section">
        <div className="container panel empty-state">
          <p className="eyebrow">Introuvable</p>
          <h1>La page demandee n'existe pas ou n'est plus disponible.</h1>
          <Link className="btn btn-primary" href="/">
            Retour a l'accueil
          </Link>
        </div>
      </section>
    </main>
  );
}
