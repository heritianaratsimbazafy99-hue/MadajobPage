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
    text: "Faciliter la collaboration avec des experts, consultants ou intervenants tout en simplifiant la dimension administrative.",
    items: ["Cadre contractuel clair", "Gestion simplifiee", "Flexibilite operationnelle"]
  },
  {
    number: "04",
    title: "RPO & sourcing international",
    text: "Un accompagnement structure pour piloter des recrutements a Madagascar, en Afrique et a l'international.",
    items: ["RPO international", "Sourcing structure", "Montee en volume"]
  }
];

const steps = [
  {
    step: "1",
    title: "Cadrer le besoin",
    text: "Comprendre le volume, le delai, les profils, le contexte reglementaire et le niveau d'encadrement attendu."
  },
  {
    step: "2",
    title: "Mobiliser les ressources",
    text: "Constituer ou activer l'equipe adaptee grace au recrutement, a la base talents et au reseau Madajob."
  },
  {
    step: "3",
    title: "Gerer l'administratif",
    text: "Prendre en charge contrats, paie, suivi social et gestion documentaire avec une communication simplifiee."
  },
  {
    step: "4",
    title: "Piloter la performance",
    text: "Suivre les effectifs, les rythmes d'activite et les ajustements a partir d'indicateurs plus visibles pour le client."
  }
];

export default function ExternalisationPage() {
  return (
    <main className="page page-externalisation">
      <section className="hero">
        <div className="container hero-grid">
          <div data-reveal>
            <span className="eyebrow">Agilite operationnelle</span>
            <h1>Externaliser sans perdre le controle</h1>
            <p className="lead">
              Madajob accompagne les entreprises avec des solutions d&apos;externalisation
              RH structurees : mise a disposition de personnel, gestion administrative,
              paie, portage salarial, SIRH et RPO international.
            </p>
            <div className="hero-actions">
              <Link className="btn btn-primary" href="mailto:infos@madajob.mg">
                Lancer un besoin
              </Link>
              <Link className="btn btn-secondary" href="/entreprise">
                Voir l&apos;offre entreprise
              </Link>
              <Link className="btn btn-ghost" href="/espace/recruteur">
                Notre plateforme de recrutement
              </Link>
            </div>
            <ul className="hero-points">
              <li>Mise a disposition</li>
              <li>Paie & administration RH</li>
              <li>Portage salarial</li>
              <li>Recruitment Process Outsourcing</li>
            </ul>
          </div>

          <div className="glass-panel hero-visual" data-reveal>
            <div className="stack-card">
              <h3>Pole externalisation Madajob</h3>
              <p>
                Une organisation concue pour garantir rapidite d&apos;execution,
                conformite administrative et visibilite operationnelle sur l&apos;ensemble
                du dispositif.
              </p>
              <div className="visual-grid">
                <div className="mini-stat">
                  <strong data-count="856">856</strong>
                  <span>agents accompagnes dans les dispositifs d&apos;externalisation</span>
                </div>
                <div className="mini-stat">
                  <strong data-count="24" data-suffix="h">
                    24h
                  </strong>
                  <span>delai de mise en route rapide pour certaines demandes</span>
                </div>
                <div className="mini-stat">
                  <strong data-count="3">3</strong>
                  <span>agences pour rester proches du terrain et des operations</span>
                </div>
                <div className="mini-stat">
                  <strong>RPO</strong>
                  <span>capacite a recruter pour Madagascar, l&apos;Afrique et l&apos;international</span>
                </div>
              </div>
            </div>

            <div className="stack-card">
              <h3>Nos expertises</h3>
              <div className="tag-cloud">
                <span>Administration RH</span>
                <span>Paie</span>
                <span>SIRH digital</span>
                <span>Portage</span>
                <span>Support terrain</span>
                <span>Pilotage multi-sites</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="services">
        <div className="container">
          <div className="section-head" data-reveal>
            <div>
              <span className="eyebrow">Services</span>
              <h2>Une offre d&apos;externalisation claire et operationnelle</h2>
            </div>
            <p>
              Madajob propose des solutions adaptees aux RH, aux directions
              financieres, aux responsables d&apos;exploitation et aux entreprises qui
              veulent gagner en agilite.
            </p>
          </div>

          <div className="card-grid">
            {services.map((service) => (
              <article key={service.number} className="info-card" data-reveal>
                <div className="icon-chip">{service.number}</div>
                <h3>{service.title}</h3>
                <p>{service.text}</p>
                <ul>
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
        <div className="container split">
          <article className="panel" data-reveal>
            <span className="eyebrow">Benefices</span>
            <h3>Pourquoi externaliser avec Madajob</h3>
            <p>
              Externaliser avec Madajob permet d&apos;aller plus vite, de reduire la
              charge interne, de garder une visibilite claire sur les operations et de
              securiser la conformite.
            </p>
            <ul className="panel-list">
              <li>Reponse rapide aux besoins terrain grace a une organisation prete a activer les ressources.</li>
              <li>Reduction des taches administratives et meilleure concentration des equipes internes sur le coeur de metier.</li>
              <li>Suivi RH, paie et reporting regroupes dans un discours plus coherent et plus rassurant.</li>
              <li>Possibilite d&apos;articuler externalisation, recrutement et formation au sein d&apos;un meme partenaire.</li>
            </ul>
          </article>

          <article className="panel quote-card" data-reveal>
            <span className="eyebrow">Positionnement</span>
            <blockquote>
              L&apos;externalisation ne se vend pas seulement sur le volume ou le prix.
              Elle se vend sur la serenite, la vitesse de deploiement et la qualite de
              pilotage visibles des la page.
            </blockquote>
            <footer>Solutions d&apos;externalisation Madajob</footer>
            <div className="badge-row">
              <span className="badge">Promesse claire</span>
              <span className="badge">Pilotage visible</span>
              <span className="badge">Conformite</span>
              <span className="badge">Souplesse operationnelle</span>
            </div>
          </article>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head" data-reveal>
            <div>
              <span className="eyebrow">Deploiement</span>
              <h2>Un processus qui rassure les entreprises des le premier contact</h2>
            </div>
            <p>
              La structure aide a comprendre le chemin complet : cadrage, staffing,
              gestion, suivi et optimisation continue.
            </p>
          </div>

          <div className="process-grid">
            {steps.map((step) => (
              <article key={step.step} className="process-card" data-reveal>
                <span className="process-step">{step.step}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container showcase">
          <article className="showcase-feature" data-reveal>
            <span className="eyebrow">Terrain</span>
            <h3>Une solution pensee pour les operations</h3>
            <p>
              Les responsables d&apos;exploitation doivent sentir rapidement que Madajob
              peut tenir le terrain, gerer les volumes et securiser l&apos;organisation.
            </p>
            <ul className="list-checks">
              <li>Visibilite immediate sur la capacite de deploiement et les volumes geres.</li>
              <li>Discours plus concret sur la mise a disposition et l&apos;encadrement des equipes.</li>
              <li>Ton plus direct, plus commercial et plus rassurant.</li>
            </ul>
          </article>

          <article className="showcase-feature" data-reveal>
            <span className="eyebrow">Pilotage</span>
            <h3>Un pilotage RH structure autour du SIRH</h3>
            <p>
              L&apos;externalisation gagne en credibilite quand les outils, le reporting
              et la gestion administrative sont presentes comme un vrai systeme, pas
              comme une simple option.
            </p>
            <ul className="list-checks">
              <li>Lecture claire de la paie, des documents RH et du suivi operationnel.</li>
              <li>Passerelle naturelle vers le recrutement et la formation pour couvrir l&apos;ensemble du cycle RH.</li>
              <li>CTA mieux places pour transformer l&apos;interet en prise de contact.</li>
            </ul>
          </article>
        </div>
      </section>

      <section className="section" id="contact">
        <div className="container contact-wrap">
          <article className="contact-card glass-panel" data-reveal>
            <h2>Besoin d&apos;externaliser, de porter ou de deployer rapidement ?</h2>
            <p className="lead">
              Confiez vos operations RH a un partenaire capable de deployer rapidement,
              de gerer l&apos;administratif et de securiser le pilotage au quotidien.
            </p>
            <div className="contact-actions">
              <Link className="btn btn-primary" href="mailto:infos@madajob.mg">
                Demander un echange
              </Link>
              <Link className="btn btn-secondary" href="/espace/recruteur">
                Ouvrir la plateforme recruteur
              </Link>
            </div>
          </article>

          <article className="contact-card" data-reveal>
            <span className="eyebrow">Coordonnees</span>
            <ul className="contact-list">
              <li>
                <strong>Email</strong>
                <span>infos@madajob.mg</span>
              </li>
              <li>
                <strong>Telephone</strong>
                <span>+261 34 11 801 19</span>
              </li>
              <li>
                <strong>Horaires</strong>
                <span>Lun - Sam · 08:00 - 18:00</span>
              </li>
              <li>
                <strong>Couverture</strong>
                <span>Madagascar, Afrique, international</span>
              </li>
            </ul>
          </article>
        </div>
      </section>
    </main>
  );
}
