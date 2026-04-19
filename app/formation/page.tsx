import Link from "next/link";

const programs = [
  {
    number: "01",
    title: "Management",
    text: "Developper les leaders, les managers intermediaires et les responsables d'equipe.",
    items: ["Leadership et posture manageriale", "Animation d'equipe", "Communication et feedback"]
  },
  {
    number: "02",
    title: "Marketing & Commercial",
    text: "Renforcer la prospection, la relation client et la performance commerciale.",
    items: ["Techniques de vente", "Negociation commerciale", "Culture client et fidelisation"]
  },
  {
    number: "03",
    title: "Efficacite & Productivite",
    text: "Aider les equipes a mieux s'organiser, piloter et prioriser leur travail.",
    items: ["Organisation personnelle", "Gestion du temps", "Pilotage de l'activite"]
  },
  {
    number: "04",
    title: "Developpement personnel",
    text: "Travailler les soft skills cles pour la relation, la confiance et la progression durable.",
    items: ["Prise de parole", "Gestion du stress", "Posture professionnelle"]
  },
  {
    number: "05",
    title: "Langues, technique & outils",
    text: "Consolider les competences pratiques utiles sur le terrain et dans les fonctions support.",
    items: ["Langues appliquees au metier", "Outils bureautiques et digitaux", "Competences techniques ciblees"]
  },
  {
    number: "+",
    title: "Formats sur mesure",
    text: "Des parcours adaptables selon vos objectifs, votre secteur d'activite et le niveau de vos equipes.",
    items: ["Diagnostics de besoin", "Parcours intra-entreprise", "Sessions personnalisees"]
  }
];

const deploymentSteps = [
  {
    step: "1",
    title: "Diagnostiquer",
    text: "Identifier les priorites de montee en competence a partir des enjeux metier, manageriaux ou commerciaux."
  },
  {
    step: "2",
    title: "Construire",
    text: "Assembler les bons modules, les bons formats et le bon rythme selon le contexte de l'entreprise."
  },
  {
    step: "3",
    title: "Former",
    text: "Deployer les sessions en blended learning avec une experience plus fluide pour les participants."
  },
  {
    step: "4",
    title: "Suivre",
    text: "Mesurer l'impact, relancer les apprenants et articuler la formation avec la performance terrain."
  }
];

export default function FormationPage() {
  return (
    <main className="page page-formation">
      <section className="hero">
        <div className="container hero-grid">
          <div data-reveal>
            <span className="eyebrow">Upskilling & blended learning</span>
            <h1>Des formations concues pour developper la performance</h1>
            <p className="lead">
              Les formations Madajob accompagnent la montee en competence des equipes
              grace a des parcours structures, une approche blended learning et des
              contenus adaptes aux realites du terrain.
            </p>
            <div className="hero-actions">
              <Link className="btn btn-primary" href="#programmes">
                Voir les axes de formation
              </Link>
              <Link className="btn btn-secondary" href="mailto:infos@madajob.mg">
                Demander un accompagnement
              </Link>
              <Link className="btn btn-ghost" href="/espace">
                Notre plateforme de recrutement
              </Link>
            </div>
            <ul className="hero-points">
              <li>Parcours en entreprise</li>
              <li>Sessions blended</li>
              <li>Suivi mobile</li>
              <li>Impact business mesurable</li>
            </ul>
          </div>

          <div className="glass-panel hero-visual" data-reveal>
            <div className="stack-card">
              <h3>Catalogue formation Madajob</h3>
              <p>
                Des thematiques claires, des modules activables rapidement et une
                methode pedagogique concue pour produire des resultats concrets.
              </p>
              <div className="visual-grid">
                <div className="mini-stat">
                  <strong data-count="25" data-suffix="+">
                    25+
                  </strong>
                  <span>modules mobilisables en intra ou sur mesure</span>
                </div>
                <div className="mini-stat">
                  <strong data-count="5">5</strong>
                  <span>axes pour couvrir management, commerce, efficacite, soft skills et outils</span>
                </div>
                <div className="mini-stat">
                  <strong>Blended</strong>
                  <span>presentiel, distanciel, coaching et suivi des plannings</span>
                </div>
                <div className="mini-stat">
                  <strong>Mobile</strong>
                  <span>notifications et visibilite sur les sessions utiles</span>
                </div>
              </div>
            </div>

            <div className="stack-card">
              <h3>Promesse pedagogique</h3>
              <div className="tag-cloud">
                <span>Approche terrain</span>
                <span>Cas concrets</span>
                <span>Managers</span>
                <span>Commerciaux</span>
                <span>Fonctions support</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="programmes">
        <div className="container">
          <div className="section-head" data-reveal>
            <div>
              <span className="eyebrow">Programme</span>
              <h2>5 axes pour couvrir l&apos;essentiel de la montee en competence</h2>
            </div>
            <p>
              Les formations sont organisees en grands axes pour aider les entreprises
              a identifier rapidement les parcours les plus adaptes a leurs enjeux.
            </p>
          </div>

          <div className="card-grid">
            {programs.slice(0, 4).map((program) => (
              <article key={program.number} className="info-card" data-reveal>
                <div className="icon-chip">{program.number}</div>
                <h3>{program.title}</h3>
                <p>{program.text}</p>
                <ul>
                  {program.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>

          <div className="card-grid">
            {programs.slice(4).map((program) => (
              <article key={program.number} className="info-card" data-reveal>
                <div className="icon-chip">{program.number}</div>
                <h3>{program.title}</h3>
                <p>{program.text}</p>
                <ul>
                  {program.items.map((item) => (
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
            <span className="eyebrow">Methode</span>
            <h3>Une approche blended learning mieux valorisee</h3>
            <p>
              Madajob s&apos;appuie sur le blended learning pour associer presentiel,
              distanciel et accompagnement terrain dans des parcours plus efficaces et
              plus durables.
            </p>
            <ul className="panel-list">
              <li>Combinaison de presentiel, distanciel, coaching et suivi digital.</li>
              <li>Plannings consultables plus simplement depuis l&apos;ecosysteme mobile.</li>
              <li>Parcours penses pour creer de la continuite entre formation et performance terrain.</li>
              <li>Un langage plus business, plus utile pour vendre les formations en B2B.</li>
            </ul>
          </article>

          <article className="panel quote-card" data-reveal>
            <span className="eyebrow">Impact</span>
            <blockquote>
              Une page formation efficace ne doit pas seulement lister des themes.
              Elle doit donner envie d&apos;investir, montrer la methode et aider a
              imaginer les resultats pour les equipes.
            </blockquote>
            <footer>Offre formation Madajob</footer>
            <div className="badge-row">
              <span className="badge">Clarte du catalogue</span>
              <span className="badge">Preuve pedagogique</span>
              <span className="badge">CTA B2B renforces</span>
              <span className="badge">Parcours mobile</span>
            </div>
          </article>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head" data-reveal>
            <div>
              <span className="eyebrow">Deploiement</span>
              <h2>Un dispositif plus credible pour les entreprises</h2>
            </div>
            <p>
              Les decideurs veulent comprendre rapidement comment la formation se
              deploie, qui elle concerne et comment elle peut etre integree a une
              trajectoire RH plus large.
            </p>
          </div>

          <div className="process-grid">
            {deploymentSteps.map((step) => (
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
            <span className="eyebrow">Pour l&apos;entreprise</span>
            <h3>Une offre claire pour accompagner la performance des equipes</h3>
            <p>
              Les entreprises identifient rapidement les axes de formation les plus
              pertinents pour renforcer le management, la performance commerciale et
              l&apos;efficacite operationnelle.
            </p>
            <ul className="list-checks">
              <li>Presentation plus moderne des thematiques et des benefices attendus.</li>
              <li>Discours recentre sur la montee en performance, pas seulement sur le catalogue.</li>
              <li>Liens naturels avec le recrutement, l&apos;onboarding et le developpement des equipes.</li>
            </ul>
          </article>

          <article className="showcase-feature" data-reveal>
            <span className="eyebrow">Pour le participant</span>
            <h3>Une experience fluide entre decouverte, inscription et suivi</h3>
            <p>
              Les collaborateurs visualisent plus facilement les thematiques
              disponibles, les formats proposes et la valeur concrete de chaque
              parcours.
            </p>
            <ul className="list-checks">
              <li>Visibilite des sessions et des modules qui les concernent.</li>
              <li>Integration de la formation dans l&apos;application mobile et le parcours digital.</li>
              <li>Ton plus inspirant pour declencher l&apos;inscription.</li>
            </ul>
          </article>
        </div>
      </section>

      <section className="section" id="contact">
        <div className="container contact-wrap">
          <article className="contact-card glass-panel" data-reveal>
            <h2>Parlons de vos besoins de montee en competence</h2>
            <p className="lead">
              Renforcez les competences de vos equipes avec des programmes adaptes a
              vos objectifs, a votre secteur et au rythme de votre organisation.
            </p>
            <div className="contact-actions">
              <Link className="btn btn-primary" href="mailto:infos@madajob.mg">
                Demander un echange
              </Link>
              <Link className="btn btn-secondary" href="/espace">
                Notre plateforme de recrutement
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
                <strong>Accompagnement</strong>
                <span>Catalogue, sur mesure, blended learning et suivi</span>
              </li>
            </ul>
          </article>
        </div>
      </section>
    </main>
  );
}
