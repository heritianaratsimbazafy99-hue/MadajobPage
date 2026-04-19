import Image from "next/image";
import Link from "next/link";

import airMadagascar from "@/assets/clients/air-madagascar.png";
import bniMadagascar from "@/assets/clients/bni-madagascar.png";
import bmoi from "@/assets/clients/bmoi.jpeg";
import canalPlus from "@/assets/clients/canal-plus.png";
import colas from "@/assets/clients/colas.jpeg";
import freyssinet from "@/assets/clients/freyssinet.jpeg";
import logoMadajob from "@/assets/clients/madajob-logo.png";
import materauto from "@/assets/clients/materauto.jpeg";
import sanifer from "@/assets/clients/sanifer.jpeg";
import star from "@/assets/clients/star.jpeg";
import telma from "@/assets/clients/telma.png";

const clients = [
  { src: canalPlus, alt: "Canal+" },
  { src: airMadagascar, alt: "Air Madagascar", className: "logo-card--air", imageClass: "logo-card__img--air" },
  { src: bniMadagascar, alt: "BNI Madagascar", imageClass: "logo-card__img--bni" },
  { src: telma, alt: "Telma", className: "logo-card--telma", imageClass: "logo-card__img--telma" },
  { src: colas, alt: "Colas Madagascar", className: "logo-card--colas", imageClass: "logo-card__img--colas" },
  { src: freyssinet, alt: "Freyssinet" },
  { src: materauto, alt: "Materauto" },
  { src: sanifer, alt: "Sanifer" },
  { src: bmoi, alt: "BMOI Groupe BPCE" },
  { src: star, alt: "STAR", className: "logo-card--star", imageClass: "logo-card__img--star" }
];

export default function HomePage() {
  return (
    <main className="page page-home">
      <section className="hero">
        <div className="container hero-grid">
          <div data-reveal>
            <span className="eyebrow">Cabinet RH & plateforme emploi</span>
            <h1>Le partenaire RH qui accelere vos recrutements et vos carrieres</h1>
            <p className="lead">
              Madajob connecte les entreprises, les talents et les equipes RH autour
              d&apos;une offre complete de recrutement, de formation et d&apos;externalisation
              pour repondre plus vite aux besoins du marche.
            </p>
            <div className="hero-actions">
              <Link className="btn btn-primary" href="/entreprise">
                Decouvrir nos solutions RH
              </Link>
              <Link className="btn btn-secondary" href="/candidats">
                Acceder a l&apos;espace candidat
              </Link>
              <Link className="btn btn-ghost" href="/espace">
                Notre plateforme de recrutement
              </Link>
            </div>
            <ul className="hero-points">
              <li>Recrutement au succes</li>
              <li>Formation blended learning</li>
              <li>Externalisation & RPO</li>
              <li>Portail carriere & appli mobile</li>
            </ul>
          </div>

          <div className="glass-panel hero-visual" data-reveal>
            <div className="stack-card">
              <h3>Tableau de bord Madajob</h3>
              <p>
                Un ecosysteme RH structure pour transformer un besoin en short-list
                qualifiee, une candidature en opportunite concrete et une mission en resultat durable.
              </p>
              <div className="visual-grid">
                <div className="mini-stat">
                  <strong data-count="40000" data-suffix="+">
                    40 000+
                  </strong>
                  <span>CV et candidatures qualifiees dans la base</span>
                </div>
                <div className="mini-stat">
                  <strong data-count="454">454</strong>
                  <span>missions de recrutement prises en charge</span>
                </div>
                <div className="mini-stat">
                  <strong data-count="856">856</strong>
                  <span>agents geres en externalisation</span>
                </div>
                <div className="mini-stat">
                  <strong data-count="25" data-suffix="+">
                    25+
                  </strong>
                  <span>modules de formation sur 5 axes</span>
                </div>
              </div>
            </div>

            <div className="stack-card">
              <h3>Temps forts du dispositif</h3>
              <div className="tag-cloud">
                <span>274 offres actives</span>
                <span>3 agences</span>
                <span>Jobmada</span>
                <span>Smart Interview</span>
                <span>Portail mobile</span>
                <span>Activation rapide 24h</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="metric-band">
        <div className="container metric-grid">
          <article className="metric-card" data-reveal>
            <span className="metric-value" data-count="18" data-suffix=" ans">
              18 ans
            </span>
            <p className="metric-label">
              d&apos;experience consolidee depuis 2008 dans le recrutement et l&apos;accompagnement RH.
            </p>
          </article>
          <article className="metric-card" data-reveal>
            <span className="metric-value" data-count="274">
              274
            </span>
            <p className="metric-label">
              offres mises en avant pour alimenter un tunnel candidat plus vivant et plus credible.
            </p>
          </article>
          <article className="metric-card" data-reveal>
            <span className="metric-value" data-count="5">
              5
            </span>
            <p className="metric-label">
              axes de formation pour accompagner managers, commerciaux, equipes terrain et fonctions support.
            </p>
          </article>
          <article className="metric-card" data-reveal>
            <span className="metric-value" data-count="3">
              3
            </span>
            <p className="metric-label">
              agences pour rester proche du terrain tout en industrialisant l&apos;experience client.
            </p>
          </article>
        </div>
      </section>

      <section className="section section-clients">
        <div className="container">
          <div className="section-head" data-reveal>
            <div>
              <span className="eyebrow">References clients</span>
              <h2>Des marques majeures nous font deja confiance</h2>
            </div>
            <p>
              Madajob accompagne deja des entreprises de reference dans leurs enjeux
              de recrutement, de formation, d&apos;externalisation et de performance RH.
            </p>
          </div>

          <div className="glass-panel clients-shell" data-reveal>
            <div className="clients-overview">
              <Image className="clients-brand" src={logoMadajob} alt="Logo Madajob" width={88} height={88} />
              <div className="clients-copy">
                <strong>Partenaire RH de confiance pour les acteurs de reference a Madagascar</strong>
                <p>
                  Recrutement, externalisation, formation et accompagnement RH pour des groupes nationaux et internationaux qui recherchent reactivite, fiabilite et qualite de service.
                </p>
              </div>
            </div>

            <div className="logo-marquee" aria-label="Quelques clients Madajob">
              <div className="logo-marquee-inner">
                <div className="logo-group">
                  {clients.map((client) => (
                    <div key={client.alt} className={`logo-card ${client.className ?? ""}`.trim()}>
                      <Image
                        src={client.src}
                        alt={client.alt}
                        width={170}
                        height={70}
                        className={client.imageClass}
                      />
                    </div>
                  ))}
                </div>
                <div className="logo-group" aria-hidden="true">
                  {clients.map((client) => (
                    <div key={`${client.alt}-copy`} className={`logo-card ${client.className ?? ""}`.trim()}>
                      <Image
                        src={client.src}
                        alt=""
                        width={170}
                        height={70}
                        className={client.imageClass}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head" data-reveal>
            <div>
              <span className="eyebrow">Ecosysteme</span>
              <h2>Une offre RH complete pour entreprises et talents</h2>
            </div>
            <p>
              Madajob reunit dans un meme ecosysteme les services essentiels pour
              recruter, former, externaliser et accompagner les parcours professionnels
              avec plus d&apos;efficacite.
            </p>
          </div>

          <div className="card-grid">
            <article className="info-card" data-reveal>
              <div className="icon-chip">01</div>
              <h3>Recrutement</h3>
              <p>Une promesse claire, des missions au succes et une base de profils plus visible pour les decideurs.</p>
              <ul>
                <li>Sourcing cible</li>
                <li>Short-list et entretiens</li>
                <li>Garantie sur periode d&apos;essai</li>
              </ul>
            </article>
            <article className="info-card" data-reveal>
              <div className="icon-chip">02</div>
              <h3>Formation</h3>
              <p>Des programmes concus pour renforcer les competences, accompagner la montee en responsabilite et soutenir la performance des equipes.</p>
              <ul>
                <li>25+ modules</li>
                <li>5 axes de montee en competence</li>
                <li>Suivi mobile des plannings</li>
              </ul>
            </article>
            <article className="info-card" data-reveal>
              <div className="icon-chip">03</div>
              <h3>Externalisation</h3>
              <p>Une lecture simple des offres de mise a disposition, paie, portage salarial et RPO international.</p>
              <ul>
                <li>856 agents geres</li>
                <li>SIRH et reporting</li>
                <li>Activation rapide</li>
              </ul>
            </article>
            <article className="info-card" data-reveal>
              <div className="icon-chip">04</div>
              <h3>Experience candidat</h3>
              <p>Un parcours simple pour rechercher un emploi, postuler, se former et rester connecte aux meilleures opportunites.</p>
              <ul>
                <li>Job portal Jobmada</li>
                <li>iOS & Android</li>
                <li>Prime de cooptation</li>
              </ul>
            </article>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container split">
          <article className="panel" data-reveal>
            <span className="eyebrow">Valeur</span>
            <h3>Pourquoi les entreprises et les talents choisissent Madajob</h3>
            <p>
              Madajob s&apos;appuie sur une methodologie claire, une vraie connaissance du terrain et une offre complete pour repondre a chaque besoin RH avec precision.
            </p>
            <ul className="panel-list">
              <li>Des parcours dedies pour les entreprises, les candidats, la formation et l&apos;externalisation.</li>
              <li>Un vivier de profils qualifies, une experience eprouvee et des references fortes sur le marche malgache.</li>
              <li>Des solutions activables rapidement selon l&apos;urgence, le volume et la complexite du besoin.</li>
              <li>Un accompagnement de proximite pour securiser chaque etape, du brief a l&apos;integration.</li>
            </ul>
          </article>

          <article className="panel quote-card" data-reveal>
            <span className="eyebrow">Vision</span>
            <blockquote>
              Madajob a vocation a simplifier le recrutement, a rendre les meilleures opportunites plus accessibles et a devenir la plateforme de reference entre entreprises et talents a Madagascar.
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
          <div className="section-head" data-reveal>
            <div>
              <span className="eyebrow">Methode</span>
              <h2>Une methode claire pour securiser chaque mission</h2>
            </div>
            <p>
              De l&apos;expression du besoin jusqu&apos;a l&apos;integration, Madajob mobilise un process structure pour fiabiliser les recrutements, reduire les delais et ameliorer la qualite des resultats.
            </p>
          </div>

          <div className="process-grid">
            <article className="process-card" data-reveal>
              <span className="process-step">1</span>
              <h3>Cadrer</h3>
              <p>Clarifier le besoin, le niveau d&apos;urgence, le type de contrat et les competences critiques a recruter ou a deleguer.</p>
            </article>
            <article className="process-card" data-reveal>
              <span className="process-step">2</span>
              <h3>Sourcer</h3>
              <p>Mobiliser la base de 40 000+ profils, les campagnes digitales, le portail carriere et la cooptation pour accelerer la recherche.</p>
            </article>
            <article className="process-card" data-reveal>
              <span className="process-step">3</span>
              <h3>Evaluer</h3>
              <p>Conduire des entretiens plus fluides, utiliser le Smart Interview et fiabiliser la short-list avant presentation.</p>
            </article>
            <article className="process-card" data-reveal>
              <span className="process-step">4</span>
              <h3>Activer</h3>
              <p>Finaliser l&apos;integration, la gestion administrative, la formation ou l&apos;externalisation selon le scenario choisi par le client.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container showcase">
          <article className="showcase-feature" data-reveal>
            <span className="eyebrow">Candidat</span>
            <h3>Un parcours candidat simple, rapide et accessible</h3>
            <p>
              Les candidats trouvent rapidement les offres, postulent en ligne, accedent a l&apos;application mobile et restent connectes aux opportunites qui correspondent a leur profil.
            </p>
            <ul className="list-checks">
              <li>Acces direct aux offres via la page carriere et le Job Portal.</li>
              <li>Application mobile compatible Android et iOS pour rechercher et postuler en mobilite.</li>
              <li>Programme de cooptation avec prime de 100 000 Ar si la recommandation est retenue.</li>
            </ul>
            <div className="hero-actions">
              <Link className="btn btn-primary" href="/candidats">
                Voir l&apos;experience candidat
              </Link>
            </div>
          </article>

          <article className="showcase-feature" data-reveal>
            <span className="eyebrow">Entreprise</span>
            <h3>Une offre claire pour les recruteurs et les decideurs</h3>
            <p>
              Les entreprises identifient immediatement les solutions disponibles, les preuves de capacite et les leviers a activer pour accelerer leurs recrutements et renforcer leur organisation.
            </p>
            <ul className="list-checks">
              <li>Promesse commerciale lisible et rassurante des le premier ecran.</li>
              <li>Meilleure articulation entre recrutement, paie, mise a disposition et RPO.</li>
              <li>CTA directs pour parler a un consultant et lancer une mission plus rapidement.</li>
            </ul>
            <div className="hero-actions">
              <Link className="btn btn-secondary" href="/entreprise">
                Voir l&apos;espace entreprise
              </Link>
            </div>
          </article>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head" data-reveal>
            <div>
              <span className="eyebrow">Notre plateforme de recrutement</span>
              <h2>Accedez a la plateforme candidat / recruteur sans quitter l&apos;ecosysteme Madajob</h2>
            </div>
            <p>
              Le site institutionnel presente Madajob, puis votre plateforme prend le relai pour la gestion des profils, des offres, des candidatures et des espaces de connexion.
            </p>
          </div>

          <div className="split">
            <article className="panel" data-reveal>
              <span className="eyebrow">Candidat</span>
              <h3>Profil, CV et candidatures</h3>
              <p>
                Creez votre compte, deposez votre CV, suivez vos candidatures et retrouvez les opportunites qui vous correspondent.
              </p>
              <div className="hero-actions">
                <Link className="btn btn-primary" href="/espace/candidat">
                  Ouvrir l&apos;espace candidat
                </Link>
                <Link className="btn btn-secondary" href="/inscription">
                  Creer un compte
                </Link>
              </div>
            </article>

            <article className="panel quote-card" data-reveal>
              <span className="eyebrow">Recruteur</span>
              <h3>Offres, pipeline et pilotage</h3>
              <p>
                Publiez vos offres, consultez les candidatures et pilotez votre pipeline dans un espace dedie.
              </p>
              <div className="hero-actions">
                <Link className="btn btn-primary" href="/espace/recruteur">
                  Ouvrir l&apos;espace recruteur
                </Link>
                <Link className="btn btn-secondary" href="/connexion">
                  Me connecter
                </Link>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head" data-reveal>
            <div>
              <span className="eyebrow">Preuves sociales</span>
              <h2>Des temoignages qui humanisent la marque</h2>
            </div>
            <p>
              Les retours d&apos;experience soulignent la qualite de l&apos;accompagnement,
              la reactivite des equipes et la proximite qui font la difference dans chaque mission.
            </p>
          </div>

          <div className="testimonial-grid">
            <article className="testimonial-card" data-reveal>
              <p>Une prise en charge serieuse, avec une vraie energie positive pendant les entretiens et le suivi.</p>
              <strong>Angela Rak</strong>
              <span>Assistante de direction</span>
            </article>
            <article className="testimonial-card" data-reveal>
              <p>Un accompagnement apprecie pour son devouement, sa courtoisie et sa qualite de relation pendant les missions.</p>
              <strong>Narindra Rabe</strong>
              <span>Freelance</span>
            </article>
            <article className="testimonial-card" data-reveal>
              <p>Un process rapide et rassurant, avec un entretien obtenu des le lendemain de l&apos;inscription sur la plateforme.</p>
              <strong>Rivo Andria</strong>
              <span>Gestionnaire performance</span>
            </article>
            <article className="testimonial-card" data-reveal>
              <p>Une sensation de serieux commercial et de proximite qui credibilise la marque aupres des talents et des clients.</p>
              <strong>Tahiry Ratovohery</strong>
              <span>Responsable performance</span>
            </article>
          </div>
        </div>
      </section>

      <section className="section" id="contact">
        <div className="container contact-wrap">
          <article className="contact-card glass-panel" data-reveal>
            <h2>Parlons de vos recrutements, de vos formations et de vos besoins RH</h2>
            <p className="lead">
              Besoin de recruter, de renforcer les competences de vos equipes ou
              d&apos;externaliser une partie de votre activite RH ? Madajob vous accompagne avec des solutions concretes et operationnelles.
            </p>
            <div className="contact-actions">
              <Link className="btn btn-primary" href="mailto:infos@madajob.mg">
                Ecrire a infos@madajob.mg
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
