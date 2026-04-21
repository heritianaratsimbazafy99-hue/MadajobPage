import { unstable_noStore as noStore } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { TransactionalEmail, TransactionalEmailStatus } from "@/lib/types";

type TransactionalEmailInsert = {
  recipient_email: string;
  recipient_name?: string | null;
  recipient_user_id?: string | null;
  template_key: string;
  subject: string;
  preview_text: string;
  link_href?: string | null;
  provider?: string | null;
  status?: TransactionalEmailStatus;
  metadata?: Record<string, unknown>;
};

function normalizeStatus(value: unknown): TransactionalEmailStatus {
  if (
    value === "queued" ||
    value === "processing" ||
    value === "sent" ||
    value === "failed" ||
    value === "skipped"
  ) {
    return value;
  }

  return "queued";
}

function mapTransactionalEmailRecord(record: Record<string, unknown>): TransactionalEmail {
  return {
    id: String(record.id),
    recipient_email: String(record.recipient_email ?? ""),
    recipient_name: typeof record.recipient_name === "string" ? record.recipient_name : null,
    recipient_user_id:
      typeof record.recipient_user_id === "string" ? record.recipient_user_id : null,
    template_key: String(record.template_key ?? "transactional_email"),
    subject: String(record.subject ?? "Email Madajob"),
    preview_text: String(record.preview_text ?? ""),
    link_href: typeof record.link_href === "string" ? record.link_href : null,
    status: normalizeStatus(record.status),
    provider: typeof record.provider === "string" ? record.provider : null,
    provider_message_id:
      typeof record.provider_message_id === "string" ? record.provider_message_id : null,
    attempts_count:
      typeof record.attempts_count === "number" ? record.attempts_count : Number(record.attempts_count ?? 0),
    last_attempt_at:
      typeof record.last_attempt_at === "string" ? record.last_attempt_at : null,
    sent_at: typeof record.sent_at === "string" ? record.sent_at : null,
    error_message: typeof record.error_message === "string" ? record.error_message : null,
    metadata:
      typeof record.metadata === "object" && record.metadata !== null
        ? (record.metadata as Record<string, unknown>)
        : {},
    created_at: String(record.created_at ?? ""),
    updated_at: String(record.updated_at ?? "")
  };
}

export async function getTransactionalEmails(options: { limit?: number } = {}) {
  noStore();
  const { limit = 200 } = options;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transactional_emails")
    .select(
      "id, recipient_email, recipient_name, recipient_user_id, template_key, subject, preview_text, link_href, status, provider, provider_message_id, attempts_count, last_attempt_at, sent_at, error_message, metadata, created_at, updated_at"
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) {
    return [] as TransactionalEmail[];
  }

  return data.map((row) => mapTransactionalEmailRecord(row));
}

export async function enqueueTransactionalEmails(entries: TransactionalEmailInsert[]) {
  const sanitizedEntries = entries.filter((entry) => entry.recipient_email.trim().length > 0);

  if (!sanitizedEntries.length) {
    return;
  }

  const adminClient = createAdminClient();

  if (!adminClient) {
    return;
  }

  await adminClient.from("transactional_emails").insert(
    sanitizedEntries.map((entry) => ({
      recipient_email: entry.recipient_email.trim().toLowerCase(),
      recipient_name: entry.recipient_name ?? null,
      recipient_user_id: entry.recipient_user_id ?? null,
      template_key: entry.template_key,
      subject: entry.subject,
      preview_text: entry.preview_text,
      link_href: entry.link_href ?? null,
      provider: entry.provider ?? null,
      status: entry.status ?? "queued",
      metadata: entry.metadata ?? {}
    }))
  );
}
