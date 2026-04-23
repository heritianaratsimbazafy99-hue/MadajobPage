import { DashboardShell } from "@/components/dashboard/shell";
import { ShortlistBoard } from "@/components/candidates/shortlist-board";
import { requireRole } from "@/lib/auth";
import {
  getManagedCandidates,
  getManagedJobs,
  getRecruiterApplications
} from "@/lib/jobs";

export default async function RecruiterShortlistPage() {
  const profile = await requireRole(["recruteur"]);
  const [applications, candidates, jobs] = await Promise.all([
    getRecruiterApplications(profile, { limit: 300 }),
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
      title="Shortlist candidats"
      description="Travaillez les dossiers avances, priorisez les meilleurs profils et gardez un acces direct au dossier, au profil et a l'offre."
      profile={profile}
      currentPath="/app/recruteur/shortlist"
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
          <small>dossiers a preparer rapidement</small>
        </article>
        <article className="panel metric-panel">
          <span>Feedbacks a saisir</span>
          <strong>{pendingFeedbackCount}</strong>
          <small>comptes-rendus encore attendus</small>
        </article>
        <article className="panel metric-panel">
          <span>Feedbacks favorables</span>
          <strong>{favorableFeedbackCount}</strong>
          <small>recommandations positives deja formulees</small>
        </article>
      </section>

      <ShortlistBoard
        applications={applications}
        candidates={candidates}
        jobs={jobs}
        role="recruteur"
      />
    </DashboardShell>
  );
}
