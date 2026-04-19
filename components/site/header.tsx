import Image from "next/image";
import Link from "next/link";

import logoMadajob from "@/assets/clients/madajob-logo.png";
import { getCurrentProfile } from "@/lib/auth";
import { getDashboardPath } from "@/lib/auth";

export async function SiteHeader() {
  const profile = await getCurrentProfile();
  const spaceHref = profile ? getDashboardPath(profile.role) : "/espace";

  return (
    <>
      <div className="topbar">
        <div className="container topbar-inner">
          <p>
            Depuis <strong>2008</strong> · <strong>40 000+</strong> profils ·{" "}
            <strong>454</strong> missions · <strong>856</strong> agents
          </p>
          <Link href="/carrieres">Explorer les offres</Link>
        </div>
      </div>

      <header className="site-header">
        <div className="container header-inner">
          <Link href="/" className="brand" aria-label="Madajob">
            <span className="brand-mark">
              <Image
                src={logoMadajob}
                alt="Logo Madajob"
                width={54}
                height={54}
                preload
              />
            </span>
            <span>
              <strong>Madajob</strong>
              <small>Recrutement & solutions RH</small>
            </span>
          </Link>

          <button className="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav">
            Menu
          </button>

          <nav className="site-nav" id="site-nav" aria-label="Navigation principale">
            <Link href="/">Accueil</Link>
            <Link href="/carrieres">Carrieres</Link>
            <Link href="/candidats">Candidat</Link>
            <Link href="/formation">Formation</Link>
            <Link href="/externalisation">Externalisation</Link>
            <Link href="/entreprise">Entreprise</Link>
            <Link href="/#contact">Contact</Link>
          </nav>

          <div className="site-actions">
            <Link className="btn btn-primary" href={spaceHref}>
              Notre plateforme de recrutement
            </Link>
          </div>
        </div>
      </header>
    </>
  );
}
