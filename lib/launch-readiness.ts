export type LaunchReadinessStatus = "ok" | "warning" | "danger" | "muted";

export type LaunchReadinessCheck = {
  id: string;
  title: string;
  status: LaunchReadinessStatus;
  value: string;
  detail: string;
  href?: string;
};

type LaunchEnvironment = Record<string, string | undefined>;

export const EXPECTED_PRODUCTION_SITE_URL = "https://madajob-page.vercel.app";

export const REQUIRED_VERCEL_ENV_KEYS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_SITE_URL"
] as const;

export const CRITICAL_VERCEL_ENV_KEYS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"
] as const;

export const EXPECTED_SUPABASE_AUTH_REDIRECT_URLS = [
  "http://localhost:3000/**",
  "https://madajob-page.vercel.app/**"
] as const;

const LAUNCH_SQL_DOMAINS = [
  "schema/RLS",
  "notifications",
  "emails transactionnels",
  "entretiens",
  "remuneration",
  "preferences candidat",
  "alertes candidat",
  "CVtheque"
] as const;

function isPresent(value: string | undefined) {
  return Boolean(value && value.trim());
}

function normalizeUrl(value: string | undefined) {
  return value?.trim().replace(/\/+$/, "") ?? "";
}

function buildVercelEnvCheck(env: LaunchEnvironment): LaunchReadinessCheck {
  const missingKeys = REQUIRED_VERCEL_ENV_KEYS.filter((key) => !isPresent(env[key]));
  const missingCriticalKeys = CRITICAL_VERCEL_ENV_KEYS.filter((key) => !isPresent(env[key]));
  const configuredCount = REQUIRED_VERCEL_ENV_KEYS.length - missingKeys.length;
  const status =
    missingCriticalKeys.length > 0 ? "danger" : missingKeys.length > 0 ? "warning" : "ok";

  return {
    id: "launch-vercel-env-vars",
    title: "Variables Vercel",
    status,
    value: `${configuredCount}/${REQUIRED_VERCEL_ENV_KEYS.length} configuree(s)`,
    detail:
      missingKeys.length > 0
        ? `A completer dans Vercel : ${missingKeys.join(", ")}.`
        : "Les variables attendues pour Supabase, Auth et l'URL publique sont presentes."
  };
}

function buildSiteUrlCheck(env: LaunchEnvironment): LaunchReadinessCheck {
  const configuredSiteUrl = normalizeUrl(env.NEXT_PUBLIC_SITE_URL);
  const status = configuredSiteUrl === EXPECTED_PRODUCTION_SITE_URL ? "ok" : "warning";

  return {
    id: "launch-site-url",
    title: "URL publique canonique",
    status,
    value: configuredSiteUrl || "Fallback production",
    detail:
      configuredSiteUrl === EXPECTED_PRODUCTION_SITE_URL
        ? "NEXT_PUBLIC_SITE_URL pointe vers l'URL de production Madajob."
        : `Configurez NEXT_PUBLIC_SITE_URL sur ${EXPECTED_PRODUCTION_SITE_URL} avant le deploiement final.`
  };
}

export function getLaunchReadinessChecks(
  env: LaunchEnvironment = process.env
): LaunchReadinessCheck[] {
  return [
    buildVercelEnvCheck(env),
    buildSiteUrlCheck(env),
    {
      id: "launch-seo-public-routes",
      title: "SEO public",
      status: "ok",
      value: "Routes integrees",
      detail:
        "robots.txt, sitemap.xml, pages legales et JobPosting sont prepares cote application."
    },
    {
      id: "launch-supabase-auth-redirects",
      title: "Redirect URLs Supabase",
      status: "muted",
      value: "A confirmer",
      detail: `URLs attendues dans Supabase Auth : ${EXPECTED_SUPABASE_AUTH_REDIRECT_URLS.join(", ")}.`
    },
    {
      id: "launch-supabase-prod-sql",
      title: "SQL projet Supabase prod",
      status: "muted",
      value: "A confirmer",
      detail: `Verifier sur le projet production : ${LAUNCH_SQL_DOMAINS.join(", ")}.`
    }
  ];
}
