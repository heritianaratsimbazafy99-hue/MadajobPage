import Link from "next/link";

import { SetupNotice } from "@/components/site/setup-notice";
import { isSupabaseConfigured } from "@/lib/env";

export default function CandidatsPage() {
  return (
    <main className="page-shell">
      <section className="section">
        <div className="container page-hero">
          <div>
            <p className="eyebrow">Espace candidats</p>
            <h1>Un parcours candidat clair, rassurant et actionnable.</h1>
            <p className="page-hero__lead">
              Creez votre profil, deposez votre CV, suivez vos candidatures et
              centralisez vos opportunites sans friction.
            </p>
            <div className="hero__actions">
              <Link className="btn btn-primary" href="/inscription">
                Creer mon compte
              </Link>
              <Link className="btn btn-secondary" href="/carrieres">
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
