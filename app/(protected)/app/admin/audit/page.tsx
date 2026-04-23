import { AuditBoard } from "@/components/admin/audit-board";
import { DashboardShell } from "@/components/dashboard/shell";
import { requireRole } from "@/lib/auth";
import { getAdminAuditEvents } from "@/lib/jobs";
import { summarizeAdminAuditEvents } from "@/lib/managed-audit-insights";

export default async function AdminAuditPage() {
  const profile = await requireRole(["admin"]);
  const events = await getAdminAuditEvents({ limit: 300 });
  const summary = summarizeAdminAuditEvents(events);
  const accessAndInvitationCount = summary.accessCount + summary.invitationCount;

  return (
    <DashboardShell
      title="Audit interne"
      description="Consultez les actions critiques de la plateforme pour suivre les changements sensibles, les droits internes et la gouvernance RH."
      profile={profile}
      currentPath="/app/admin/audit"
    >
      <section className="dashboard-grid dashboard-grid--four">
        <article className="panel metric-panel">
          <span>Evenements</span>
          <strong>{summary.total}</strong>
          <small>{summary.recentCount} sur les 7 derniers jours</small>
        </article>
        <article className="panel metric-panel">
          <span>Sensibles</span>
          <strong>{summary.sensitiveCount}</strong>
          <small>changements d'acces, d'activation ou de statut a verifier</small>
        </article>
        <article className="panel metric-panel">
          <span>Acces & invitations</span>
          <strong>{accessAndInvitationCount}</strong>
          <small>{summary.invitationCount} invitation(s), {summary.accessCount} arbitrage(s) d'acces</small>
        </article>
        <article className="panel metric-panel">
          <span>Acteurs</span>
          <strong>{summary.uniqueActorsCount}</strong>
          <small>{summary.organizationCount} evenement(s) organisation, {summary.jobCount} cote offres</small>
        </article>
      </section>

      <AuditBoard events={events} />
    </DashboardShell>
  );
}
