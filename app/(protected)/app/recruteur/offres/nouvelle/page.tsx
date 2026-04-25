import Link from "next/link";

import { DashboardShell } from "@/components/dashboard/shell";
import { JobCreateForm } from "@/components/jobs/job-create-form";
import { requireRole } from "@/lib/auth";

export default async function RecruiterNewJobPage() {
  const profile = await requireRole(["recruteur"]);

  return (
    <DashboardShell
      title="Creer une annonce"
      description="Redigez une offre dans un espace calme, avec controle qualite et apercu public avant publication."
      profile={profile}
      currentPath="/app/recruteur/offres/nouvelle"
    >
      <section className="job-create-workspace">
        <div className="job-create-main">
          <JobCreateForm roleLabel="Recruteur" />
        </div>

        <aside className="job-create-rail">
          <div className="panel dashboard-sidecard">
            <p className="eyebrow">Flux recommande</p>
            <h2>Travaillez l'annonce avant de la publier.</h2>
            <ul className="dashboard-mini-list">
              <li>Commencez en brouillon pour eviter une publication incomplete.</li>
              <li>Utilisez le score qualite pour verifier titre, mission, salaire et cloture.</li>
              <li>Publiez seulement quand l'apercu public est clair pour les candidats.</li>
            </ul>
          </div>

          <div className="panel dashboard-sidecard">
            <p className="eyebrow">Raccourcis</p>
            <div className="dashboard-action-stack">
              <Link className="btn btn-secondary btn-block" href="/app/recruteur/offres">
                Voir mes offres
              </Link>
              <Link className="btn btn-secondary btn-block" href="/carrieres">
                Voir le site carriere
              </Link>
              <Link className="btn btn-secondary btn-block" href="/app/recruteur">
                Retour au tableau de bord
              </Link>
            </div>
          </div>
        </aside>
      </section>
    </DashboardShell>
  );
}
