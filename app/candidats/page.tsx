import Link from "next/link";

const tools = [
  {
    number: "01",
    title: "Page carriere",
    text: "Un acces direct aux offres pour trier plus vite ce qui vous correspond et postuler sans detour.",
    items: ["Offres classees par theme", "Soumission en ligne", "Suivi plus clair"]
  },
  {
    number: "02",
    title: "Application mobile",
    text: "Une continuite mobile pour emporter votre recherche d'emploi, vos candidatures et vos notifications partout.",
    items: ["Compatible Android", "Compatible iOS", "Plannings de formation"]
  },
  {
    number: "03",
    title: "Smart Interview",
    text: "Des entretiens en ligne mieux integres pour fluidifier la preselection et accelerer les retours.",
    items: ["Gain de temps", "Meilleure preparation", "Process plus rapide"]
  },
  {
    number: "04",
    title: "Cooptation",
    text: "Un dispositif simple pour recommander un profil de votre reseau et recevoir une prime si le candidat est retenu.",
    items: ["100 000 Ar de prime", "Reference d'offre a renseigner", "Demarche digitale"]
  }
];

const steps = [
  {
    step: "1",
    title: "Creer son profil",
    text: "Enregistrer ses coordonnees, son CV et ses preferences pour rester visible par les recruteurs."
  },
  {
    step: "2",
    title: "Reperer les bonnes offres",
    text: "Utiliser la page carriere et Jobmada pour cibler plus vite les postes les plus pertinents."
  },
  {
    step: "3",
    title: "Postuler sans friction",
    text: "Envoyer sa candidature en ligne, depuis desktop ou mobile, puis preparer sereinement les entretiens."
  },
  {
    step: "4",
    title: "Activer son reseau",
    text: "Recommander une personne, suivre les formations disponibles et rester connecte a l'ecosysteme Madajob."
  }
];

const jobs = [
  {
    number: "A",
    title: "Responsable maintenance",
    text: "Fonctions techniques et industrielles presentees avec des CTA de candidature plus visibles."
  },
  {
    number: "B",
    title: "Assistante administrative & RH",
    text: "Roles support, administratifs et RH mis en avant de maniere plus lisible sur mobile comme sur desktop."
  },
  {
    number: "C",
    title: "Responsable commercial",
    text: "Opportunites commerciales valorisees avec un meilleur contexte, plus de preuves et un chemin de candidature simplifie."
  },
  {
    number: "D",
    title: "Expert(e) en comptabilite",
    text: "Les metiers experts gagnent en lisibilite grace a une structure de page plus editoriale et plus credible."
  }
];

export default function CandidatsPage() {
  return (
    <main className="page page-candidat">
      <section className="hero">
        <div className="container hero-grid">
          <div data-reveal>
            <span className="eyebrow">Parcours talent</span>
            <h1>Trouvez plus vite le poste qui vous correspond</h1>
            <p className="lead">
              Retrouvez les offres, le portail carriere, l&apos;application mobile, les
              entretiens en ligne et la cooptation dans un parcours fluide pour avancer
              plus vite vers votre prochain poste.
            </p>
            <div className="hero-actions">
              <Link className="btn btn-primary" href="/carrieres">
                Voir les offres
              </Link>
              <Link className="btn btn-secondary" href="/espace/candidat">
                Notre plateforme de recrutement
              </Link>
              <Link className="btn btn-ghost" href="#contact">
                Contacter l&apos;equipe
              </Link>
            </div>
            <ul className="hero-points">
              <li>Inscription rapide</li>
              <li>Application mobile</li>
              <li>Smart Interview</li>
              <li>Cooptation recompensee</li>
            </ul>
          </div>

          <div className="glass-panel hero-visual" data-reveal>
            <div className="stack-card">
              <h3>Portail carriere Madajob</h3>
              <p>
                Consultez les postes ouverts, reperez les opportunites qui vous
                correspondent et postulez rapidement depuis ordinateur ou mobile.
              </p>
              <div className="visual-grid">
                <div className="mini-stat">
                  <strong data-count="274">274</strong>
                  <span>offres visibles en un coup d&apos;oeil</span>
                </div>
                <div className="mini-stat">
                  <strong data-count="40000" data-suffix="+">
                    40 000+
                  </strong>
                  <span>profils deja enregistres dans l&apos;ecosysteme</span>
                </div>
                <div className="mini-stat">
                  <strong data-count="100000" data-suffix=" Ar">
                    100 000 Ar
                  </strong>
                  <span>prime de cooptation pour une recommandation retenue</span>
                </div>
                <div className="mini-stat">
                  <strong>iOS & Android</strong>
                  <span>l&apos;application suit l&apos;emploi, la candidature et la formation</span>
                </div>
              </div>
            </div>

            <div className="stack-card">
              <h3>Experience candidate renforcee</h3>
              <div className="tag-cloud">
                <span>Alertes d&apos;offres</span>
                <span>Postuler en ligne</span>
                <span>Entretiens digitaux</span>
                <span>Conseillers Madajob</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head" data-reveal>
            <div>
              <span className="eyebrow">Atouts</span>
              <h2>Tous les outils pour postuler plus facilement</h2>
            </div>
            <p>
              Madajob met a votre disposition les bons outils pour rechercher un
              emploi, suivre les offres et rester visible aupres des recruteurs.
            </p>
          </div>

          <div className="card-grid">
            {tools.map((tool) => (
              <article key={tool.number} className="info-card" data-reveal>
                <div className="icon-chip">{tool.number}</div>
                <h3>{tool.title}</h3>
                <p>{tool.text}</p>
                <ul>
                  {tool.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head" data-reveal>
            <div>
              <span className="eyebrow">Parcours</span>
              <h2>Comment avancer plus vite vers votre prochain poste</h2>
            </div>
            <p>
              Chaque etape du parcours est pensee pour vous aider a passer de la
              recherche d&apos;emploi a la candidature, puis a l&apos;entretien, avec plus
              de simplicite.
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
        <div className="container split">
          <article className="panel" data-reveal>
            <span className="eyebrow">Espace personnel</span>
            <h3>Un candidat mieux guide, donc plus engage</h3>
            <p>
              Madajob vous accompagne au-dela des annonces en vous donnant acces aux
              outils, aux conseils et aux opportunites qui facilitent votre progression
              professionnelle.
            </p>
            <ul className="panel-list">
              <li>Acces direct aux offres depuis la page carriere et le portail Jobmada.</li>
              <li>Application mobile pour emporter les outils de recherche d&apos;emploi et d&apos;inscription.</li>
              <li>Fonction formation pour suivre les plannings et recevoir les modules pertinents.</li>
              <li>Possibilite de discuter plus facilement avec les conseillers et de preparer les etapes suivantes.</li>
            </ul>
          </article>

          <article className="panel quote-card" data-reveal>
            <span className="eyebrow">Opportunites</span>
            <blockquote>
              Un candidat qui comprend vite ce qu&apos;il peut faire sur le site postule
              davantage, revient plus souvent et recommande plus volontiers la
              plateforme a son entourage.
            </blockquote>
            <footer>Createur d&apos;opportunites</footer>
            <div className="badge-row">
              <span className="badge">Postuler plus vite</span>
              <span className="badge">Mieux se preparer</span>
              <span className="badge">Rester visible</span>
              <span className="badge">Activer la cooptation</span>
            </div>
          </article>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head" data-reveal>
            <div>
              <span className="eyebrow">Exemples d&apos;offres</span>
              <h2>Les opportunites sont mises en scene plus clairement</h2>
            </div>
            <p>
              La page met en avant des roles concrets pour rendre la promesse plus
              tangible des l&apos;atterrissage.
            </p>
          </div>

          <div className="card-grid">
            {jobs.map((job) => (
              <article key={job.number} className="info-card" data-reveal>
                <div className="icon-chip">{job.number}</div>
                <h3>{job.title}</h3>
                <p>{job.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="contact">
        <div className="container contact-wrap">
          <article className="contact-card glass-panel" data-reveal>
            <h2>Envie de postuler ou de recommander un talent ?</h2>
            <p className="lead">
              Accedez rapidement aux offres, postulez facilement et gardez toutes les
              informations utiles a portee de main, sur desktop comme sur mobile.
            </p>
            <div className="contact-actions">
              <Link className="btn btn-primary" href="/carrieres">
                Acceder aux offres
              </Link>
              <Link className="btn btn-secondary" href="/espace/candidat">
                Ouvrir la plateforme candidat
              </Link>
            </div>
          </article>

          <article className="contact-card" data-reveal>
            <span className="eyebrow">Contact candidat</span>
            <ul className="contact-list">
              <li>
                <strong>Email recrutement</strong>
                <span>recrutement@madajob.mg</span>
              </li>
              <li>
                <strong>Email general</strong>
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
            </ul>
          </article>
        </div>
      </section>
    </main>
  );
}
