import Link from "next/link";

import { SetupNotice } from "@/components/site/setup-notice";
import { isSupabaseConfigured } from "@/lib/env";

export default function RecruiterPlatformPage() {
  return (
    <main className="page-shell">
      <section className="section">
        <div className="container page-hero">
          <div>
            <p className="eyebrow">Plateforme recruteur</p>
            <h1>Un espace dedie pour publier vos offres et piloter votre pipeline.</h1>
            <p className="page-hero__lead">
              Chaque recruteur voit ses offres, ses candidatures et son avancement,
              sans exposition inutile au reste de la base.
            </p>
            <div className="hero__actions">
              <Link className="btn btn-primary" href="/connexion">
                Me connecter
              </Link>
              <Link className="btn btn-secondary" href="/carrieres">
                Voir le site carriere
              </Link>
            </div>
          </div>

          <div className="panel checklist-card">
            <h2>Ce que le recruteur retrouve dans la V1</h2>
            <ul>
              <li>Creation et gestion de ses offres</li>
              <li>Vision sur les candidatures de ses offres</li>
              <li>Pipeline simple et lisible</li>
              <li>Acces restreint a la CVtheque selon permissions</li>
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
