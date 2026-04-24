import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Conditions d'utilisation | Madajob",
  description:
    "Conditions d'utilisation du site Madajob et de la plateforme RH pour candidats, recruteurs et administrateurs."
};

const terms = [
  {
    title: "Objet du service",
    text:
      "Madajob propose un site institutionnel, un espace candidat, un espace recruteur et des outils de supervision RH destines a faciliter la publication d'offres, les candidatures, le suivi des dossiers et les entretiens."
  },
  {
    title: "Comptes utilisateurs",
    text:
      "Chaque utilisateur est responsable de l'exactitude des informations transmises et de la confidentialite de ses acces. Les roles candidat, recruteur et admin determinent les droits disponibles dans la plateforme."
  },
  {
    title: "Candidatures et offres",
    text:
      "Les offres publiees peuvent etre modifiees, fermees ou archivees selon les besoins des organisations. Les candidats restent responsables du contenu de leur profil, de leurs documents et de leurs candidatures."
  },
  {
    title: "Usage acceptable",
    text:
      "L'utilisation de la plateforme doit rester conforme a sa finalite RH. Toute tentative d'acces non autorise, de collecte abusive, de depot de contenu illicite ou de perturbation du service est interdite."
  },
  {
    title: "Evolution du service",
    text:
      "Madajob peut faire evoluer les fonctionnalites, contenus, regles d'acces et parcours applicatifs afin d'ameliorer la qualite du service et la securite de la plateforme."
  }
];

export default function TermsPage() {
  return (
    <main className="page legal-page">
      <section className="page-hero page-hero--tight">
        <div className="container">
          <span className="eyebrow">Regles d'usage</span>
          <h1>Conditions d'utilisation</h1>
          <p className="page-hero__lead">
            Ces conditions encadrent l'utilisation du site Madajob et de la plateforme
            RH par les candidats, recruteurs et administrateurs.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container legal-stack">
          {terms.map((term) => (
            <article key={term.title} className="panel legal-card">
              <h2>{term.title}</h2>
              <p>{term.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section section--compact">
        <div className="container legal-related">
          <Link className="btn btn-secondary" href="/mentions-legales">
            Mentions legales
          </Link>
          <Link className="btn btn-ghost" href="/politique-confidentialite">
            Politique de confidentialite
          </Link>
        </div>
      </section>
    </main>
  );
}
