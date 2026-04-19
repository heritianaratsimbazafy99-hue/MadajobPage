import Image from "next/image";
import Link from "next/link";

import airMadagascar from "@/assets/clients/air-madagascar.png";
import bniMadagascar from "@/assets/clients/bni-madagascar.png";
import bmoi from "@/assets/clients/bmoi.jpeg";
import canalPlus from "@/assets/clients/canal-plus.png";
import colas from "@/assets/clients/colas.jpeg";
import freyssinet from "@/assets/clients/freyssinet.jpeg";
import materauto from "@/assets/clients/materauto.jpeg";
import sanifer from "@/assets/clients/sanifer.jpeg";
import star from "@/assets/clients/star.jpeg";
import telma from "@/assets/clients/telma.png";

const partnerLogos = [
  { src: canalPlus, alt: "Canal Plus" },
  { src: airMadagascar, alt: "Air Madagascar" },
  { src: bniMadagascar, alt: "BNI Madagascar" },
  { src: telma, alt: "Telma" },
  { src: colas, alt: "Colas Madagascar" },
  { src: freyssinet, alt: "Freyssinet" },
  { src: materauto, alt: "Materauto" },
  { src: sanifer, alt: "Sanifer" },
  { src: bmoi, alt: "BMOI Groupe BPCE" },
  { src: star, alt: "STAR" }
];

const ecosystemCards = [
  {
    number: "01",
    title: "Recrutement",
    text: "Une promesse claire, des missions au succes et une base de profils plus visible pour les decideurs.",
    items: ["Sourcing cible", "Short-list et entretiens", "Garantie sur periode d'essai"]
  },
  {
    number: "02",
    title: "Formation",
    text: "Des programmes concus pour renforcer les competences, accompagner la montee en responsabilite et soutenir la performance des equipes.",
    items: ["25+ modules", "5 axes de montee en competence", "Suivi mobile des plannings"]
  },
  {
    number: "03",
    title: "Externalisation",
    text: "Une lecture simple des offres de mise a disposition, paie, portage salarial et RPO international.",
    items: ["856 agents geres", "SIRH et reporting", "Activation rapide"]
  },
  {
    number: "04",
    title: "Experience candidat",
    text: "Un parcours simple pour rechercher un emploi, postuler, se former et rester connecte aux meilleures opportunites.",
    items: ["Job portal Jobmada", "iOS & Android", "Prime de cooptation"]
  }
];

const methodSteps = [
  {
    step: "1",
    title: "Cadrer",
    text: "Clarifier le besoin, l'urgence, le type de contrat et les competences critiques a recruter ou a deleguer."
  },
  {
    step: "2",
    title: "Sourcer",
    text: "Mobiliser la base de 40 000+ profils, les campagnes digitales, le portail carriere et la cooptation pour accelerer la recherche."
  },
  {
    step: "3",
    title: "Evaluer",
    text: "Conduire des entretiens plus fluides, utiliser le Smart Interview et fiabiliser la short-list avant presentation."
  },
  {
    step: "4",
    title: "Activer",
    text: "Finaliser l'integration, la gestion administrative, la formation ou l'externalisation selon le scenario choisi par le client."
  }
];

const testimonials = [
  {
    quote:
      "Une prise en charge serieuse, avec une vraie energie positive pendant les entretiens et le suivi.",
    name: "Angela Rak",
    role: "Assistante de direction"
  },
  {
    quote:
      "Un accompagnement apprecie pour son devouement, sa courtoisie et sa qualite de relation pendant les missions.",
    name: "Narindra Rabe",
    role: "Freelance"
  },
  {
    quote:
      "Un process rapide et rassurant, avec un entretien obtenu des le lendemain de l'inscription sur la plateforme.",
    name: "Rivo Andria",
    role: "Gestionnaire performance"
  },
  {
    quote:
      "Une sensation de serieux commercial et de proximite qui credibilise la marque aupres des talents et des clients.",
    name: "Tahiry Ratovohery",
    role: "Responsable performance"
  }
];

export default function HomePage() {
  return (
    <main>
      <section className="hero">
        <div className="container hero__grid">
          <div>
            <p className="eyebrow">Cabinet RH & plateforme emploi</p>
            <h1>Le partenaire RH qui accelere vos recrutements et vos carrieres</h1>
            <p className="hero__lead">
              Madajob connecte les entreprises, les talents et les equipes RH autour
              d&apos;une offre complete de recrutement, de formation et
              d&apos;externalisation pour repondre plus vite aux besoins du marche.
            </p>
            <div className="hero__actions">
              <Link className="btn btn-primary" href="/entreprise">
                Decouvrir nos solutions RH
              </Link>
              <Link className="btn btn-secondary" href="/candidats">
                Voir l&apos;espace candidat
              </Link>
              <Link className="btn btn-ghost" href="/espace">
                Espace candidat / recruteur
              </Link>
            </div>
            <ul className="hero-points">
              <li>Recrutement au succes</li>
              <li>Formation blended learning</li>
              <li>Externalisation & RPO</li>
              <li>Portail carriere & appli mobile</li>
            </ul>
          </div>

          <div className="hero-panel">
            <div className="stat-card">
              <span>Tableau de bord Madajob</span>
              <strong>40 000+ profils qualifies</strong>
              <p>
                Un ecosysteme RH structure pour transformer un besoin en short-list
                qualifiee et une candidature en opportunite concrete.
              </p>
            </div>
            <div className="metric-stack">
              <article className="mini-panel">
                <strong>454</strong>
                <span>missions de recrutement prises en charge</span>
              </article>
              <article className="mini-panel">
                <strong>856</strong>
                <span>agents geres en externalisation</span>
              </article>
              <article className="mini-panel">
                <strong>25+</strong>
                <span>modules de formation sur 5 axes</span>
              </article>
              <article className="mini-panel">
                <strong>274</strong>
                <span>offres actives et visibles</span>
              </article>
            </div>
          </div>
        </div>
      </section>

      <section className="metric-band">
        <div className="container metric-grid">
          <article className="metric-card">
            <span className="metric-value">18 ans</span>
            <p className="metric-label">
              d&apos;experience consolidee depuis 2008 dans le recrutement et
              l&apos;accompagnement RH.
            </p>
          </article>
          <article className="metric-card">
            <span className="metric-value">274</span>
            <p className="metric-label">
              offres mises en avant pour alimenter un tunnel candidat plus vivant et plus credible.
            </p>
          </article>
          <article className="metric-card">
            <span className="metric-value">5</span>
            <p className="metric-label">
              axes de formation pour accompagner managers, commerciaux, equipes terrain et fonctions support.
            </p>
          </article>
          <article className="metric-card">
            <span className="metric-value">3</span>
            <p className="metric-label">
              agences pour rester proche du terrain tout en industrialisant l&apos;experience client.
            </p>
          </article>
        </div>
      </section>

      <section className="section section--muted">
        <div className="container">
          <div className="section-heading">
            <p className="eyebrow">References clients</p>
            <h2>Des marques majeures nous font deja confiance</h2>
            <p className="section-copy">
              Madajob accompagne deja des entreprises de reference dans leurs enjeux
              de recrutement, de formation, d&apos;externalisation et de performance RH.
            </p>
          </div>

          <div className="partners-grid partners-grid--wide">
            {partnerLogos.map((logo) => (
              <div key={logo.alt} className="partner-card">
                <Image src={logo.src} alt={logo.alt} width={180} height={84} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-heading">
            <p className="eyebrow">Ecosysteme</p>
            <h2>Une offre RH complete pour entreprises et talents</h2>
            <p className="section-copy">
              Madajob reunit dans un meme ecosysteme les services essentiels pour
              recruter, former, externaliser et accompagner les parcours professionnels
              avec plus d&apos;efficacite.
            </p>
          </div>

          <div className="job-grid">
            {ecosystemCards.map((card) => (
              <article key={card.number} className="panel info-card-next">
                <span className="icon-chip">{card.number}</span>
                <h3>{card.title}</h3>
                <p>{card.text}</p>
                <ul className="list-checks">
                  {card.items.map((item) => (
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
            <p className="eyebrow">Valeur</p>
            <h2>Pourquoi les entreprises et les talents choisissent Madajob</h2>
            <p>
              Madajob s&apos;appuie sur une methodologie claire, une vraie connaissance
              du terrain et une offre complete pour repondre a chaque besoin RH avec precision.
            </p>
            <ul className="list-checks">
              <li>Des parcours dedies pour les entreprises, les candidats, la formation et l&apos;externalisation.</li>
              <li>Un vivier de profils qualifies, une experience eprouvee et des references fortes sur le marche malgache.</li>
              <li>Des solutions activables rapidement selon l&apos;urgence, le volume et la complexite du besoin.</li>
              <li>Un accompagnement de proximite pour securiser chaque etape, du brief a l&apos;integration.</li>
            </ul>
          </article>

          <article className="panel quote-panel">
            <p className="eyebrow">Vision</p>
            <blockquote>
              Madajob a vocation a simplifier le recrutement, a rendre les meilleures
              opportunites plus accessibles et a devenir la plateforme de reference
              entre entreprises et talents a Madagascar.
            </blockquote>
            <footer>Createur d&apos;opportunites</footer>
            <div className="badge-row">
              <span className="badge">Reactivite</span>
              <span className="badge">Expertise terrain</span>
              <span className="badge">Solutions sur mesure</span>
              <span className="badge">Accompagnement durable</span>
            </div>
          </article>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-heading">
            <p className="eyebrow">Methode</p>
            <h2>Une methode claire pour securiser chaque mission</h2>
            <p className="section-copy">
              De l&apos;expression du besoin jusqu&apos;a l&apos;integration, Madajob
              mobilise un process structure pour fiabiliser les recrutements, reduire
              les delais et ameliorer la qualite des resultats.
            </p>
          </div>

          <div className="process-grid">
            {methodSteps.map((step) => (
              <article key={step.step} className="process-card">
                <span className="process-step">{step.step}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container showcase-grid">
          <article className="panel showcase-card">
            <p className="eyebrow">Candidat</p>
            <h3>Un parcours candidat simple, rapide et accessible</h3>
            <p>
              Les candidats trouvent rapidement les offres, postulent en ligne,
              accedent a l&apos;application mobile et restent connectes aux opportunites
              qui correspondent a leur profil.
            </p>
            <ul className="list-checks">
              <li>Acces direct aux offres via la page carriere et le Job Portal.</li>
              <li>Application mobile Android et iOS pour rechercher et postuler en mobilite.</li>
              <li>Programme de cooptation avec prime de 100 000 Ar si la recommandation est retenue.</li>
            </ul>
            <div className="hero__actions">
              <Link className="btn btn-primary" href="/candidats">
                Voir l&apos;experience candidat
              </Link>
              <Link className="btn btn-secondary" href="/espace/candidat">
                Ouvrir la plateforme candidat
              </Link>
            </div>
          </article>

          <article className="panel showcase-card">
            <p className="eyebrow">Entreprise</p>
            <h3>Une offre claire pour les recruteurs et les decideurs</h3>
            <p>
              Les entreprises identifient immediatement les solutions disponibles,
              les preuves de capacite et les leviers a activer pour accelerer leurs recrutements.
            </p>
            <ul className="list-checks">
              <li>Promesse commerciale lisible et rassurante des le premier ecran.</li>
              <li>Meilleure articulation entre recrutement, paie, mise a disposition et RPO.</li>
              <li>CTA directs pour parler a un consultant et lancer une mission plus rapidement.</li>
            </ul>
            <div className="hero__actions">
              <Link className="btn btn-primary" href="/entreprise">
                Voir l&apos;espace entreprise
              </Link>
              <Link className="btn btn-secondary" href="/espace/recruteur">
                Ouvrir la plateforme recruteur
              </Link>
            </div>
          </article>
        </div>
      </section>

      <section className="section section--muted">
        <div className="container">
          <div className="section-heading">
            <p className="eyebrow">Preuves sociales</p>
            <h2>Des temoignages qui humanisent la marque</h2>
          </div>
          <div className="testimonial-grid">
            {testimonials.map((testimonial) => (
              <article key={testimonial.name} className="panel testimonial-card-next">
                <p>{testimonial.quote}</p>
                <strong>{testimonial.name}</strong>
                <span>{testimonial.role}</span>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="contact">
        <div className="container contact-wrap">
          <article className="panel contact-card-next contact-card-next--accent">
            <h2>Parlons de vos recrutements, de vos formations et de vos besoins RH</h2>
            <p className="hero__lead">
              Besoin de recruter, de renforcer les competences de vos equipes ou
              d&apos;externaliser une partie de votre activite RH ? Madajob vous accompagne
              avec des solutions concretes et operationnelles.
            </p>
            <div className="hero__actions">
              <Link className="btn btn-primary" href="mailto:infos@madajob.mg">
                Ecrire a infos@madajob.mg
              </Link>
              <Link className="btn btn-secondary" href="/espace">
                Ouvrir l&apos;espace candidat / recruteur
              </Link>
            </div>
          </article>

          <article className="panel contact-card-next">
            <p className="eyebrow">Coordonnees</p>
            <ul className="contact-list">
              <li>
                <strong>Adresse</strong>
                <span>Lot VK 04 Morarano Fenomanana, Antananarivo</span>
              </li>
              <li>
                <strong>Telephone</strong>
                <span>+261 34 11 801 19</span>
              </li>
              <li>
                <strong>Email</strong>
                <span>infos@madajob.mg</span>
              </li>
              <li>
                <strong>Horaires</strong>
                <span>Lun - Sam · 08:00 - 18:00</span>
              </li>
            </ul>
          </article>
        </div>
      </section>
    </main>
  );
}
