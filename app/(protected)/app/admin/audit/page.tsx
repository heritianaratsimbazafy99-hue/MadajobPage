import { AuditBoard } from "@/components/admin/audit-board";
import { DashboardShell } from "@/components/dashboard/shell";
import { requireRole } from "@/lib/auth";
import { getAdminAuditEvents } from "@/lib/jobs";

export default async function AdminAuditPage() {
  const profile = await requireRole(["admin"]);
  const events = await getAdminAuditEvents({ limit: 300 });

  const profileEvents = events.filter((event) => event.entity_type === "profile").length;
  const jobEvents = events.filter((event) => event.entity_type === "job_post").length;
  const organizationEvents = events.filter((event) => event.entity_type === "organization").length;
  const uniqueActors = new Set(events.map((event) => event.actor_name)).size;

  return (
    <DashboardShell
      title="Audit interne"
      description="Consultez les actions critiques de la plateforme pour suivre les changements admin, utilisateurs et offres."
      profile={profile}
      currentPath="/app/admin/audit"
    >
      <section className="dashboard-grid dashboard-grid--four">
        <article className="panel metric-panel">
          <span>Evenements</span>
          <strong>{events.length}</strong>
          <small>actions journalisees dans l'audit</small>
        </article>
        <article className="panel metric-panel">
          <span>Utilisateurs</span>
          <strong>{profileEvents}</strong>
          <small>actions sur les comptes et invitations</small>
        </article>
        <article className="panel metric-panel">
          <span>Offres</span>
          <strong>{jobEvents}</strong>
          <small>creations, editions et statuts</small>
        </article>
        <article className="panel metric-panel">
          <span>Acteurs</span>
          <strong>{uniqueActors}</strong>
          <small>{organizationEvents} evenement(s) organisation</small>
        </article>
      </section>

      <AuditBoard events={events} />
    </DashboardShell>
  );
}
