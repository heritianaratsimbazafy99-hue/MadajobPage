import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

async function getSavedJobsClient() {
  return createAdminClient() ?? (await createClient());
}

export async function getCandidateSavedJobIds(candidateId: string) {
  const supabase = await getSavedJobsClient();
  const { data, error } = await supabase
    .from("candidate_saved_jobs")
    .select("job_post_id")
    .eq("candidate_id", candidateId);

  if (error || !data) {
    return new Set<string>();
  }

  return new Set(
    data
      .map((item) => String(item.job_post_id ?? ""))
      .filter(Boolean)
  );
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
