import { DashboardShell } from "@/components/dashboard/shell";
import { CandidateApplicationsBoard } from "@/components/jobs/candidate-applications-board";
import { getApplicationStatusMeta, isFinalApplicationStatus } from "@/lib/application-status";
import { requireRole } from "@/lib/auth";
import { formatDateTimeDisplay, formatDisplayDate } from "@/lib/format";
import { getCandidateApplicationSummaries } from "@/lib/jobs";

export default async function CandidateApplicationsPage() {
  const profile = await requireRole(["candidat"]);
  const applications = await getCandidateApplicationSummaries(profile.id);
  const activeApplicationsCount = applications.filter(
    (application) => !isFinalApplicationStatus(application.status)
  ).length;
  const withInterviewsCount = applications.filter(
    (application) => application.interview_signal.interviews_count > 0
  ).length;
  const upcomingInterviewApplications = applications
    .filter((application) => Boolean(application.interview_signal.next_interview_at))
    .slice()
    .sort((left, right) => {
      const leftTime = new Date(left.interview_signal.next_interview_at ?? "").getTime();
      const rightTime = new Date(right.interview_signal.next_interview_at ?? "").getTime();
      return leftTime - rightTime;
    });
  const nextInterviewApplication = upcomingInterviewApplications[0] ?? null;
  const latestApplication = applications[0] ?? null;
  const latestStatus = latestApplication ? getApplicationStatusMeta(latestApplication.status) : null;

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
          <span>Dossiers avec entretien</span>
          <strong>{withInterviewsCount}</strong>
          <small>candidatures ayant deja un historique d'echange</small>
        </article>
        <article className="panel metric-panel">
          <span>Prochain entretien</span>
          <strong>
            {nextInterviewApplication?.interview_signal.next_interview_at
              ? formatDisplayDate(nextInterviewApplication.interview_signal.next_interview_at)
              : "Aucun"}
          </strong>
          <small>
            {nextInterviewApplication?.interview_signal.next_interview_at
              ? `${nextInterviewApplication.job_title} · ${formatDateTimeDisplay(
                  nextInterviewApplication.interview_signal.next_interview_at
                )}`
              : latestApplication
                ? `${latestStatus?.label ?? "Suivi actif"} · ${formatDisplayDate(latestApplication.updated_at)}`
                : "postulez a une offre pour commencer"}
          </small>
        </article>
      </section>

      <CandidateApplicationsBoard applications={applications} />
    </DashboardShell>
  );
}
