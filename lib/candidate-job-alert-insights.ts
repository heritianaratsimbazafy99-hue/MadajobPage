import type { CandidateJobAlert, CandidateProfileData } from "@/lib/types";

export type CandidateJobAlertPreferenceSignal = {
  label: string;
  value: string;
};

export type CandidateJobAlertSummary = {
  totalCount: number;
  strongCount: number;
  recentCount: number;
  visibleSalaryCount: number;
  topAlert: CandidateJobAlert | null;
  latestAlert: CandidateJobAlert | null;
  preferenceSignals: CandidateJobAlertPreferenceSignal[];
  preferencesConfigured: boolean;
};

const recentWindowInMs = 14 * 24 * 60 * 60 * 1000;

function getAlertTime(alert: CandidateJobAlert) {
  return new Date(alert.created_at).getTime() || 0;
}

function hasVisibleSalary(alert: CandidateJobAlert) {
  return Boolean(alert.job.salary_is_visible && (alert.job.salary_min || alert.job.salary_max));
}

export function getCandidateJobAlertPreferenceSignals(
  profile: Pick<
    CandidateProfileData,
    | "desired_contract_type"
    | "desired_work_mode"
    | "desired_salary_min"
    | "desired_salary_currency"
    | "desired_sectors"
    | "desired_locations"
    | "desired_experience_level"
  >
): CandidateJobAlertPreferenceSignal[] {
  const signals: CandidateJobAlertPreferenceSignal[] = [];
  const desiredSectors = profile.desired_sectors ?? [];
  const desiredLocations = profile.desired_locations ?? [];

  if (profile.desired_contract_type) {
    signals.push({
      label: "Contrat",
      value: profile.desired_contract_type
    });
  }

  if (profile.desired_work_mode) {
    signals.push({
      label: "Mode",
      value: profile.desired_work_mode
    });
  }

  if (profile.desired_salary_min && profile.desired_salary_min > 0) {
    signals.push({
      label: "Salaire minimum",
      value: `${new Intl.NumberFormat("fr-FR").format(profile.desired_salary_min)} ${profile.desired_salary_currency || "MGA"}/mois`
    });
  }

  if (desiredSectors.length > 0) {
    signals.push({
      label: "Secteurs",
      value: desiredSectors.join(", ")
    });
  }

  if (desiredLocations.length > 0) {
    signals.push({
      label: "Lieux",
      value: desiredLocations.join(", ")
    });
  }

  if (profile.desired_experience_level) {
    signals.push({
      label: "Niveau",
      value: profile.desired_experience_level
    });
  }

  return signals;
}

export function summarizeCandidateJobAlerts(
  alerts: CandidateJobAlert[],
  profile: Pick<
    CandidateProfileData,
    | "desired_contract_type"
    | "desired_work_mode"
    | "desired_salary_min"
    | "desired_salary_currency"
    | "desired_sectors"
    | "desired_locations"
    | "desired_experience_level"
  >,
  now = Date.now()
): CandidateJobAlertSummary {
  const sortedByDate = [...alerts].sort((left, right) => getAlertTime(right) - getAlertTime(left));
  const topAlert =
    [...alerts].sort((left, right) => {
      if (left.match_score !== right.match_score) {
        return right.match_score - left.match_score;
      }

      return getAlertTime(right) - getAlertTime(left);
    })[0] ?? null;
  const preferenceSignals = getCandidateJobAlertPreferenceSignals(profile);

  return {
    totalCount: alerts.length,
    strongCount: alerts.filter((alert) => alert.match_score >= 78 || alert.match_level === "fort").length,
    recentCount: alerts.filter((alert) => now - getAlertTime(alert) <= recentWindowInMs).length,
    visibleSalaryCount: alerts.filter((alert) => hasVisibleSalary(alert)).length,
    topAlert,
    latestAlert: sortedByDate[0] ?? null,
    preferenceSignals,
    preferencesConfigured: preferenceSignals.length > 0
  };
}
