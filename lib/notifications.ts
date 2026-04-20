import { unstable_noStore as noStore } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { AppNotification, AppRole } from "@/lib/types";

type NotificationInsert = {
  user_id: string;
  kind: string;
  title: string;
  body: string;
  link_href?: string | null;
  metadata?: Record<string, unknown>;
};

function mapNotificationRecord(record: Record<string, unknown>): AppNotification {
  return {
    id: String(record.id),
    user_id: String(record.user_id ?? ""),
    kind: String(record.kind ?? "general"),
    title: String(record.title ?? "Notification Madajob"),
    body: String(record.body ?? ""),
    link_href: typeof record.link_href === "string" ? record.link_href : null,
    is_read: Boolean(record.is_read),
    read_at: typeof record.read_at === "string" ? record.read_at : null,
    created_at: String(record.created_at ?? ""),
    metadata:
      typeof record.metadata === "object" && record.metadata !== null
        ? (record.metadata as Record<string, unknown>)
        : {}
  };
}

export async function getNotifications(userId: string, options: { limit?: number } = {}) {
  noStore();
  const { limit = 50 } = options;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("id, user_id, kind, title, body, link_href, is_read, read_at, created_at, metadata")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) {
    return [] as AppNotification[];
  }

  return data.map((row) => mapNotificationRecord(row));
}

export async function getUnreadNotificationsCount(userId: string) {
  noStore();
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false);

  if (error) {
    return 0;
  }

  return count ?? 0;
}

export async function createNotifications(entries: NotificationInsert[]) {
  if (!entries.length) {
    return;
  }

  const adminClient = createAdminClient();

  if (!adminClient) {
    return;
  }

  await adminClient.from("notifications").insert(
    entries.map((entry) => ({
      user_id: entry.user_id,
      kind: entry.kind,
      title: entry.title,
      body: entry.body,
      link_href: entry.link_href ?? null,
      metadata: entry.metadata ?? {}
    }))
  );
}

export async function markNotificationRead(notificationId: string, userId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("notifications")
    .update({
      is_read: true,
      read_at: new Date().toISOString()
    })
    .eq("id", notificationId)
    .eq("user_id", userId);

  return !error;
}

export async function markAllNotificationsRead(userId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("notifications")
    .update({
      is_read: true,
      read_at: new Date().toISOString()
    })
    .eq("user_id", userId)
    .eq("is_read", false);

  return !error;
}

export async function getActiveProfileIdsByRole(
  role: AppRole,
  options: { organizationId?: string | null } = {}
) {
  const adminClient = createAdminClient();

  if (!adminClient) {
    return [] as string[];
  }

  let query = adminClient
    .from("profiles")
    .select("id")
    .eq("role", role)
    .eq("is_active", true);

  if (options.organizationId) {
    query = query.eq("organization_id", options.organizationId);
  }

  const { data, error } = await query;

  if (error || !data) {
    return [] as string[];
  }

  return data.map((row) => String(row.id));
}
