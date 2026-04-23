import { DashboardShell } from "@/components/dashboard/shell";
import { InterviewsBoard } from "@/components/interviews/interviews-board";
import {
  getSuggestedApplicationStatusFromInterviewDecision
} from "@/lib/interviews";
import type { InterviewScheduleItem, ManagedJob, Profile } from "@/lib/types";

type InterviewsWorkspaceProps = {
  profile: Profile;
  interviews: InterviewScheduleItem[];
  jobs: ManagedJob[];
  currentPath: string;
  title: string;
  description: string;
};

export function InterviewsWorkspace({
  profile,
  interviews,
  jobs,
  currentPath,
  title,
  description
}: InterviewsWorkspaceProps) {
  const scheduled = interviews.filter((interview) => interview.status === "scheduled");
  const today = scheduled.filter((interview) => {
    const date = new Date(interview.starts_at);
    const currentDate = new Date();

    return (
      date.getFullYear() === currentDate.getFullYear() &&
      date.getMonth() === currentDate.getMonth() &&
      date.getDate() === currentDate.getDate()
    );
  });
  const feedbackMissing = interviews.filter(
    (interview) => interview.status === "completed" && !interview.feedback
  );
  const decisionReady = interviews.filter((interview) => {
    if (!interview.feedback) {
      return false;
    }

    return (
      getSuggestedApplicationStatusFromInterviewDecision(
        interview.feedback.proposed_decision,
        interview.feedback.next_action
      ) !== interview.application_status
    );
  });
  const favorable = interviews.filter((interview) => {
    const recommendation = interview.feedback?.recommendation;
    return recommendation === "strong_yes" || recommendation === "yes";
  });

  return (
    <DashboardShell
      title={title}
      description={description}
      profile={profile}
      currentPath={currentPath}
    >
      <section className="dashboard-grid dashboard-grid--four">
        <article className="panel metric-panel">
          <span>Entretiens visibles</span>
          <strong>{interviews.length}</strong>
          <small>planning consolide dans cet espace</small>
        </article>
        <article className="panel metric-panel">
          <span>Aujourd'hui</span>
          <strong>{today.length}</strong>
          <small>rendez-vous a suivre dans la journee</small>
        </article>
        <article className="panel metric-panel">
          <span>Feedbacks a saisir</span>
          <strong>{feedbackMissing.length}</strong>
          <small>entretiens termines encore sans compte-rendu</small>
        </article>
        <article className="panel metric-panel">
          <span>Decisions a appliquer</span>
          <strong>{decisionReady.length}</strong>
          <small>{favorable.length} feedback(s) favorable(s) deja identifies</small>
        </article>
      </section>

      <InterviewsBoard interviews={interviews} jobs={jobs} role={profile.role === "admin" ? "admin" : "recruteur"} />
    </DashboardShell>
  );
}
