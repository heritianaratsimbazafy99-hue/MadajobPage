import { appEnv } from "@/lib/env";
import type { Job } from "@/lib/types";

const siteName = "Madajob";
const defaultSiteUrl = "https://madajob-page.vercel.app";

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getPlainTextParts(job: Job) {
  return [
    job.summary,
    job.responsibilities,
    job.requirements,
    job.benefits
  ]
    .map((item) => normalizeWhitespace(item ?? ""))
    .filter(Boolean);
}

function toIsoDateTime(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function getEmploymentType(contractType: string) {
  const normalized = contractType
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  if (normalized.includes("cdi")) {
    return "FULL_TIME";
  }

  if (normalized.includes("temps partiel")) {
    return "PART_TIME";
  }

  if (normalized.includes("stage") || normalized.includes("alternance")) {
    return "INTERN";
  }

  if (normalized.includes("freelance") || normalized.includes("consultance")) {
    return "CONTRACTOR";
  }

  if (normalized.includes("cdd") || normalized.includes("interim")) {
    return "TEMPORARY";
  }

  return contractType ? "OTHER" : undefined;
}

function getSalaryUnitText(period: string | null | undefined) {
  switch (period) {
    case "hour":
      return "HOUR";
    case "day":
      return "DAY";
    case "year":
      return "YEAR";
    case "month":
    default:
      return "MONTH";
  }
}

function getBaseSalary(job: Job) {
  if (!job.salary_is_visible || (!job.salary_min && !job.salary_max)) {
    return undefined;
  }

  const minValue = job.salary_min ?? null;
  const maxValue = job.salary_max ?? null;
  const currency = (job.salary_currency || "MGA").toUpperCase();
  const unitText = getSalaryUnitText(job.salary_period);
  const value =
    minValue && maxValue && minValue !== maxValue
      ? {
          "@type": "QuantitativeValue",
          minValue,
          maxValue,
          unitText
        }
      : {
          "@type": "QuantitativeValue",
          value: minValue ?? maxValue,
          unitText
        };

  return {
    "@type": "MonetaryAmount",
    currency,
    value
  };
}

function getLocationLabel(job: Job) {
  return normalizeWhitespace(job.location || "Madagascar");
}

function isRemoteJob(job: Job) {
  const normalizedMode = job.work_mode
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  return normalizedMode.includes("remote");
}

export function getPublicSiteUrl() {
  return trimTrailingSlash(appEnv.siteUrl || defaultSiteUrl);
}

export function getJobCanonicalUrl(job: Job) {
  return `${getPublicSiteUrl()}/carrieres/${job.slug}`;
}

export function getJobSeoTitle(job: Job) {
  return `${job.title} | Offre d'emploi Madajob`;
}

export function getJobSeoDescription(job: Job) {
  const description = getPlainTextParts(job).join(" ");

  return description.length > 180 ? `${description.slice(0, 177).trim()}...` : description;
}

export function getJobPostingDescriptionHtml(job: Job) {
  const sections = [
    job.summary ? `<p>${escapeHtml(normalizeWhitespace(job.summary))}</p>` : "",
    job.responsibilities
      ? `<p>Missions : ${escapeHtml(normalizeWhitespace(job.responsibilities))}</p>`
      : "",
    job.requirements
      ? `<p>Profil attendu : ${escapeHtml(normalizeWhitespace(job.requirements))}</p>`
      : "",
    job.benefits ? `<p>Package : ${escapeHtml(normalizeWhitespace(job.benefits))}</p>` : ""
  ].filter(Boolean);

  return sections.join("");
}

export function buildJobPostingJsonLd(job: Job) {
  const datePosted =
    toIsoDateTime(job.published_at) ??
    toIsoDateTime(job.created_at) ??
    new Date().toISOString();
  const validThrough = toIsoDateTime(job.closing_at);
  const employmentType = getEmploymentType(job.contract_type);
  const baseSalary = getBaseSalary(job);
  const canonicalUrl = getJobCanonicalUrl(job);
  const locationLabel = getLocationLabel(job);
  const remoteJob = isRemoteJob(job);

  return {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: getJobPostingDescriptionHtml(job),
    datePosted,
    ...(validThrough ? { validThrough } : {}),
    ...(employmentType ? { employmentType } : {}),
    identifier: {
      "@type": "PropertyValue",
      name: job.organization_name || siteName,
      value: job.id
    },
    hiringOrganization: {
      "@type": "Organization",
      name: job.organization_name || siteName,
      sameAs: getPublicSiteUrl()
    },
    industry: job.sector || undefined,
    occupationalCategory: job.department || job.sector || undefined,
    responsibilities: job.responsibilities || undefined,
    qualifications: job.requirements || undefined,
    jobBenefits: job.benefits || undefined,
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: locationLabel,
        addressCountry: "MG"
      }
    },
    ...(remoteJob
      ? {
          jobLocationType: "TELECOMMUTE",
          applicantLocationRequirements: {
            "@type": "Country",
            name: "Madagascar"
          }
        }
      : {}),
    ...(baseSalary ? { baseSalary } : {}),
    url: canonicalUrl
  };
}

export function stringifyJsonLd(value: Record<string, unknown>) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
