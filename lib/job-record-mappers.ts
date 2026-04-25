import type { Job, ManagedJob } from "@/lib/types";

export function getNumericRecordValue(
  record: Record<string, unknown> | null | undefined,
  key: string
) {
  const value = record?.[key];

  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

export function getStringArrayRecordValue(
  record: Record<string, unknown> | null | undefined,
  key: string
) {
  const value = record?.[key];

  return Array.isArray(value)
    ? value.map((item) => String(item).trim()).filter(Boolean)
    : [];
}

export function mapJobRecord(record: Record<string, unknown>): Job {
  const salaryMin = getNumericRecordValue(record, "salary_min");
  const salaryMax = getNumericRecordValue(record, "salary_max");

  return {
    id: String(record.id),
    title: String(record.title ?? ""),
    slug: String(record.slug ?? ""),
    department: typeof record.department === "string" ? record.department : "",
    location: String(record.location ?? ""),
    contract_type: String(record.contract_type ?? ""),
    work_mode: String(record.work_mode ?? ""),
    sector: String(record.sector ?? ""),
    summary: String(record.summary ?? ""),
    responsibilities:
      typeof record.responsibilities === "string" ? record.responsibilities : "",
    requirements: typeof record.requirements === "string" ? record.requirements : "",
    benefits: typeof record.benefits === "string" ? record.benefits : "",
    salary_min: Number.isFinite(salaryMin) ? salaryMin : null,
    salary_max: Number.isFinite(salaryMax) ? salaryMax : null,
    salary_currency: typeof record.salary_currency === "string" ? record.salary_currency : "MGA",
    salary_period: typeof record.salary_period === "string" ? record.salary_period : "month",
    salary_is_visible: Boolean(record.salary_is_visible),
    status: (record.status as Job["status"]) ?? "draft",
    is_featured: Boolean(record.is_featured),
    published_at: (record.published_at as string | null) ?? null,
    created_at: typeof record.created_at === "string" ? record.created_at : null,
    closing_at: typeof record.closing_at === "string" ? record.closing_at : null,
    organization_name:
      typeof record.organization_name === "string"
        ? record.organization_name
        : "Madajob"
  };
}

export function mapManagedJobRecord(record: Record<string, unknown>): ManagedJob {
  const salaryMin = getNumericRecordValue(record, "salary_min");
  const salaryMax = getNumericRecordValue(record, "salary_max");

  return {
    ...mapJobRecord(record),
    organization_id: typeof record.organization_id === "string" ? record.organization_id : null,
    department: typeof record.department === "string" ? record.department : "",
    responsibilities:
      typeof record.responsibilities === "string" ? record.responsibilities : "",
    requirements: typeof record.requirements === "string" ? record.requirements : "",
    benefits: typeof record.benefits === "string" ? record.benefits : "",
    salary_min: Number.isFinite(salaryMin) ? salaryMin : null,
    salary_max: Number.isFinite(salaryMax) ? salaryMax : null,
    salary_currency: typeof record.salary_currency === "string" ? record.salary_currency : "MGA",
    salary_period: typeof record.salary_period === "string" ? record.salary_period : "month",
    salary_is_visible: Boolean(record.salary_is_visible),
    created_at: String(record.created_at ?? ""),
    updated_at: String(record.updated_at ?? ""),
    closing_at: typeof record.closing_at === "string" ? record.closing_at : null,
    applications_count:
      typeof record.applications_count === "number" ? record.applications_count : 0
  };
}
