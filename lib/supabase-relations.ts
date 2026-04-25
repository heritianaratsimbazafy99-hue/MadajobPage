export type SupabaseRelation<T> = T | T[] | null | undefined;

export type ApplicationAccessJobRow = {
  id?: string | null;
  slug?: string | null;
  title?: string | null;
  location?: string | null;
  contract_type?: string | null;
  work_mode?: string | null;
  sector?: string | null;
  summary?: string | null;
  organization_id?: string | null;
};

export type ApplicationAccessRow = {
  id: string;
  candidate_id: string | null;
  status: string | null;
  created_at: string | null;
  updated_at?: string | null;
  cover_letter?: string | null;
  cv_document_id?: string | null;
  job_posts: SupabaseRelation<ApplicationAccessJobRow>;
};

export function normalizeSupabaseRelation<T>(relation: SupabaseRelation<T>): T | null {
  if (!relation) {
    return null;
  }

  return Array.isArray(relation) ? relation[0] ?? null : relation;
}

export function normalizeJobRelation(
  relation: ApplicationAccessRow["job_posts"]
): Record<string, unknown> | null {
  return normalizeSupabaseRelation(relation) as Record<string, unknown> | null;
}
