import Link from "next/link";

const services = [
  {
    number: "01",
    title: "Mise a disposition",
    text: "Deployer rapidement du personnel operationnel ou support avec une gestion administrative prise en charge.",
    items: ["Renfort ponctuel ou long terme", "Couverture terrain", "Supervision structuree"]
  },
  {
    number: "02",
    title: "Paie & administration RH",
    text: "Externaliser les demarches chronophages pour securiser la conformite et fluidifier la gestion sociale.",
    items: ["Contrats et documents RH", "Traitement de paie", "Reporting et suivi"]
  },
  {
    number: "03",
    title: "Portage salarial",
    text: "Faciliter la collaboration avec des experts ou consultants tout en simplifiant la dimension administrative.",
    items: ["Cadre contractuel clair", "Gestion simplifiee", "Flexibilite operationnelle"]
  },
  {
    number: "04",
    title: "RPO & sourcing international",
    text: "Un accompagnement structure pour piloter des recrutements a Madagascar, en Afrique et a l'international.",
    items: ["RPO international", "Sourcing structure", "Montee en volume"]
  }
];

export default function ExternalisationPage() {
  return (
    <main className="page-shell">
      <section className="hero">
        <div className="container hero__grid">
          <div>
            <p className="eyebrow">Agilite operationnelle</p>
            <h1>Externaliser sans perdre le controle</h1>
            <p className="hero__lead">
              Madajob accompagne les entreprises avec des solutions d&apos;externalisation RH structurees:
              mise a disposition de personnel, gestion administrative, paie, portage salarial, SIRH et RPO international.
            </p>
            <div className="hero__actions">
              <Link className="btn btn-primary" href="mailto:infos@madajob.mg">
                Lancer un besoin
              </Link>
              <Link className="btn btn-secondary" href="/entreprise">
                Voir l&apos;offre entreprise
              </Link>
              <Link className="btn btn-ghost" href="/espace/recruteur">
                Ouvrir la plateforme recruteur
              </Link>
            </div>
          </div>

          <div className="hero-panel">
            <div className="stat-card">
              <span>Pole externalisation Madajob</span>
              <strong>856 agents accompagnes</strong>
              <p>
                Une organisation concue pour garantir rapidite d&apos;execution,
                conformite administrative et visibilite operationnelle.
              </p>
            </div>
            <div className="metric-stack">
              <article className="mini-panel">
                <strong>24h</strong>
                <span>delai de mise en route rapide pour certaines demandes</span>
              </article>
              <article className="mini-panel">
                <strong>RPO</strong>
                <span>capacite a recruter pour Madagascar, l&apos;Afrique et l&apos;international</span>
              </article>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-heading">
            <p className="eyebrow">Services</p>
            <h2>Une offre d&apos;externalisation claire et operationnelle</h2>
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
            <p className="eyebrow">Benefices</p>
            <h2>Pourquoi externaliser avec Madajob</h2>
            <ul className="list-checks">
              <li>Reponse rapide aux besoins terrain grace a une organisation prete a activer les ressources.</li>
              <li>Reduction des taches administratives et meilleure concentration des equipes internes sur le coeur de metier.</li>
              <li>Suivi RH, paie et reporting regroupes dans un discours plus coherent et rassurant.</li>
              <li>Possibilite d&apos;articuler externalisation, recrutement et formation au sein d&apos;un meme partenaire.</li>
            </ul>
          </article>

          <article className="panel quote-panel">
            <p className="eyebrow">Positionnement</p>
            <blockquote>
              L&apos;externalisation ne se vend pas seulement sur le volume ou le prix.
              Elle se vend sur la serenite, la vitesse de deploiement et la qualite de pilotage visibles des la page.
            </blockquote>
            <footer>Solutions d&apos;externalisation Madajob</footer>
          </article>
        </div>
      </section>
    </main>
  );
}
