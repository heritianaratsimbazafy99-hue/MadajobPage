import Link from "next/link";

import { SignupForm } from "@/components/auth/signup-form";
import { SetupNotice } from "@/components/site/setup-notice";
import { isSupabaseConfigured } from "@/lib/env";

export default function InscriptionPage() {
  return (
    <main className="page-shell">
      <section className="section">
        <div className="container auth-layout">
          <div>
            <p className="eyebrow">Inscription candidat</p>
            <h1>Creez un compte candidat pour centraliser votre parcours.</h1>
            <p className="page-hero__lead">
              Cette inscription ouvre un espace personnel pour votre profil, votre CV
              et vos candidatures. Les acces recruteurs et admins restent geres par Madajob.
            </p>
            <p className="auth-side-note">
              Vous avez deja un compte ? <Link href="/connexion">Connectez-vous</Link>.
            </p>
          </div>

          <div className="panel auth-panel">
            {!isSupabaseConfigured ? <SetupNotice compact /> : null}
            <SignupForm />
          </div>
        </div>
      </section>
    </main>
  );
}
