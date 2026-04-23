import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type CandidateSavedJobData = {
  job_post_id: string;
  note: string;
  created_at: string;
};

async function getSavedJobsClient() {
  return createAdminClient() ?? (await createClient());
}

export async function getCandidateSavedJobsMap(candidateId: string) {
  const supabase = await getSavedJobsClient();
  const { data, error } = await supabase
    .from("candidate_saved_jobs")
    .select("job_post_id, note, created_at")
    .eq("candidate_id", candidateId)
    .order("created_at", { ascending: false });

  if (error || !data) {
    return new Map<string, CandidateSavedJobData>();
  }

  return new Map(
    data.flatMap((item) => {
      const jobPostId = String(item.job_post_id ?? "");

      if (!jobPostId) {
        return [];
      }

      return [
        [
          jobPostId,
          {
            job_post_id: jobPostId,
            note: String(item.note ?? ""),
            created_at: String(item.created_at ?? "")
          } satisfies CandidateSavedJobData
        ] as const
      ];
    })
  );
}

export async function getCandidateSavedJobIds(candidateId: string) {
  return new Set((await getCandidateSavedJobsMap(candidateId)).keys());
}

export async function saveCandidateJob(candidateId: string, jobPostId: string) {
  const supabase = await getSavedJobsClient();

  return supabase.from("candidate_saved_jobs").upsert(
    {
      candidate_id: candidateId,
      job_post_id: jobPostId
    },
    { onConflict: "candidate_id,job_post_id" }
  );
}

export async function unsaveCandidateJob(candidateId: string, jobPostId: string) {
  const supabase = await getSavedJobsClient();

  return supabase
    .from("candidate_saved_jobs")
    .delete()
    .eq("candidate_id", candidateId)
    .eq("job_post_id", jobPostId);
}

export async function updateCandidateSavedJobNote(
  candidateId: string,
  jobPostId: string,
  note: string
) {
  const supabase = await getSavedJobsClient();

  return supabase
    .from("candidate_saved_jobs")
    .update({ note: note || null })
    .eq("candidate_id", candidateId)
    .eq("job_post_id", jobPostId);
}
