import { DashboardShell } from "@/components/dashboard/shell";
import { ManagedApplicationsBoard } from "@/components/jobs/managed-applications-board";
import { isFinalApplicationStatus } from "@/lib/application-status";
import { requireRole } from "@/lib/auth";
import { getRecruiterApplications } from "@/lib/jobs";

export default async function RecruiterApplicationsPage() {
  const profile = await requireRole(["recruteur"]);
  const applications = await getRecruiterApplications(profile);
  const activeCount = applications.filter((application) => !isFinalApplicationStatus(application.status)).length;
  const shortlistCount = applications.filter((application) => application.status === "shortlist").length;
  const interviewCount = applications.filter((application) => application.status === "interview").length;
  const uniqueStatuses = new Set(applications.map((application) => application.status)).size;

  return (
    <DashboardShell
      title="Candidatures recues"
      description="Pilotez votre pipeline candidat en vue liste ou Kanban, puis faites avancer chaque dossier par glisser-deposer."
      profile={profile}
      currentPath="/app/recruteur/candidatures"
    >
      <section className="dashboard-grid dashboard-grid--four">
        <article className="panel metric-panel">
          <span>Dossiers visibles</span>
          <strong>{applications.length}</strong>
          <small>candidatures presentes dans votre perimetre</small>
        </article>
        <article className="panel metric-panel">
          <span>En cours</span>
          <strong>{activeCount}</strong>
          <small>dossiers toujours actifs dans le pipeline</small>
        </article>
        <article className="panel metric-panel">
          <span>Shortlist</span>
          <strong>{shortlistCount}</strong>
          <small>profils retenus pour la suite</small>
        </article>
        <article className="panel metric-panel">
          <span>Entretiens</span>
          <strong>{interviewCount}</strong>
          <small>{uniqueStatuses} statut(s) representes dans la vue</small>
        </article>
      </section>

      <ManagedApplicationsBoard
        applications={applications}
        basePath="/app/recruteur/candidatures"
      />
    </DashboardShell>
  );
}
