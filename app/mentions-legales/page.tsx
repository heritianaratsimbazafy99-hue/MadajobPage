import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Mentions legales | Madajob",
  description:
    "Mentions legales du site institutionnel Madajob et de la plateforme RH associee."
};

const legalItems = [
  {
    title: "Editeur du site",
    text:
      "Le site est edite par Madajob. Les informations administratives completes de l'entite exploitante doivent etre validees par l'equipe Madajob avant publication definitive."
  },
  {
    title: "Contact",
    text:
      "Pour toute demande liee au site, aux offres, a un compte ou aux services RH, vous pouvez contacter Madajob a l'adresse infos@madajob.mg."
  },
  {
    title: "Hebergement",
    text:
      "Le site est heberge sur Vercel. Les donnees applicatives de la plateforme RH sont traitees via Supabase selon les droits et finalites prevus par le service."
  },
  {
    title: "Propriete intellectuelle",
    text:
      "Les textes, marques, interfaces, logos, visuels et contenus du site Madajob sont proteges. Toute reproduction ou reutilisation non autorisee est interdite."
  },
  {
    title: "Responsabilite",
    text:
      "Madajob s'efforce de maintenir des informations exactes et a jour. Les offres d'emploi, contenus RH et informations de service peuvent evoluer selon les besoins des entreprises clientes et de la plateforme."
  }
];

export default function LegalNoticePage() {
  return (
    <main className="page legal-page">
      <section className="page-hero page-hero--tight">
        <div className="container">
          <span className="eyebrow">Cadre legal</span>
          <h1>Mentions legales</h1>
          <p className="page-hero__lead">
            Cette page regroupe les informations legales relatives au site institutionnel
            Madajob et a la plateforme RH native.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container legal-grid">
          {legalItems.map((item) => (
            <article key={item.title} className="panel legal-card">
              <h2>{item.title}</h2>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section section--compact">
        <div className="container legal-related">
          <Link className="btn btn-secondary" href="/politique-confidentialite">
            Politique de confidentialite
          </Link>
          <Link className="btn btn-ghost" href="/conditions-utilisation">
            Conditions d'utilisation
          </Link>
        </div>
      </section>
    </main>
  );
}
