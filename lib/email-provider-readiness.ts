import type { TransactionalEmail } from "@/lib/types";

export type EmailProviderKey = "resend" | "brevo";
export type EmailProviderReadinessStatus = "ok" | "warning" | "danger" | "muted";

export type EmailProviderReadinessCheck = {
  id: string;
  title: string;
  status: EmailProviderReadinessStatus;
  value: string;
  detail: string;
};

type EmailProviderEnvironment = Record<string, string | undefined>;

export const SUPPORTED_EMAIL_PROVIDERS = ["resend", "brevo"] as const;
export const DEFAULT_EMAIL_PROVIDER_ENV_KEY = "TRANSACTIONAL_EMAIL_PROVIDER";
export const TRANSACTIONAL_EMAIL_FROM_ENV_KEY = "TRANSACTIONAL_EMAIL_FROM";
export const TRANSACTIONAL_EMAILS_ENABLED_ENV_KEY = "TRANSACTIONAL_EMAILS_ENABLED";

const providerApiKeyEnv: Record<EmailProviderKey, string> = {
  resend: "RESEND_API_KEY",
  brevo: "BREVO_API_KEY"
};

function readEnvValue(env: EmailProviderEnvironment, key: string) {
  return env[key]?.trim() ?? "";
}

function getProviderFromEnv(env: EmailProviderEnvironment): EmailProviderKey | null {
  const rawProvider = readEnvValue(env, DEFAULT_EMAIL_PROVIDER_ENV_KEY).toLowerCase();

  if (SUPPORTED_EMAIL_PROVIDERS.includes(rawProvider as EmailProviderKey)) {
    return rawProvider as EmailProviderKey;
  }

  return null;
}

function getRawProviderLabel(env: EmailProviderEnvironment) {
  return readEnvValue(env, DEFAULT_EMAIL_PROVIDER_ENV_KEY);
}

function isEmailSendFlagEnabled(env: EmailProviderEnvironment) {
  return readEnvValue(env, TRANSACTIONAL_EMAILS_ENABLED_ENV_KEY).toLowerCase() === "true";
}

export function getEmailProviderReadinessChecks(
  emails: TransactionalEmail[],
  env: EmailProviderEnvironment = process.env
): EmailProviderReadinessCheck[] {
  const provider = getProviderFromEnv(env);
  const rawProvider = getRawProviderLabel(env);
  const fromAddress = readEnvValue(env, TRANSACTIONAL_EMAIL_FROM_ENV_KEY);
  const failedEmails = emails.filter((email) => email.status === "failed");
  const queuedEmails = emails.filter((email) => email.status === "queued");
  const emailsEnabled = isEmailSendFlagEnabled(env);

  const providerStatus = provider ? "ok" : rawProvider ? "warning" : "muted";
  const providerValue =
    provider ?? (rawProvider || "Non selectionne");
  const apiKeyEnv = provider ? providerApiKeyEnv[provider] : null;
  const apiKeyPresent = apiKeyEnv ? Boolean(readEnvValue(env, apiKeyEnv)) : false;

  return [
    {
      id: "email-provider-choice",
      title: "Provider cible",
      status: providerStatus,
      value: providerValue,
      detail: provider
        ? `Provider reconnu via ${DEFAULT_EMAIL_PROVIDER_ENV_KEY}.`
        : rawProvider
          ? `Provider non reconnu. Valeurs attendues : ${SUPPORTED_EMAIL_PROVIDERS.join(", ")}.`
          : "Aucun provider selectionne pour le moment, la file reste seulement journalisee."
    },
    {
      id: "email-provider-api-key",
      title: "Cle API provider",
      status: provider ? (apiKeyPresent ? "ok" : "warning") : "muted",
      value: apiKeyEnv ?? "A definir",
      detail: provider
        ? apiKeyPresent
          ? `${apiKeyEnv} est disponible pour le futur branchement.`
          : `Ajoutez ${apiKeyEnv} dans Vercel avant d'activer les envois.`
        : "La cle API dependra du provider choisi en fin de lancement."
    },
    {
      id: "email-provider-from",
      title: "Expediteur transactionnel",
      status: fromAddress ? "ok" : "warning",
      value: fromAddress || "Manquant",
      detail: fromAddress
        ? `${TRANSACTIONAL_EMAIL_FROM_ENV_KEY} est renseigne.`
        : `Ajoutez ${TRANSACTIONAL_EMAIL_FROM_ENV_KEY} avec une adresse expediteur valide.`
    },
    {
      id: "email-provider-send-lock",
      title: "Verrou d'envoi",
      status: emailsEnabled ? "warning" : "ok",
      value: emailsEnabled ? "Activation demandee" : "Journalisation seule",
      detail: emailsEnabled
        ? "TRANSACTIONAL_EMAILS_ENABLED=true est detecte. A utiliser seulement au moment du branchement final."
        : "Aucun envoi externe n'est active : les emails restent en attente dans le journal."
    },
    {
      id: "email-provider-queue-health",
      title: "File avant branchement",
      status: failedEmails.length > 0 ? "danger" : queuedEmails.length > 0 ? "muted" : "ok",
      value: `${queuedEmails.length} en file`,
      detail:
        failedEmails.length > 0
          ? `${failedEmails.length} email(s) en echec doivent etre analyses avant activation provider.`
          : "La file peut etre revue depuis l'administration avant le branchement."
    }
  ];
}
