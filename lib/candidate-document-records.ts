import type { CandidateDocumentData } from "@/lib/types";

type CandidateDocumentStorageClient = {
  storage: {
    from: (bucketId: string) => {
      createSignedUrl: (
        storagePath: string,
        expiresIn: number
      ) => Promise<{ data: { signedUrl?: string } | null }>;
    };
  };
} | null;

export function mapCandidateDocumentRecord(record: Record<string, unknown>): CandidateDocumentData {
  return {
    id: String(record.id),
    document_type: String(record.document_type ?? "cv"),
    bucket_id: String(record.bucket_id ?? "candidate-cv"),
    storage_path: String(record.storage_path ?? ""),
    file_name: String(record.file_name ?? "cv"),
    mime_type: typeof record.mime_type === "string" ? record.mime_type : null,
    file_size: typeof record.file_size === "number" ? record.file_size : null,
    is_primary: Boolean(record.is_primary),
    created_at: String(record.created_at ?? "")
  };
}

export async function createSignedUrlForDocument(
  adminClient: CandidateDocumentStorageClient,
  document: CandidateDocumentData | null
) {
  if (!adminClient || !document?.storage_path || !document.bucket_id) {
    return null;
  }

  const { data } = await adminClient.storage
    .from(document.bucket_id)
    .createSignedUrl(document.storage_path, 60 * 20);

  return data?.signedUrl ?? null;
}
