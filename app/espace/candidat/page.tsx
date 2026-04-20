import Link from "next/link";

import { SetupNotice } from "@/components/site/setup-notice";
import { getCurrentProfile } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";

export default async function CandidatePlatformPage() {
  const profile = await getCurrentProfile();
  const isCandidate = profile?.role === "candidat";
  const primaryHref = isCandidate ? "/app/candidat" : "/inscription";
  const primaryLabel = isCandidate ? "Ouvrir mon espace candidat" : "Creer mon compte";
  const offersHref = isCandidate ? "/app/candidat/offres" : "/carrieres";

  return (
    <main className="page-shell">
      <section className="section">
        <div className="container page-hero">
          <div>
            <p className="eyebrow">Plateforme candidat</p>
            <h1>Un parcours candidat clair, rassurant et actionnable.</h1>
            <p className="page-hero__lead">
              Creez votre profil, deposez votre CV, suivez vos candidatures et
              centralisez vos opportunites sans friction.
            </p>
            <div className="hero__actions">
              <Link className="btn btn-primary" href={primaryHref}>
                {primaryLabel}
              </Link>
              <Link className="btn btn-secondary" href={offersHref}>
                Voir les offres
              </Link>
            </div>
          </div>

          <div className="panel checklist-card">
            <h2>Ce que le candidat retrouve dans la V1</h2>
            <ul>
              <li>Profil editable et informations personnelles</li>
              <li>Upload du CV principal et des documents utiles</li>
              <li>Historique et suivi des candidatures</li>
              <li>Separation stricte avec les notes internes recruteur/admin</li>
            </ul>
          </div>
        </div>
      </section>

      {!isSupabaseConfigured ? (
        <div className="container">
          <SetupNotice compact />
        </div>
      ) : null}
    </main>
  );
}
