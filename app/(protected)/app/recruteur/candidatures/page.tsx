import { DashboardShell } from "@/components/dashboard/shell";
import { ManagedApplicationsBoard } from "@/components/jobs/managed-applications-board";
import { isFinalApplicationStatus } from "@/lib/application-status";
import { requireRole } from "@/lib/auth";
import { getRecruiterApplications } from "@/lib/jobs";

export default async function RecruiterApplicationsPage() {
  const profile = await requireRole(["recruteur"]);
  const applications = await getRecruiterApplications(profile);
  const activeCount = applications.filter((application) => !isFinalApplicationStatus(application.status)).length;
  const upcomingInterviewCount = applications.filter((application) =>
    Boolean(application.interview_signal.next_interview_at)
  ).length;
  const pendingFeedbackCount = applications.filter(
    (application) => application.interview_signal.pending_feedback
  ).length;

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
          <span>Entretiens a venir</span>
          <strong>{upcomingInterviewCount}</strong>
          <small>dossiers a preparer rapidement</small>
        </article>
        <article className="panel metric-panel">
          <span>Feedbacks a saisir</span>
          <strong>{pendingFeedbackCount}</strong>
          <small>entretiens termines sans compte-rendu</small>
        </article>
      </section>

      <ManagedApplicationsBoard
        applications={applications}
        basePath="/app/recruteur/candidatures"
      />
    </DashboardShell>
  );
}
