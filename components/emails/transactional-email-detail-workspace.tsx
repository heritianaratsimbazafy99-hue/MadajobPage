import Link from "next/link";

import { DashboardShell } from "@/components/dashboard/shell";
import { formatDateTimeDisplay } from "@/lib/format";
import { renderTransactionalEmail } from "@/lib/transactional-email-renderer";
import {
  getTransactionalEmailStatusMeta,
  getTransactionalEmailTemplateMeta
} from "@/lib/transactional-email-meta";
import type { Profile, TransactionalEmail } from "@/lib/types";

type TransactionalEmailDetailWorkspaceProps = {
  profile: Profile;
  email: TransactionalEmail;
};

function getMetadataEntries(metadata: Record<string, unknown>) {
  return Object.entries(metadata).filter(([, value]) =>
    ["string", "number", "boolean"].includes(typeof value)
  );
}

export function TransactionalEmailDetailWorkspace({
  profile,
  email
}: TransactionalEmailDetailWorkspaceProps) {
  const renderedEmail = renderTransactionalEmail(email);
  const templateMeta = getTransactionalEmailTemplateMeta(email.template_key);
  const statusMeta = getTransactionalEmailStatusMeta(email.status);
  const metadataEntries = getMetadataEntries(email.metadata);

  return (
    <DashboardShell
      title={email.subject}
      description="Visualisez le contenu, le contexte et l'etat de chaque email transactionnel depuis l'administration."
      profile={profile}
      currentPath="/app/admin/emails"
    >
      <section className="dashboard-grid dashboard-grid--four">
        <article className="panel metric-panel">
          <span>Statut</span>
          <strong>{statusMeta.label}</strong>
          <small>{statusMeta.description}</small>
        </article>
        <article className="panel metric-panel">
          <span>Template</span>
          <strong>{templateMeta.label}</strong>
          <small>{templateMeta.description}</small>
        </article>
        <article className="panel metric-panel">
          <span>Destinataire</span>
          <strong>{email.recipient_name || email.recipient_email}</strong>
          <small>{email.recipient_email}</small>
        </article>
        <article className="panel metric-panel">
          <span>Provider</span>
          <strong>{email.provider || "Interne"}</strong>
          <small>{email.provider_message_id || "aucun identifiant externe"}</small>
        </article>
      </section>

      <section className="dashboard-workspace">
        <div className="dashboard-column">
          <div className="dashboard-form">
            <div className="dashboard-form__head">
              <div>
                <p className="eyebrow">Apercu email</p>
                <h2>{renderedEmail.heading}</h2>
              </div>
              <span className={`tag tag--${statusMeta.tone}`}>{statusMeta.label}</span>
            </div>

            <div className="email-preview-card">
              <p className="email-preview-card__intro">{renderedEmail.intro}</p>
              <div className="dashboard-mini-list dashboard-mini-list--compact">
                {renderedEmail.body.map((item) => (
                  <p key={item}>{item}</p>
                ))}
              </div>
              {renderedEmail.ctaHref && renderedEmail.ctaLabel ? (
                <a
                  className="btn btn-primary"
                  href={renderedEmail.ctaHref}
                  target="_blank"
                  rel="noreferrer"
                >
                  {renderedEmail.ctaLabel}
                </a>
              ) : null}
            </div>

            <div className="document-card">
              <strong>Version texte</strong>
              <pre className="email-preview-card__text">{renderedEmail.textBody}</pre>
            </div>
          </div>

          {metadataEntries.length > 0 ? (
            <div className="dashboard-form">
              <div className="dashboard-form__head">
                <div>
                  <p className="eyebrow">Contexte</p>
                  <h2>Metadonnees utiles</h2>
                </div>
                <span className="tag">{metadataEntries.length} entree(s)</span>
              </div>

              <div className="dashboard-list">
                {metadataEntries.map(([key, value]) => (
                  <article key={key} className="panel list-card dashboard-card">
                    <div className="dashboard-card__top">
                      <h3>{key}</h3>
                    </div>
                    <p>{String(value)}</p>
                  </article>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <aside className="dashboard-column dashboard-column--aside">
          <div className="panel dashboard-sidecard">
            <p className="eyebrow">Journal</p>
            <h2>Repere technique et temporel</h2>
            <div className="dashboard-action-stack">
              <div className="document-card">
                <strong>Cree le</strong>
                <p>{formatDateTimeDisplay(email.created_at)}</p>
              </div>
              <div className="document-card">
                <strong>Mis a jour le</strong>
                <p>{formatDateTimeDisplay(email.updated_at)}</p>
              </div>
              <div className="document-card">
                <strong>Dernier essai</strong>
                <p>{formatDateTimeDisplay(email.last_attempt_at)}</p>
              </div>
              <div className="document-card">
                <strong>Envoye le</strong>
                <p>{formatDateTimeDisplay(email.sent_at)}</p>
              </div>
              <div className="document-card">
                <strong>Nombre d'essais</strong>
                <p>{email.attempts_count}</p>
              </div>
            </div>
          </div>

          {email.error_message ? (
            <div className="dashboard-form">
              <div className="dashboard-form__head">
                <div>
                  <p className="eyebrow">Erreur</p>
                  <h2>Message d'echec</h2>
                </div>
                <span className="tag tag--danger">Echec</span>
              </div>
              <p className="form-feedback form-feedback--error">{email.error_message}</p>
            </div>
          ) : null}

          <div className="panel dashboard-sidecard">
            <p className="eyebrow">Navigation</p>
            <h2>Continuer le pilotage</h2>
            <div className="dashboard-action-stack">
              <Link className="btn btn-secondary btn-block" href="/app/admin/emails">
                Retour a la liste emails
              </Link>
              {email.link_href ? (
                <Link className="btn btn-ghost btn-block" href={email.link_href}>
                  Ouvrir le contexte plateforme
                </Link>
              ) : null}
            </div>
          </div>
        </aside>
      </section>
    </DashboardShell>
  );
}
