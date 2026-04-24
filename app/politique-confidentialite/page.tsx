import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Politique de confidentialite | Madajob",
  description:
    "Politique de confidentialite Madajob pour les candidats, recruteurs et utilisateurs de la plateforme RH."
};

const privacySections = [
  {
    title: "Donnees collectees",
    items: [
      "Informations de compte : nom, email, role, organisation et coordonnees utiles.",
      "Donnees candidat : profil, CV, documents, preferences, candidatures, entretiens et notifications.",
      "Donnees recruteur et admin : offres, organisations, pipeline, notes internes, shortlist et reporting.",
      "Donnees techniques necessaires a la securite, a l'authentification et au bon fonctionnement du service."
    ]
  },
  {
    title: "Finalites",
    items: [
      "Permettre la creation et la gestion des comptes utilisateurs.",
      "Faciliter le recrutement, le matching, le suivi des candidatures et la communication in-app.",
      "Aider les recruteurs et administrateurs a piloter les offres, candidatures et entretiens.",
      "Ameliorer la qualite, la securite et la fiabilite de la plateforme Madajob."
    ]
  },
  {
    title: "Acces et partage",
    items: [
      "Les candidats accedent a leurs propres informations et candidatures.",
      "Les recruteurs accedent aux donnees necessaires au suivi des offres de leur organisation.",
      "Les administrateurs Madajob disposent d'un acces de supervision pour operer la plateforme.",
      "Les fichiers et documents sont proteges par des controles d'acces et des liens signes temporaires."
    ]
  },
  {
    title: "Droits des utilisateurs",
    items: [
      "Vous pouvez demander l'acces, la correction ou la suppression des informations vous concernant.",
      "Vous pouvez ajuster vos preferences d'alertes dans votre espace candidat.",
      "Pour exercer vos droits, contactez Madajob a l'adresse infos@madajob.mg."
    ]
  }
];

export default function PrivacyPolicyPage() {
  return (
    <main className="page legal-page">
      <section className="page-hero page-hero--tight">
        <div className="container">
          <span className="eyebrow">Donnees personnelles</span>
          <h1>Politique de confidentialite</h1>
          <p className="page-hero__lead">
            Madajob traite les donnees necessaires au fonctionnement du site, de la
            plateforme candidat, de la plateforme recruteur et des outils admin.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container legal-grid">
          {privacySections.map((section) => (
            <article key={section.title} className="panel legal-card">
              <h2>{section.title}</h2>
              <ul className="dashboard-mini-list">
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="section section--compact">
        <div className="container legal-related">
          <Link className="btn btn-secondary" href="/mentions-legales">
            Mentions legales
          </Link>
          <Link className="btn btn-ghost" href="/conditions-utilisation">
            Conditions d'utilisation
          </Link>
        </div>
      </section>
    </main>
  );
}
