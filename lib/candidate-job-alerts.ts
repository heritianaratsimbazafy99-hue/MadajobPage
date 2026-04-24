import {
  CANDIDATE_JOB_ALERT_KIND,
  getCandidateJobAlertEligibility,
  hasCandidateJobAlertPreference
} from "@/lib/candidate-job-alert-eligibility";
import type { MatchableJob, MatchingCandidateProfile } from "@/lib/matching";
import { createNotifications } from "@/lib/notifications";
import { createAdminClient } from "@/lib/supabase/admin";

type CandidateJobAlertProfile = MatchingCandidateProfile & {
  id: string;
  full_name: string | null;
  email: string | null;
};

type CandidateJobAlertRow = {
  id: string;
  candidate_id: string;
  job_post_id: string;
};

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
    const parsedValue = Number(value);
    return Number.isFinite(parsedValue) ? parsedValue : null;
  }

  return null;
}

async function getActiveCandidateProfiles() {
  const adminClient = createAdminClient();

  if (!adminClient) {
    return [] as CandidateJobAlertProfile[];
  }

  const { data: candidateRows, error: candidateError } = await adminClient
    .from("candidate_profiles")
    .select(
      "user_id, headline, city, current_position, desired_position, desired_contract_type, desired_work_mode, desired_salary_min, desired_salary_currency, skills_text, cv_text, profile_completion"
    );

  if (candidateError || !candidateRows?.length) {
    return [] as CandidateJobAlertProfile[];
  }

  const candidateIds = Array.from(
    new Set(
      candidateRows
        .map((row: Record<string, unknown>) => getStringValue(row, "user_id"))
        .filter(Boolean)
    )
  );

  if (!candidateIds.length) {
    return [] as CandidateJobAlertProfile[];
  }

  const { data: profileRows, error: profileError } = await adminClient
    .from("profiles")
    .select("id, full_name, email")
    .in("id", candidateIds)
    .eq("role", "candidat")
    .eq("is_active", true);

  if (profileError || !profileRows?.length) {
    return [] as CandidateJobAlertProfile[];
  }

  const profilesById = new Map(
    profileRows.map((row: Record<string, unknown>) => [
      getStringValue(row, "id"),
      {
        full_name: getNullableStringValue(row, "full_name"),
        email: getNullableStringValue(row, "email")
      }
    ])
  );

  return candidateRows
    .map((row: Record<string, unknown>): CandidateJobAlertProfile | null => {
      const id = getStringValue(row, "user_id");
      const profile = profilesById.get(id);

      if (!id || !profile) {
        return null;
      }

      return {
        id,
        ...profile,
        headline: getNullableStringValue(row, "headline"),
        city: getNullableStringValue(row, "city"),
        current_position: getNullableStringValue(row, "current_position"),
        desired_position: getNullableStringValue(row, "desired_position"),
        desired_contract_type: getNullableStringValue(row, "desired_contract_type"),
        desired_work_mode: getNullableStringValue(row, "desired_work_mode"),
        desired_salary_min: getNumberValue(row, "desired_salary_min"),
        desired_salary_currency: getNullableStringValue(row, "desired_salary_currency") ?? "MGA",
        skills_text: getNullableStringValue(row, "skills_text"),
        cv_text: getNullableStringValue(row, "cv_text"),
        profile_completion: getNumberValue(row, "profile_completion")
      } satisfies CandidateJobAlertProfile;
    })
    .filter((profile): profile is CandidateJobAlertProfile =>
      Boolean(profile && hasCandidateJobAlertPreference(profile))
    );
}

export async function createCandidateJobAlertsForPublishedJob(job: MatchableJob) {
  if (job.status !== "published") {
    return {
      matchedCount: 0,
      createdCount: 0
    };
  }

  const adminClient = createAdminClient();

  if (!adminClient) {
    return {
      matchedCount: 0,
      createdCount: 0
    };
  }

  const candidates = await getActiveCandidateProfiles();
  const eligibleMatches = candidates
    .map((candidate) => ({
      candidate,
      eligibility: getCandidateJobAlertEligibility(candidate, job)
    }))
    .filter((entry) => entry.eligibility.eligible);

  if (!eligibleMatches.length) {
    return {
      matchedCount: 0,
      createdCount: 0
    };
  }

  const alertRows = eligibleMatches.map(({ candidate, eligibility }) => ({
    candidate_id: candidate.id,
    job_post_id: job.id,
    match_score: eligibility.match.score,
    match_level: eligibility.match.level,
    match_reason: eligibility.match.reason,
    metadata: {
      job_slug: job.slug,
      job_title: job.title,
      matched_keywords: eligibility.match.matchedKeywords,
      preference_reasons: eligibility.reasons
    }
  }));

  const { data: insertedAlerts, error: insertError } = await adminClient
    .from("candidate_job_alerts")
    .upsert(alertRows, {
      onConflict: "candidate_id,job_post_id",
      ignoreDuplicates: true
    })
    .select("id, candidate_id, job_post_id");

  if (insertError || !insertedAlerts?.length) {
    return {
      matchedCount: eligibleMatches.length,
      createdCount: 0
    };
  }

  const matchesByCandidateId = new Map(
    eligibleMatches.map((entry) => [entry.candidate.id, entry])
  );

  await createNotifications(
    (insertedAlerts as CandidateJobAlertRow[])
      .map((alert) => {
        const matchEntry = matchesByCandidateId.get(alert.candidate_id);

        if (!matchEntry) {
          return null;
        }

        const { eligibility } = matchEntry;

        return {
          user_id: alert.candidate_id,
          kind: CANDIDATE_JOB_ALERT_KIND,
          title: `Nouvelle offre compatible : ${job.title}`,
          body: `${eligibility.match.label} avec vos preferences. ${eligibility.match.reason}`,
          link_href: `/app/candidat/offres/${job.slug}`,
          metadata: {
            alert_id: alert.id,
            job_post_id: job.id,
            job_slug: job.slug,
            match_score: eligibility.match.score,
            match_level: eligibility.match.level,
            preference_reasons: eligibility.reasons
          }
        };
      })
      .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
  );

  return {
    matchedCount: eligibleMatches.length,
    createdCount: insertedAlerts.length
  };
}
