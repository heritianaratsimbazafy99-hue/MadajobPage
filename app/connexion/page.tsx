import Link from "next/link";

import { LoginForm } from "@/components/auth/login-form";
import { SetupNotice } from "@/components/site/setup-notice";
import { isSupabaseConfigured } from "@/lib/env";

export default function ConnexionPage() {
  return (
    <main className="page-shell">
      <section className="section">
        <div className="container auth-layout">
          <div>
            <p className="eyebrow">Connexion</p>
            <h1>Entrez dans votre espace selon votre role.</h1>
            <p className="page-hero__lead">
              Les candidats, recruteurs et admins accedent au meme socle
              d'authentification, avec un routage adapte aux permissions.
            </p>
            <p className="auth-side-note">
              Pas encore de compte candidat ? <Link href="/inscription">Inscrivez-vous ici</Link>.
            </p>
          </div>

          <div className="panel auth-panel">
            {!isSupabaseConfigured ? <SetupNotice compact /> : null}
            <LoginForm />
          </div>
        </div>
      </section>
    </main>
  );
}
