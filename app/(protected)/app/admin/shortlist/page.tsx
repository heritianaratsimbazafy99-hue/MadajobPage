import { DashboardShell } from "@/components/dashboard/shell";
import { ShortlistBoard } from "@/components/candidates/shortlist-board";
import { requireRole } from "@/lib/auth";
import {
  getAdminApplications,
  getManagedCandidates,
  getManagedJobs
} from "@/lib/jobs";

export default async function AdminShortlistPage() {
  const profile = await requireRole(["admin"]);
  const [applications, candidates, jobs] = await Promise.all([
    getAdminApplications({ limit: 300 }),
    getManagedCandidates(profile, { limit: 300 }),
    getManagedJobs(profile, { limit: 300 })
  ]);

  const shortlistApplications = applications.filter((application) =>
    ["shortlist", "interview", "hired"].includes(application.status)
  );
  const upcomingInterviewCount = shortlistApplications.filter(
    (application) => Boolean(application.interview_signal.next_interview_at)
  ).length;
  const pendingFeedbackCount = shortlistApplications.filter(
    (application) => application.interview_signal.pending_feedback
  ).length;
  const favorableFeedbackCount = shortlistApplications.filter((application) => {
    const recommendation = application.interview_signal.latest_feedback?.recommendation;
    return recommendation === "strong_yes" || recommendation === "yes";
  }).length;

  return (
    <DashboardShell
      title="Shortlist plateforme"
      description="Supervisez les dossiers avances de la plateforme et pilotez les meilleurs profils sans perdre le contexte candidat-offre."
      profile={profile}
      currentPath="/app/admin/shortlist"
    >
      <section className="dashboard-grid dashboard-grid--four">
        <article className="panel metric-panel">
          <span>Dossiers avances</span>
          <strong>{shortlistApplications.length}</strong>
          <small>shortlist, entretiens et profils retenus</small>
        </article>
        <article className="panel metric-panel">
          <span>Entretiens a venir</span>
          <strong>{upcomingInterviewCount}</strong>
          <small>dossiers a coordonner rapidement</small>
        </article>
        <article className="panel metric-panel">
          <span>Feedbacks a saisir</span>
          <strong>{pendingFeedbackCount}</strong>
          <small>comptes-rendus encore attendus</small>
        </article>
        <article className="panel metric-panel">
          <span>Feedbacks favorables</span>
          <strong>{favorableFeedbackCount}</strong>
          <small>recommandations positives deja journalisees</small>
        </article>
      </section>

      <ShortlistBoard
        applications={applications}
        candidates={candidates}
        jobs={jobs}
        role="admin"
      />
    </DashboardShell>
  );
}
