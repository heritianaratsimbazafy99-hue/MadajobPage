import {
  CANDIDATE_JOB_ALERT_KIND,
  getCandidateJobAlertEligibility,
  hasCandidateJobAlertPreference
} from "@/lib/candidate-job-alert-eligibility";
import { unstable_noStore as noStore } from "next/cache";

import { isSupabaseConfigured } from "@/lib/env";
import type { MatchableJob, MatchingCandidateProfile } from "@/lib/matching";
import { createNotifications } from "@/lib/notifications";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { CandidateJobAlert, Job } from "@/lib/types";

type CandidateJobAlertProfile = MatchingCandidateProfile & {
  id: string;
  full_name: string | null;
  email: string | null;
  job_alerts_enabled: boolean;
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

function getStringArrayValue(record: Record<string, unknown>, key: string) {
  const value = record[key];

  return Array.isArray(value)
    ? value.map((item) => String(item).trim()).filter(Boolean)
    : [];
}

function getBooleanValue(record: Record<string, unknown>, key: string, fallback = false) {
  return typeof record[key] === "boolean" ? Boolean(record[key]) : fallback;
}

function mapAlertJobRecord(record: Record<string, unknown>): Job {
  const salaryMin = getNumberValue(record, "salary_min");
  const salaryMax = getNumberValue(record, "salary_max");

  return {
    id: getStringValue(record, "id"),
    title: getStringValue(record, "title"),
    slug: getStringValue(record, "slug"),
    department: getStringValue(record, "department"),
    location: getStringValue(record, "location"),
    contract_type: getStringValue(record, "contract_type"),
    work_mode: getStringValue(record, "work_mode"),
    sector: getStringValue(record, "sector"),
    summary: getStringValue(record, "summary"),
    responsibilities: getStringValue(record, "responsibilities"),
    requirements: getStringValue(record, "requirements"),
    benefits: getStringValue(record, "benefits"),
    salary_min: salaryMin,
    salary_max: salaryMax,
    salary_currency: getStringValue(record, "salary_currency") || "MGA",
    salary_period: getStringValue(record, "salary_period") || "month",
    salary_is_visible: getBooleanValue(record, "salary_is_visible"),
    status: (getStringValue(record, "status") as Job["status"]) || "published",
    is_featured: getBooleanValue(record, "is_featured"),
    published_at: getNullableStringValue(record, "published_at"),
    created_at: getNullableStringValue(record, "created_at"),
    closing_at: getNullableStringValue(record, "closing_at"),
    organization_name: getStringValue(record, "organization_name") || "Madajob"
  };
}

function mapCandidateJobAlertRecord(
  record: Record<string, unknown>,
  job: Job
): CandidateJobAlert {
  return {
    id: getStringValue(record, "id"),
    candidate_id: getStringValue(record, "candidate_id"),
    job_post_id: getStringValue(record, "job_post_id"),
    match_score: getNumberValue(record, "match_score") ?? 0,
    match_level: getStringValue(record, "match_level") || "faible",
    match_reason: getNullableStringValue(record, "match_reason"),
    metadata:
      typeof record.metadata === "object" && record.metadata !== null
        ? (record.metadata as Record<string, unknown>)
        : {},
    created_at: getStringValue(record, "created_at"),
    updated_at: getStringValue(record, "updated_at"),
    job
  };
}

async function getActiveCandidateProfiles() {
  const adminClient = createAdminClient();

  if (!adminClient) {
    return [] as CandidateJobAlertProfile[];
  }

  const { data: candidateRows, error: candidateError } = await adminClient
    .from("candidate_profiles")
    .select(
      "user_id, headline, city, current_position, desired_position, desired_contract_type, desired_work_mode, desired_salary_min, desired_salary_currency, desired_sectors, desired_locations, desired_experience_level, job_alerts_enabled, skills_text, cv_text, profile_completion"
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
        desired_sectors: getStringArrayValue(row, "desired_sectors"),
        desired_locations: getStringArrayValue(row, "desired_locations"),
        desired_experience_level: getNullableStringValue(row, "desired_experience_level"),
        job_alerts_enabled: getBooleanValue(row, "job_alerts_enabled", true),
        skills_text: getNullableStringValue(row, "skills_text"),
        cv_text: getNullableStringValue(row, "cv_text"),
        profile_completion: getNumberValue(row, "profile_completion")
      } satisfies CandidateJobAlertProfile;
    })
    .filter((profile): profile is CandidateJobAlertProfile =>
      Boolean(profile && profile.job_alerts_enabled && hasCandidateJobAlertPreference(profile))
    );
}

export async function getCandidateJobAlerts(
  candidateId: string,
  options: { limit?: number } = {}
) {
  noStore();

  if (!isSupabaseConfigured) {
    return [] as CandidateJobAlert[];
  }

  const { limit = 80 } = options;
  const supabase = await createClient();
  const { data: alertRows, error: alertError } = await supabase
    .from("candidate_job_alerts")
    .select(
      "id, candidate_id, job_post_id, match_score, match_level, match_reason, metadata, created_at, updated_at"
    )
    .eq("candidate_id", candidateId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (alertError || !alertRows?.length) {
    return [] as CandidateJobAlert[];
  }

  const jobIds = Array.from(
    new Set(
      alertRows
        .map((row: Record<string, unknown>) => getStringValue(row, "job_post_id"))
        .filter(Boolean)
    )
  );

  if (!jobIds.length) {
    return [] as CandidateJobAlert[];
  }

  const { data: jobRows, error: jobError } = await supabase
    .from("job_posts")
    .select(
      "id, title, slug, department, location, contract_type, work_mode, sector, summary, responsibilities, requirements, benefits, salary_min, salary_max, salary_currency, salary_period, salary_is_visible, status, is_featured, published_at, created_at, closing_at"
    )
    .in("id", jobIds)
    .eq("status", "published");

  if (jobError || !jobRows?.length) {
    return [] as CandidateJobAlert[];
  }

  const jobsById = new Map(
    (jobRows as Record<string, unknown>[]).map((row) => [getStringValue(row, "id"), mapAlertJobRecord(row)])
  );

  return (alertRows as Record<string, unknown>[])
    .map((row) => {
      const job = jobsById.get(getStringValue(row, "job_post_id"));

      return job ? mapCandidateJobAlertRecord(row, job) : null;
    })
    .filter((alert): alert is CandidateJobAlert => Boolean(alert));
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
