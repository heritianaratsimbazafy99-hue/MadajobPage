"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";

import { formatDisplayDate } from "@/lib/format";
import {
  getTransactionalEmailStatusMeta,
  getTransactionalEmailTemplateMeta
} from "@/lib/transactional-email-meta";
import type { TransactionalEmail } from "@/lib/types";

type TransactionalEmailsBoardProps = {
  emails: TransactionalEmail[];
};

type Filters = {
  query: string;
  status: string;
  template: string;
};

const initialFilters: Filters = {
  query: "",
  status: "",
  template: ""
};

function getUniqueValues(values: string[]) {
  return Array.from(new Set(values.filter(Boolean))).sort((left, right) => left.localeCompare(right, "fr"));
}

export function TransactionalEmailsBoard({ emails }: TransactionalEmailsBoardProps) {
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const deferredQuery = useDeferredValue(filters.query);
  const statusOptions = useMemo(
    () => getUniqueValues(emails.map((email) => email.status)),
    [emails]
  );
  const templateOptions = useMemo(
    () => getUniqueValues(emails.map((email) => email.template_key)),
    [emails]
  );

  const filteredEmails = useMemo(() => {
    const query = deferredQuery.trim().toLowerCase();

    return emails.filter((email) => {
      const statusMeta = getTransactionalEmailStatusMeta(email.status);
      const templateMeta = getTransactionalEmailTemplateMeta(email.template_key);
      const matchesQuery =
        !query ||
        [
          email.subject,
          email.preview_text,
          email.recipient_email,
          email.recipient_name ?? "",
          statusMeta.label,
          templateMeta.label
        ]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(query));

      const matchesStatus = !filters.status || email.status === filters.status;
      const matchesTemplate = !filters.template || email.template_key === filters.template;

      return matchesQuery && matchesStatus && matchesTemplate;
    });
  }, [deferredQuery, emails, filters.status, filters.template]);

  return (
    <div className="jobs-board">
      <section className="dashboard-form">
        <div className="dashboard-form__head">
          <div>
            <p className="eyebrow">Emails transactionnels</p>
            <h2>Suivez la file d'attente et les messages prepares pour le provider</h2>
          </div>
          <span className="tag">{filteredEmails.length} email(s)</span>
        </div>

        <div className="form-grid">
          <label className="field field--full">
            <span>Recherche</span>
            <input
              value={filters.query}
              onChange={(event) =>
                setFilters((previous) => ({
                  ...previous,
                  query: event.target.value
                }))
              }
              placeholder="Destinataire, sujet, template..."
            />
          </label>

          <label className="field">
            <span>Statut</span>
            <select
              value={filters.status}
              onChange={(event) =>
                setFilters((previous) => ({
                  ...previous,
                  status: event.target.value
                }))
              }
            >
              <option value="">Tous</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {getTransactionalEmailStatusMeta(status).label}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Template</span>
            <select
              value={filters.template}
              onChange={(event) =>
                setFilters((previous) => ({
                  ...previous,
                  template: event.target.value
                }))
              }
            >
              <option value="">Tous</option>
              {templateOptions.map((templateKey) => (
                <option key={templateKey} value={templateKey}>
                  {getTransactionalEmailTemplateMeta(templateKey).label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="dashboard-list">
        {filteredEmails.length > 0 ? (
          filteredEmails.map((email) => {
            const templateMeta = getTransactionalEmailTemplateMeta(email.template_key);
            const statusMeta = getTransactionalEmailStatusMeta(email.status);

            return (
              <article key={email.id} className="panel list-card dashboard-card">
                <div className="dashboard-card__top">
                  <div>
                    <h3>{email.subject}</h3>
                    <p>{templateMeta.label}</p>
                  </div>
                  <span className={`tag tag--${statusMeta.tone}`}>{statusMeta.label}</span>
                </div>

                <p>{email.preview_text}</p>

                <div className="job-card__meta">
                  <span>{email.recipient_name || email.recipient_email}</span>
                  <span>{formatDisplayDate(email.created_at)}</span>
                  <span>{templateMeta.description}</span>
                </div>

                <div className="job-card__footer">
                  <small>
                    {email.provider
                      ? `Provider: ${email.provider}`
                      : "Provider non branche pour le moment"}
                  </small>
                  <div className="notification-card__actions">
                    <Link href={`/app/admin/emails/${email.id}`}>Voir l'email</Link>
                    {email.link_href ? <Link href={email.link_href}>Ouvrir le contexte</Link> : null}
                  </div>
                </div>

                {email.error_message ? (
                  <p className="form-feedback form-feedback--error">{email.error_message}</p>
                ) : null}
              </article>
            );
          })
        ) : (
          <article className="panel jobs-empty">
            <h2>Aucun email transactionnel pour le moment</h2>
            <p>Les confirmations et mises a jour email apparaitront ici au fil des actions plateforme.</p>
          </article>
        )}
      </section>
    </div>
  );
}
