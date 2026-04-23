import { DashboardShell } from "@/components/dashboard/shell";
import { InterviewsBoard } from "@/components/interviews/interviews-board";
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
  const now = Date.now();
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
  const upcoming = scheduled.filter((interview) => new Date(interview.starts_at).getTime() >= now);
  const cancelled = interviews.filter((interview) => interview.status === "cancelled");

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
          <span>A venir</span>
          <strong>{upcoming.length}</strong>
          <small>entretiens encore ouverts ou planifies</small>
        </article>
        <article className="panel metric-panel">
          <span>Annules</span>
          <strong>{cancelled.length}</strong>
          <small>elements a reprogrammer ou a clarifier</small>
        </article>
      </section>

      <InterviewsBoard interviews={interviews} jobs={jobs} role={profile.role === "admin" ? "admin" : "recruteur"} />
    </DashboardShell>
  );
}
