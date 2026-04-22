import { DashboardShell } from "@/components/dashboard/shell";
import { ManagedJobsBoard } from "@/components/jobs/managed-jobs-board";
import { requireRole } from "@/lib/auth";
import { getManagedJobs } from "@/lib/jobs";

export default async function AdminJobsPage() {
  const profile = await requireRole(["admin"]);
  const jobs = await getManagedJobs(profile);
  const draftCount = jobs.filter((job) => job.status === "draft").length;
  const publishedCount = jobs.filter((job) => job.status === "published").length;
  const withoutApplicationsCount = jobs.filter(
    (job) => job.status === "published" && job.applications_count === 0
  ).length;
  const featuredCount = jobs.filter((job) => job.is_featured).length;

  return (
    <DashboardShell
      title="Offres et diffusion"
      description="Supervisez les annonces, priorisez la moderation et pilotez rapidement leur diffusion depuis un module dedie."
      profile={profile}
      currentPath="/app/admin/offres"
    >
      <section className="dashboard-grid dashboard-grid--four">
        <article className="panel metric-panel">
          <span>Offres visibles</span>
          <strong>{jobs.length}</strong>
          <small>annonces dans le cockpit admin</small>
        </article>
        <article className="panel metric-panel">
          <span>Brouillons</span>
          <strong>{draftCount}</strong>
          <small>offres encore a arbitrer ou publier</small>
        </article>
        <article className="panel metric-panel">
          <span>Publiees</span>
          <strong>{publishedCount}</strong>
          <small>{withoutApplicationsCount} sans candidature</small>
        </article>
        <article className="panel metric-panel">
          <span>Mises en avant</span>
          <strong>{featuredCount}</strong>
          <small>annonces actuellement boostees</small>
        </article>
      </section>

      <ManagedJobsBoard jobs={jobs} basePath="/app/admin/offres" />
    </DashboardShell>
  );
}
