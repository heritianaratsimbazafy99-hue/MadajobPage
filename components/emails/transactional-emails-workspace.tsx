import { DashboardShell } from "@/components/dashboard/shell";
import { TransactionalEmailsBoard } from "@/components/emails/transactional-emails-board";
import {
  getEmailProviderReadinessChecks,
  type EmailProviderReadinessStatus
} from "@/lib/email-provider-readiness";
import { formatDisplayDate } from "@/lib/format";
import type { Profile, TransactionalEmail } from "@/lib/types";

type TransactionalEmailsWorkspaceProps = {
  profile: Profile;
  emails: TransactionalEmail[];
};

export function TransactionalEmailsWorkspace({
  profile,
  emails
}: TransactionalEmailsWorkspaceProps) {
  const queuedCount = emails.filter((email) => email.status === "queued").length;
  const sentCount = emails.filter((email) => email.status === "sent").length;
  const failedCount = emails.filter((email) => email.status === "failed").length;
  const latestEmail = emails[0] ?? null;
  const providerChecks = getEmailProviderReadinessChecks(emails);

  return (
    <DashboardShell
      title="Emails transactionnels"
      description="Centralisez la file d'attente email de la plateforme avant branchement a Resend ou Brevo."
      profile={profile}
      currentPath="/app/admin/emails"
    >
      <section className="dashboard-grid dashboard-grid--four">
        <article className="panel metric-panel">
          <span>Total</span>
          <strong>{emails.length}</strong>
          <small>emails journalises dans la plateforme</small>
        </article>
        <article className="panel metric-panel">
          <span>En file</span>
          <strong>{queuedCount}</strong>
          <small>elements prets pour un futur provider</small>
        </article>
        <article className="panel metric-panel">
          <span>Envoyes</span>
          <strong>{sentCount}</strong>
          <small>compteur qui se remplira apres branchement provider</small>
        </article>
        <article className="panel metric-panel">
          <span>Dernier evenement</span>
          <strong>{latestEmail ? formatDisplayDate(latestEmail.created_at) : "Aucun"}</strong>
          <small>{failedCount > 0 ? `${failedCount} echec(s) a surveiller` : "aucun echec detecte"}</small>
        </article>
      </section>

      <section className="dashboard-workspace">
        <div className="dashboard-column">
          <TransactionalEmailsBoard emails={emails} />
        </div>

        <aside className="dashboard-column dashboard-column--aside">
          <div className="panel dashboard-sidecard">
            <p className="eyebrow">Strategie retenue</p>
            <h2>Une base email prete, sans surconsommer tout de suite.</h2>
            <ul className="dashboard-mini-list">
              <li>Les emails candidats sont journalises avant tout branchement externe.</li>
              <li>Les notifications internes restent prioritairement in-app pour limiter le volume.</li>
              <li>Les invitations internes continuent de passer par Supabase Auth sans doublon provider.</li>
            </ul>
          </div>

          <div className="dashboard-form">
            <div className="dashboard-form__head">
              <div>
                <p className="eyebrow">Preflight provider</p>
                <h2>Verifier avant Resend/Brevo</h2>
              </div>
              <span className="tag">{providerChecks.length} check(s)</span>
            </div>

            <div className="reporting-breakdown">
              {providerChecks.map((check) => (
                <div key={check.id} className="document-card reporting-list__item">
                  <div className="reporting-list__head">
                    <strong>{check.title}</strong>
                    <span className={getProviderStatusClass(check.status)}>
                      {check.value}
                    </span>
                  </div>
                  <p>{check.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </section>
    </DashboardShell>
  );
}

function getProviderStatusClass(status: EmailProviderReadinessStatus) {
  if (status === "danger") {
    return "tag tag--danger";
  }

  if (status === "warning") {
    return "tag tag--warning";
  }

  if (status === "ok") {
    return "tag tag--success";
  }

  return "tag tag--muted";
}
