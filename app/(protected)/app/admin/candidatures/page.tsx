import { DashboardShell } from "@/components/dashboard/shell";
import { ManagedApplicationsBoard } from "@/components/jobs/managed-applications-board";
import { isFinalApplicationStatus } from "@/lib/application-status";
import { requireRole } from "@/lib/auth";
import { getAdminApplications } from "@/lib/jobs";

export default async function AdminApplicationsPage() {
  const profile = await requireRole(["admin"]);
  const applications = await getAdminApplications();
  const activeCount = applications.filter((application) => !isFinalApplicationStatus(application.status)).length;
  const shortlistCount = applications.filter((application) => application.status === "shortlist").length;
  const interviewCount = applications.filter((application) => application.status === "interview").length;
  const uniqueStatuses = new Set(applications.map((application) => application.status)).size;

  return (
    <DashboardShell
      title="Candidatures plateforme"
      description="Centralisez les dossiers candidats et accedez a leur fiche detaillee."
      profile={profile}
      currentPath="/app/admin/candidatures"
    >
      <section className="dashboard-grid dashboard-grid--four">
        <article className="panel metric-panel">
          <span>Dossiers visibles</span>
          <strong>{applications.length}</strong>
          <small>candidatures presentes dans la plateforme</small>
        </article>
        <article className="panel metric-panel">
          <span>En cours</span>
          <strong>{activeCount}</strong>
          <small>dossiers toujours actifs dans le pipeline global</small>
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
        basePath="/app/admin/candidatures"
      />
    </DashboardShell>
  );
}
