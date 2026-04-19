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
  }
];

export default function FormationPage() {
  return (
    <main className="page-shell">
      <section className="hero">
        <div className="container hero__grid">
          <div>
            <p className="eyebrow">Upskilling & blended learning</p>
            <h1>Des formations concues pour developper la performance</h1>
            <p className="hero__lead">
              Les formations Madajob accompagnent la montee en competence des equipes
              grace a des parcours structures, une approche blended learning et des
              contenus adaptes aux realites du terrain.
            </p>
            <div className="hero__actions">
              <Link className="btn btn-primary" href="#programmes">
                Voir les axes de formation
              </Link>
              <Link className="btn btn-secondary" href="mailto:infos@madajob.mg">
                Demander un accompagnement
              </Link>
              <Link className="btn btn-ghost" href="/espace">
                Espace candidat / recruteur
              </Link>
            </div>
          </div>

          <div className="hero-panel">
            <div className="stat-card">
              <span>Catalogue formation Madajob</span>
              <strong>25+ modules sur 5 axes</strong>
              <p>
                Des thematiques claires, des modules activables rapidement et une
                methode pedagogique concue pour produire des resultats concrets.
              </p>
            </div>
            <div className="metric-stack">
              <article className="mini-panel">
                <strong>Blended</strong>
                <span>presentiel, distanciel, coaching et suivi des plannings</span>
              </article>
              <article className="mini-panel">
                <strong>Mobile</strong>
                <span>notifications et visibilite sur les sessions utiles</span>
              </article>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="programmes">
        <div className="container">
          <div className="section-heading">
            <p className="eyebrow">Programme</p>
            <h2>5 axes pour couvrir l&apos;essentiel de la montee en competence</h2>
          </div>
          <div className="job-grid">
            {programs.map((program) => (
              <article key={program.number} className="panel info-card-next">
                <span className="icon-chip">{program.number}</span>
                <h3>{program.title}</h3>
                <p>{program.text}</p>
                <ul className="list-checks">
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
        <div className="container split-grid">
          <article className="panel">
            <p className="eyebrow">Methode</p>
            <h2>Une approche blended learning mieux valorisee</h2>
            <ul className="list-checks">
              <li>Combinaison de presentiel, distanciel, coaching et suivi digital.</li>
              <li>Plannings consultables plus simplement depuis l&apos;ecosysteme mobile.</li>
              <li>Parcours penses pour creer de la continuite entre formation et performance terrain.</li>
              <li>Un langage plus business, plus utile pour vendre les formations en B2B.</li>
            </ul>
          </article>

          <article className="panel quote-panel">
            <p className="eyebrow">Impact</p>
            <blockquote>
              Une page formation efficace ne doit pas seulement lister des themes. Elle
              doit donner envie d&apos;investir, montrer la methode et aider a imaginer les resultats.
            </blockquote>
            <footer>Offre formation Madajob</footer>
          </article>
        </div>
      </section>
    </main>
  );
}
