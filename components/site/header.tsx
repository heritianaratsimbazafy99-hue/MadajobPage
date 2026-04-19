import Image from "next/image";
import Link from "next/link";

import logoMadajob from "@/assets/clients/madajob-logo.png";
import { getCurrentProfile } from "@/lib/auth";
import { getDashboardPath } from "@/lib/auth";

export async function SiteHeader() {
  const profile = await getCurrentProfile();

  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <Link href="/" className="brand" aria-label="Madajob">
          <Image
            src={logoMadajob}
            alt="Logo Madajob"
            width={54}
            height={54}
            className="brand__logo"
            preload
          />
          <span>
            <strong>Madajob</strong>
            <small>Createur d'opportunites</small>
          </span>
        </Link>

        <nav className="site-nav" aria-label="Navigation principale">
          <Link href="/">Accueil</Link>
          <Link href="/candidats">Candidats</Link>
          <Link href="/recruteurs">Recruteurs</Link>
          <Link href="/carrieres">Carrieres</Link>
          <Link href="/connexion">Connexion</Link>
        </nav>

        <div className="site-actions">
          {profile ? (
            <Link className="btn btn-primary" href={getDashboardPath(profile.role)}>
              Ouvrir mon espace
            </Link>
          ) : (
            <Link className="btn btn-primary" href="/inscription">
              Creer un compte candidat
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
