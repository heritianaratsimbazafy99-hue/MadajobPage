import { unstable_noStore as noStore } from "next/cache";

import { isSupabaseConfigured } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { CvLibraryDocument, CvLibraryParsingStatus, Profile } from "@/lib/types";

const signedUrlTtlSeconds = 60 * 30;

function getStringValue(record: Record<string, unknown>, key: string) {
  return typeof record[key] === "string" ? String(record[key]) : "";
}

function getNullableStringValue(record: Record<string, unknown>, key: string) {
  return typeof record[key] === "string" ? String(record[key]) : null;
}

function getNumberValue(record: Record<string, unknown>, key: string) {
  const value = record[key];

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function getTags(record: Record<string, unknown>) {
  return Array.isArray(record.tags)
    ? record.tags.map((tag) => String(tag)).filter(Boolean)
    : [];
}

function getJsonRecord(record: Record<string, unknown>, key: string) {
  return typeof record[key] === "object" && record[key] !== null
    ? (record[key] as Record<string, unknown>)
    : {};
}

function mapCvLibraryRecord(
  record: Record<string, unknown>,
  downloadUrl: string | null
): CvLibraryDocument {
  return {
    id: getStringValue(record, "id"),
    organization_id: getNullableStringValue(record, "organization_id"),
    uploaded_by: getStringValue(record, "uploaded_by"),
    source_label: getNullableStringValue(record, "source_label"),
    candidate_name: getNullableStringValue(record, "candidate_name"),
    candidate_email: getNullableStringValue(record, "candidate_email"),
    candidate_phone: getNullableStringValue(record, "candidate_phone"),
    bucket_id: getStringValue(record, "bucket_id") || "cv-library",
    storage_path: getStringValue(record, "storage_path"),
    file_name: getStringValue(record, "file_name"),
    mime_type: getNullableStringValue(record, "mime_type"),
    file_size: getNumberValue(record, "file_size"),
    parsing_status: (getStringValue(record, "parsing_status") || "pending") as CvLibraryParsingStatus,
    parsing_error: getNullableStringValue(record, "parsing_error"),
    parsed_text: getStringValue(record, "parsed_text"),
    ai_summary: getJsonRecord(record, "ai_summary"),
    tags: getTags(record),
    is_archived: Boolean(record.is_archived),
    created_at: getStringValue(record, "created_at"),
    updated_at: getStringValue(record, "updated_at"),
    download_url: downloadUrl
  };
}

export async function getCvLibraryDocuments(
  profile: Profile,
  options: { limit?: number } = {}
) {
  noStore();

  if (!isSupabaseConfigured) {
    return [] as CvLibraryDocument[];
  }

  const { limit = 160 } = options;
  const supabase = createAdminClient() ?? (await createClient());
  let query = supabase
    .from("cv_library_documents")
    .select(
      "id, organization_id, uploaded_by, source_label, candidate_name, candidate_email, candidate_phone, bucket_id, storage_path, file_name, mime_type, file_size, parsing_status, parsing_error, parsed_text, ai_summary, tags, is_archived, created_at, updated_at"
    )
    .eq("is_archived", false)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (profile.role === "recruteur") {
    if (profile.organization_id) {
      query = query.or(`organization_id.eq.${profile.organization_id},uploaded_by.eq.${profile.id}`);
    } else {
      query = query.eq("uploaded_by", profile.id);
    }
  }

  const { data, error } = await query;

  if (error || !data?.length) {
    return [] as CvLibraryDocument[];
  }

  const signedUrls = await Promise.all(
    (data as Record<string, unknown>[]).map(async (row) => {
      const bucketId = getStringValue(row, "bucket_id") || "cv-library";
      const storagePath = getStringValue(row, "storage_path");

      if (!storagePath) {
        return null;
      }

      const { data: signedUrlData } = await supabase.storage
        .from(bucketId)
        .createSignedUrl(storagePath, signedUrlTtlSeconds);

      return signedUrlData?.signedUrl ?? null;
    })
  );

  return (data as Record<string, unknown>[]).map((row, index) =>
    mapCvLibraryRecord(row, signedUrls[index] ?? null)
  );
}
