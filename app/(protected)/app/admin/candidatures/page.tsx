import { DashboardShell } from "@/components/dashboard/shell";
import { ManagedApplicationsBoard } from "@/components/jobs/managed-applications-board";
import { isFinalApplicationStatus } from "@/lib/application-status";
import { requireRole } from "@/lib/auth";
import { getAdminApplications } from "@/lib/jobs";

export default async function AdminApplicationsPage() {
  const profile = await requireRole(["admin"]);
  const applications = await getAdminApplications();
  const activeCount = applications.filter((application) => !isFinalApplicationStatus(application.status)).length;
  const upcomingInterviewCount = applications.filter((application) =>
    Boolean(application.interview_signal.next_interview_at)
  ).length;
  const pendingFeedbackCount = applications.filter(
    (application) => application.interview_signal.pending_feedback
  ).length;

  return (
    <DashboardShell
      title="Candidatures plateforme"
      description="Supervisez le pipeline candidat global en vue liste ou Kanban, avec deplacement des dossiers entre les etapes."
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
          <span>Entretiens a venir</span>
          <strong>{upcomingInterviewCount}</strong>
          <small>dossiers a coordonner rapidement</small>
        </article>
        <article className="panel metric-panel">
          <span>Feedbacks a saisir</span>
          <strong>{pendingFeedbackCount}</strong>
          <small>entretiens termines sans compte-rendu</small>
        </article>
      </section>

      <ManagedApplicationsBoard
        applications={applications}
        basePath="/app/admin/candidatures"
      />
    </DashboardShell>
  );
}
