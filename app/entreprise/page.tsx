import Link from "next/link";

const services = [
  {
    number: "01",
    title: "Recrutement au succes",
    text: "Une proposition plus rassurante, plus lisible et plus rentable a percevoir pour l'entreprise.",
    items: ["Brief et cadrage", "Recherche ciblee", "Paiement lie au resultat"]
  },
  {
    number: "02",
    title: "Evaluation & selection",
    text: "Une selection rigoureuse pour presenter des profils pertinents, evalues et en adequation avec les exigences du poste.",
    items: ["Preselection structuree", "Entretiens", "Presentation de profils qualifies"]
  },
  {
    number: "03",
    title: "Contrats sur mesure",
    text: "Des modes d'accompagnement adaptes selon le volume, l'urgence, le niveau de rarete et la nature du besoin.",
    items: ["CDI et CDD", "Prestations specifiques", "Accompagnement adapte"]
  },
  {
    number: "04",
    title: "Stack RH complet",
    text: "Madajob peut enchainer recrutement, externalisation, formation et accompagnement RH sans friction entre les pages.",
    items: ["Formation apres recrutement", "Externalisation si besoin", "Vision long terme"]
  }
];

export default function EntreprisePage() {
  return (
    <main className="page-shell">
      <section className="hero">
        <div className="container hero__grid">
          <div>
            <p className="eyebrow">Partenaire de recrutement</p>
            <h1>Recrutez plus vite les bons profils pour votre entreprise</h1>
            <p className="hero__lead">
              Madajob accompagne les entreprises avec un vivier de profils qualifies,
              un recrutement au succes, une garantie sur periode d&apos;essai et des solutions RH complementaires.
            </p>
            <div className="hero__actions">
              <Link className="btn btn-primary" href="mailto:infos@madajob.mg">
                Parler a un consultant
              </Link>
              <Link className="btn btn-secondary" href="/externalisation">
                Voir l&apos;externalisation
              </Link>
              <Link className="btn btn-ghost" href="/espace/recruteur">
                Espace candidat / recruteur
              </Link>
            </div>
          </div>

          <div className="hero-panel">
            <div className="stat-card">
              <span>Recrutement, evaluation et conseil RH</span>
              <strong>454 missions de recrutement</strong>
              <p>
                Madajob aide les dirigeants, les RH et les managers a identifier rapidement les solutions les plus adaptees.
              </p>
            </div>
            <div className="metric-stack">
              <article className="mini-panel">
                <strong>40 000+</strong>
                <span>profils disponibles dans l&apos;ecosysteme Madajob</span>
              </article>
              <article className="mini-panel">
                <strong>3</strong>
                <span>agences pour un sourcing plus proche du terrain</span>
              </article>
              <article className="mini-panel">
                <strong>Success fee</strong>
                <span>paiement lie au resultat, avec garantie sur l&apos;essai</span>
              </article>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-heading">
            <p className="eyebrow">Solutions</p>
            <h2>Des solutions RH concues pour decider plus vite</h2>
          </div>
          <div className="job-grid">
            {services.map((service) => (
              <article key={service.number} className="panel info-card-next">
                <span className="icon-chip">{service.number}</span>
                <h3>{service.title}</h3>
                <p>{service.text}</p>
                <ul className="list-checks">
                  {service.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container split-grid">
          <article className="panel">
            <p className="eyebrow">Ciblage</p>
            <h2>Des profils et secteurs mieux contextualises</h2>
            <ul className="list-checks">
              <li>Fonctions techniques, support, commerciales, administratives et manageriales.</li>
              <li>Secteurs varies: industrie, distribution, services, terrain, fonctions siege et environnements en forte croissance.</li>
              <li>Possibilite de basculer vers l&apos;externalisation ou la formation quand le besoin le justifie.</li>
              <li>Discours plus credible pour les decideurs qui comparent plusieurs prestataires RH.</li>
            </ul>
          </article>

          <article className="panel quote-panel">
            <p className="eyebrow">Garantie</p>
            <blockquote>
              Une bonne page entreprise doit donner trois signaux tres vite: l&apos;etendue du vivier, la methode de selection et le niveau d&apos;engagement.
            </blockquote>
            <footer>Solutions entreprise Madajob</footer>
          </article>
        </div>
      </section>
    </main>
  );
}
