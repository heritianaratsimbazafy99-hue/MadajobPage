import { DashboardShell } from "@/components/dashboard/shell";
import { CandidateApplicationsBoard } from "@/components/jobs/candidate-applications-board";
import { getApplicationStatusMeta, isFinalApplicationStatus } from "@/lib/application-status";
import { requireRole } from "@/lib/auth";
import { formatDisplayDate } from "@/lib/format";
import { getCandidateApplicationSummaries } from "@/lib/jobs";

export default async function CandidateApplicationsPage() {
  const profile = await requireRole(["candidat"]);
  const applications = await getCandidateApplicationSummaries(profile.id);
  const activeApplicationsCount = applications.filter(
    (application) => !isFinalApplicationStatus(application.status)
  ).length;
  const withCvCount = applications.filter((application) => application.has_cv).length;
  const latestApplication = applications[0];
  const latestStatus = latestApplication
    ? getApplicationStatusMeta(latestApplication.status)
    : null;

  return (
    <DashboardShell
      title="Mes candidatures"
      description="Centralisez vos dossiers, filtrez vos candidatures et ouvrez chaque suivi en un clic."
      profile={profile}
      currentPath="/app/candidat/candidatures"
    >
      <section className="dashboard-grid dashboard-grid--four">
        <article className="panel metric-panel">
          <span>Total dossiers</span>
          <strong>{applications.length}</strong>
          <small>
            {applications.length > 0
              ? "historique visible dans votre espace"
              : "aucune candidature pour le moment"}
          </small>
        </article>
        <article className="panel metric-panel">
          <span>Candidatures actives</span>
          <strong>{activeApplicationsCount}</strong>
          <small>hors candidatures finalisees</small>
        </article>
        <article className="panel metric-panel">
          <span>Dossiers avec CV</span>
          <strong>{withCvCount}</strong>
          <small>candidatures envoyees avec un CV joint</small>
        </article>
        <article className="panel metric-panel">
          <span>Dernier statut</span>
          <strong>{latestStatus ? latestStatus.label : "Aucun"}</strong>
          <small>
            {latestApplication
              ? formatDisplayDate(latestApplication.updated_at)
              : "postulez a une offre pour commencer"}
          </small>
        </article>
      </section>

      <CandidateApplicationsBoard applications={applications} />
    </DashboardShell>
  );
}
