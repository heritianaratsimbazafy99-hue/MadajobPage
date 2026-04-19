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

const steps = [
  {
    step: "1",
    title: "Recueillir le brief",
    text: "Comprendre le poste, les exigences, le contexte, le timing et les criteres non negociables."
  },
  {
    step: "2",
    title: "Sourcer et filtrer",
    text: "Activer la base de profils, les canaux Madajob et les campagnes ciblees pour constituer une short-list solide."
  },
  {
    step: "3",
    title: "Evaluer et presenter",
    text: "Fiabiliser les profils retenus grace aux entretiens, a l'analyse et aux recommandations argumentees."
  },
  {
    step: "4",
    title: "Securiser l'integration",
    text: "Accompagner la prise de poste avec une garantie pendant la periode d'essai et des relais possibles en formation ou externalisation."
  }
];

export default function EntreprisePage() {
  return (
    <main className="page page-entreprise">
      <section className="hero">
        <div className="container hero-grid">
          <div data-reveal>
            <span className="eyebrow">Partenaire de recrutement</span>
            <h1>Recrutez plus vite les bons profils pour votre entreprise</h1>
            <p className="lead">
              Madajob accompagne les entreprises avec un vivier de profils qualifies,
              un recrutement au succes, une garantie sur periode d&apos;essai et des
              solutions RH complementaires selon vos besoins.
            </p>
            <div className="hero-actions">
              <Link className="btn btn-primary" href="mailto:infos@madajob.mg">
                Parler a un consultant
              </Link>
              <Link className="btn btn-secondary" href="/externalisation">
                Voir l&apos;externalisation
              </Link>
              <Link className="btn btn-ghost" href="/espace/recruteur">
                Notre plateforme de recrutement
              </Link>
            </div>
            <ul className="hero-points">
              <li>Recrutement au succes</li>
              <li>Short-list qualifiees</li>
              <li>Garantie d&apos;integration</li>
              <li>Solutions RH combinees</li>
            </ul>
          </div>

          <div className="glass-panel hero-visual" data-reveal>
            <div className="stack-card">
              <h3>Recrutement, evaluation et conseil RH</h3>
              <p>
                Madajob aide les dirigeants, les RH et les managers a identifier
                rapidement les solutions les plus adaptees pour recruter, structurer et
                securiser leurs equipes.
              </p>
              <div className="visual-grid">
                <div className="mini-stat">
                  <strong data-count="454">454</strong>
                  <span>missions de recrutement deja prises en charge</span>
                </div>
                <div className="mini-stat">
                  <strong data-count="40000" data-suffix="+">
                    40 000+
                  </strong>
                  <span>profils disponibles dans l&apos;ecosysteme Madajob</span>
                </div>
                <div className="mini-stat">
                  <strong data-count="3">3</strong>
                  <span>agences pour un sourcing plus proche du terrain</span>
                </div>
                <div className="mini-stat">
                  <strong>Success fee</strong>
                  <span>paiement lie au resultat, avec garantie sur l&apos;essai</span>
                </div>
              </div>
            </div>

            <div className="stack-card">
              <h3>Levier business</h3>
              <div className="tag-cloud">
                <span>CDI</span>
                <span>CDD</span>
                <span>Prestations</span>
                <span>Evaluation</span>
                <span>Onboarding</span>
                <span>Conseil RH</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="offres">
        <div className="container">
          <div className="section-head" data-reveal>
            <div>
              <span className="eyebrow">Solutions</span>
              <h2>Des solutions RH concues pour decider plus vite</h2>
            </div>
            <p>
              Madajob met a disposition une offre claire pour repondre aux besoins de
              recrutement, d&apos;evaluation, de conseil RH et d&apos;externalisation selon
              chaque contexte.
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
            <span className="eyebrow">Ciblage</span>
            <h3>Des profils et secteurs mieux contextualises</h3>
            <p>
              L&apos;enjeu n&apos;est pas seulement de dire que Madajob recrute. Il faut
              montrer clairement dans quels contextes, pour quels types de metiers et
              avec quel niveau d&apos;accompagnement.
            </p>
            <ul className="panel-list">
              <li>Fonctions techniques, support, commerciales, administratives et manageriales.</li>
              <li>Secteurs varies : industrie, distribution, services, terrain, fonctions siege et environnements en forte croissance.</li>
              <li>Possibilite de basculer vers l&apos;externalisation ou la formation quand le besoin le justifie.</li>
              <li>Discours plus credible pour les decideurs qui comparent plusieurs prestataires RH.</li>
            </ul>
          </article>

          <article className="panel quote-card" data-reveal>
            <span className="eyebrow">Garantie</span>
            <blockquote>
              Une bonne page entreprise doit donner trois signaux tres vite :
              l&apos;etendue du vivier, la methode de selection et le niveau
              d&apos;engagement que le prestataire est pret a prendre.
            </blockquote>
            <footer>Solutions entreprise Madajob</footer>
            <div className="badge-row">
              <span className="badge">Base talents visible</span>
              <span className="badge">Methode explicite</span>
              <span className="badge">Garantie rassurante</span>
              <span className="badge">CTA B2B forts</span>
            </div>
          </article>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head" data-reveal>
            <div>
              <span className="eyebrow">Methode</span>
              <h2>Un tunnel commercial plus clair pour les entreprises</h2>
            </div>
            <p>
              Le process Madajob securise chaque etape, du brief initial jusqu&apos;a
              l&apos;integration du candidat retenu, avec un niveau d&apos;exigence adapte
              a vos enjeux.
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
            <span className="eyebrow">Recrutement</span>
            <h3>Une offre solide pour les decideurs et les recruteurs</h3>
            <p>
              Les entreprises retrouvent rapidement les preuves de capacite, la
              methodologie et les garanties necessaires pour confier leurs recrutements
              a Madajob.
            </p>
            <ul className="list-checks">
              <li>Preuves visibles des le hero : missions, profils, agences, garantie.</li>
              <li>Arguments commerciaux plus nets et mieux hierarchises.</li>
              <li>CTA penses pour declencher le brief ou la prise de contact immediatement.</li>
            </ul>
          </article>

          <article className="showcase-feature" data-reveal>
            <span className="eyebrow">Ecosysteme</span>
            <h3>Une offre connectee a l&apos;ensemble des solutions Madajob</h3>
            <p>
              Les besoins evoluent souvent au fil des missions. Madajob permet
              d&apos;enchainer naturellement recrutement, externalisation, formation et
              accompagnement RH.
            </p>
            <ul className="list-checks">
              <li>Externalisation si la vitesse de deploiement prime.</li>
              <li>Formation si l&apos;objectif est de securiser l&apos;onboarding et la performance.</li>
              <li>Portage ou RPO si la mission demande plus de flexibilite ou de volume.</li>
            </ul>
          </article>
        </div>
      </section>

      <section className="section" id="contact">
        <div className="container contact-wrap">
          <article className="contact-card glass-panel" data-reveal>
            <h2>Besoin d&apos;un recrutement plus fluide et plus credible ?</h2>
            <p className="lead">
              Confiez vos recrutements a un partenaire capable d&apos;identifier
              rapidement les bons profils, de fiabiliser la selection et de securiser
              l&apos;integration.
            </p>
            <div className="contact-actions">
              <Link className="btn btn-primary" href="mailto:infos@madajob.mg">
                Envoyer un brief
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
                <strong>Adresse</strong>
                <span>Lot VK 04 Morarano Fenomanana, Antananarivo</span>
              </li>
              <li>
                <strong>Accompagnement</strong>
                <span>Recrutement, formation, externalisation et conseil RH</span>
              </li>
            </ul>
          </article>
        </div>
      </section>
    </main>
  );
}
