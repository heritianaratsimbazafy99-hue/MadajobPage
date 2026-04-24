import { unstable_noStore as noStore } from "next/cache";

import { appEnv, isSupabaseConfigured } from "@/lib/env";
import { getLaunchReadinessChecks } from "@/lib/launch-readiness";
import { summarizeManagedUsers } from "@/lib/managed-user-insights";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { ManagedUserSummary, TransactionalEmail } from "@/lib/types";

export type PlatformHealthStatus = "ok" | "warning" | "danger" | "muted";

export type PlatformHealthCheck = {
  id: string;
  title: string;
  status: PlatformHealthStatus;
  value: string;
  detail: string;
  href?: string;
};

export type PlatformHealthSection = {
  id: string;
  title: string;
  description: string;
  checks: PlatformHealthCheck[];
};

export type PlatformHealthSnapshot = {
  generatedAt: string;
  score: number;
  status: PlatformHealthStatus;
  summary: {
    dangerCount: number;
    warningCount: number;
    okCount: number;
    mutedCount: number;
    totalChecks: number;
  };
  sections: PlatformHealthSection[];
};

type PlatformHealthInput = {
  emails: TransactionalEmail[];
  users: ManagedUserSummary[];
};

const dayInMilliseconds = 86_400_000;

function getDaysSince(value: string | null | undefined) {
  if (!value) {
    return Number.POSITIVE_INFINITY;
  }

  const time = new Date(value).getTime();

  if (Number.isNaN(time)) {
    return Number.POSITIVE_INFINITY;
  }

  return Math.floor((Date.now() - time) / dayInMilliseconds);
}

function getPlural(count: number, singular: string, plural: string) {
  return count > 1 ? plural : singular;
}

function getStatusPriority(status: PlatformHealthStatus) {
  if (status === "danger") {
    return 3;
  }

  if (status === "warning") {
    return 2;
  }

  if (status === "muted") {
    return 1;
  }

  return 0;
}

function getWorstStatus(checks: PlatformHealthCheck[]) {
  return checks.reduce<PlatformHealthStatus>((currentStatus, check) => {
    return getStatusPriority(check.status) > getStatusPriority(currentStatus)
      ? check.status
      : currentStatus;
  }, "ok");
}

function buildEnvironmentChecks(): PlatformHealthCheck[] {
  return [
    {
      id: "supabase-url",
      title: "URL Supabase publique",
      status: appEnv.supabaseUrl ? "ok" : "danger",
      value: appEnv.supabaseUrl ? "Configuree" : "Manquante",
      detail: appEnv.supabaseUrl
        ? "NEXT_PUBLIC_SUPABASE_URL est disponible pour le client et le serveur."
        : "Ajoutez NEXT_PUBLIC_SUPABASE_URL dans les variables locales et Vercel."
    },
    {
      id: "supabase-publishable-key",
      title: "Cle publishable",
      status: appEnv.supabasePublishableKey ? "ok" : "danger",
      value: appEnv.supabasePublishableKey ? "Configuree" : "Manquante",
      detail: appEnv.supabasePublishableKey
        ? "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY est disponible."
        : "Ajoutez NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY pour activer Auth et les lectures RLS."
    },
    {
      id: "supabase-service-role",
      title: "Service role admin",
      status: appEnv.supabaseServiceRoleKey ? "ok" : "warning",
      value: appEnv.supabaseServiceRoleKey ? "Configuree" : "Manquante",
      detail: appEnv.supabaseServiceRoleKey
        ? "SUPABASE_SERVICE_ROLE_KEY permet les checks Storage et les operations admin."
        : "Les checks Storage et invitations seront incomplets sans SUPABASE_SERVICE_ROLE_KEY."
    }
  ];
}

async function checkRlsTable(
  table: string,
  title: string,
  selectColumn = "id"
): Promise<PlatformHealthCheck> {
  if (!isSupabaseConfigured) {
    return {
      id: `rls-${table}`,
      title,
      status: "muted",
      value: "Non configure",
      detail: "Supabase n'est pas configure, le check RLS ne peut pas etre execute."
    };
  }

  const supabase = await createClient();
  const { count, error } = await supabase
    .from(table)
    .select(selectColumn, { count: "exact", head: true })
    .limit(1);

  if (error) {
    return {
      id: `rls-${table}`,
      title,
      status: "danger",
      value: "Lecture bloquee",
      detail: error.message
    };
  }

  return {
    id: `rls-${table}`,
    title,
    status: "ok",
    value: `${count ?? 0} ${getPlural(count ?? 0, "ligne", "lignes")} lisible(s)`,
    detail: "Lecture admin via RLS disponible pour ce module."
  };
}

async function checkRlsFunction(
  functionName: string,
  title: string,
  expectedValue?: boolean
): Promise<PlatformHealthCheck> {
  if (!isSupabaseConfigured) {
    return {
      id: `rls-function-${functionName}`,
      title,
      status: "muted",
      value: "Non configuree",
      detail: "Supabase n'est pas configure, la fonction ne peut pas etre testee."
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc(functionName);

  if (error) {
    return {
      id: `rls-function-${functionName}`,
      title,
      status: "danger",
      value: "Erreur RPC",
      detail: error.message
    };
  }

  const status =
    typeof expectedValue === "boolean" && data !== expectedValue ? "warning" : "ok";

  return {
    id: `rls-function-${functionName}`,
    title,
    status,
    value: typeof data === "boolean" ? (data ? "true" : "false") : data ? "Retour present" : "Retour vide",
    detail:
      status === "ok"
        ? "Fonction disponible sans erreur de recursion RLS."
        : "La fonction repond, mais le resultat ne correspond pas au role attendu."
  };
}

async function buildRlsChecks() {
  const [
    profiles,
    jobs,
    applications,
    emails,
    audit,
    interviews,
    feedback,
    cvLibrary,
    isAdmin,
    isRecruiter,
    currentUserOrgId
  ] = await Promise.all([
    checkRlsTable("profiles", "Profils utilisateurs"),
    checkRlsTable("job_posts", "Offres d'emploi"),
    checkRlsTable("applications", "Candidatures"),
    checkRlsTable("transactional_emails", "Emails transactionnels"),
    checkRlsTable("audit_events", "Audit interne"),
    checkRlsTable("application_interviews", "Entretiens"),
    checkRlsTable("application_interview_feedback", "Feedbacks entretien"),
    checkRlsTable("cv_library_documents", "CVtheque independante"),
    checkRlsFunction("is_admin", "Fonction is_admin()", true),
    checkRlsFunction("is_recruiter", "Fonction is_recruiter()"),
    checkRlsFunction("current_user_org_id", "Fonction current_user_org_id()")
  ]);

  return [
    profiles,
    jobs,
    applications,
    emails,
    audit,
    interviews,
    feedback,
    cvLibrary,
    isAdmin,
    isRecruiter,
    currentUserOrgId
  ];
}

function buildEmailChecks(emails: TransactionalEmail[]): PlatformHealthCheck[] {
  const queuedEmails = emails.filter((email) => email.status === "queued");
  const processingEmails = emails.filter((email) => email.status === "processing");
  const failedEmails = emails.filter((email) => email.status === "failed");
  const sentEmails = emails.filter((email) => email.status === "sent");
  const oldQueuedEmails = queuedEmails.filter((email) => getDaysSince(email.created_at) >= 1);
  const latestFailure = failedEmails.sort(
    (left, right) => new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime()
  )[0];

  return [
    {
      id: "email-failed",
      title: "Emails en echec",
      status: failedEmails.length > 0 ? "danger" : "ok",
      value: `${failedEmails.length} echec(s)`,
      detail:
        latestFailure?.error_message ??
        "Aucun email transactionnel en echec dans les derniers elements charges.",
      href: "/app/admin/emails"
    },
    {
      id: "email-queue",
      title: "File en attente",
      status: oldQueuedEmails.length > 0 ? "warning" : queuedEmails.length > 0 ? "muted" : "ok",
      value: `${queuedEmails.length} en file`,
      detail:
        oldQueuedEmails.length > 0
          ? `${oldQueuedEmails.length} email(s) sont en file depuis plus de 24h.`
          : "La file ne presente pas de retard critique.",
      href: "/app/admin/emails"
    },
    {
      id: "email-processing",
      title: "Traitement en cours",
      status: processingEmails.length > 5 ? "warning" : "ok",
      value: `${processingEmails.length} processing`,
      detail: "Surveille les emails marques processing avant le branchement Resend/Brevo.",
      href: "/app/admin/emails"
    },
    {
      id: "email-throughput",
      title: "Historique envoye",
      status: sentEmails.length > 0 ? "ok" : emails.length > 0 ? "muted" : "warning",
      value: `${sentEmails.length} envoye(s)`,
      detail:
        emails.length > 0
          ? "La table transactionnelle est alimentee."
          : "Aucun email transactionnel n'est encore journalise.",
      href: "/app/admin/emails"
    }
  ];
}

async function buildStorageChecks(): Promise<PlatformHealthCheck[]> {
  if (!appEnv.supabaseServiceRoleKey) {
    return [
      {
        id: "storage-service-role",
        title: "Diagnostic Storage",
        status: "warning",
        value: "Service role manquant",
        detail: "Ajoutez SUPABASE_SERVICE_ROLE_KEY pour verifier les buckets et les documents."
      }
    ];
  }

  const adminClient = createAdminClient();

  if (!adminClient) {
    return [
      {
        id: "storage-admin-client",
        title: "Client Storage admin",
        status: "danger",
        value: "Indisponible",
        detail: "Le client admin Supabase n'a pas pu etre initialise."
      }
    ];
  }

  const [{ data: buckets, error: bucketError }, { data: documentRows, error: documentError }] =
    await Promise.all([
      adminClient.storage.listBuckets(),
      adminClient
        .from("candidate_documents")
        .select("id, bucket_id, storage_path, is_primary, created_at")
        .limit(1000)
    ]);

  const bucketIds = new Set((buckets ?? []).map((bucket) => bucket.id));
  const expectedBuckets = ["candidate-cv", "candidate-documents", "brand-assets", "cv-library"];
  const bucketChecks = expectedBuckets.map<PlatformHealthCheck>((bucketId) => ({
    id: `storage-bucket-${bucketId}`,
    title: `Bucket ${bucketId}`,
    status: bucketError ? "danger" : bucketIds.has(bucketId) ? "ok" : "warning",
    value: bucketError ? "Erreur" : bucketIds.has(bucketId) ? "Disponible" : "Absent",
    detail: bucketError?.message ?? "Bucket attendu par les politiques Storage v1."
  }));

  const rows = (documentRows ?? []) as Array<Record<string, unknown>>;
  const documentsWithoutPath = rows.filter((row) => !row.storage_path);
  const primaryDocuments = rows.filter((row) => row.is_primary);

  return [
    ...bucketChecks,
    {
      id: "storage-documents-table",
      title: "Documents candidats",
      status: documentError ? "danger" : "ok",
      value: documentError ? "Erreur" : `${rows.length} reference(s)`,
      detail: documentError?.message ?? "La table candidate_documents est lisible en admin."
    },
    {
      id: "storage-primary-cv",
      title: "CV principaux",
      status: primaryDocuments.length > 0 ? "ok" : rows.length > 0 ? "warning" : "muted",
      value: `${primaryDocuments.length} CV principal(aux)`,
      detail: "Controle que les candidats disposent de documents exploitables dans le pipeline."
    },
    {
      id: "storage-path-integrity",
      title: "Chemins Storage",
      status: documentsWithoutPath.length > 0 ? "danger" : "ok",
      value: `${documentsWithoutPath.length} chemin(s) vide(s)`,
      detail:
        documentsWithoutPath.length > 0
          ? "Certains documents n'ont pas de storage_path exploitable."
          : "Les references documentaires chargees disposent d'un chemin Storage."
    }
  ];
}

function buildInvitationChecks(users: ManagedUserSummary[]): PlatformHealthCheck[] {
  const summary = summarizeManagedUsers(users);
  const recentInternalInvitations = users.filter(
    (user) =>
      user.role !== "candidat" &&
      Boolean(user.invitation_sent_at) &&
      getDaysSince(user.invitation_sent_at) <= 14
  );

  return [
    {
      id: "invitation-watch",
      title: "Invitations a suivre",
      status: summary.invitationWatchCount > 0 ? "warning" : "ok",
      value: `${summary.invitationWatchCount} invitation(s)`,
      detail:
        summary.invitationWatchCount > 0
          ? "Des invitations internes recentes n'ont pas encore produit de signal operationnel."
          : "Aucune invitation interne recente ne demande de suivi urgent.",
      href: "/app/admin/utilisateurs"
    },
    {
      id: "invitation-recent",
      title: "Invitations recentes",
      status: recentInternalInvitations.length > 0 ? "muted" : "ok",
      value: `${recentInternalInvitations.length} recente(s)`,
      detail: "Fenetre de controle : 14 jours.",
      href: "/app/admin/utilisateurs"
    },
    {
      id: "access-recruiters-without-org",
      title: "Recruteurs sans organisation",
      status: summary.recruitersWithoutOrganizationCount > 0 ? "danger" : "ok",
      value: `${summary.recruitersWithoutOrganizationCount} compte(s)`,
      detail: "Un recruteur sans organisation ne peut pas exploiter correctement son cockpit.",
      href: "/app/admin/utilisateurs"
    },
    {
      id: "access-inactive-internal",
      title: "Comptes internes inactifs",
      status: summary.inactiveInternalCount > 0 ? "warning" : "ok",
      value: `${summary.inactiveInternalCount} compte(s)`,
      detail: "Controle les acces admin/recruteur desactives ou a regulariser.",
      href: "/app/admin/utilisateurs"
    }
  ];
}

function buildSnapshot(sections: PlatformHealthSection[]): PlatformHealthSnapshot {
  const checks = sections.flatMap((section) => section.checks);
  const dangerCount = checks.filter((check) => check.status === "danger").length;
  const warningCount = checks.filter((check) => check.status === "warning").length;
  const okCount = checks.filter((check) => check.status === "ok").length;
  const mutedCount = checks.filter((check) => check.status === "muted").length;
  const totalChecks = checks.length;
  const penalty = dangerCount * 18 + warningCount * 8 + mutedCount * 2;
  const score = Math.max(0, Math.min(100, 100 - penalty));

  return {
    generatedAt: new Date().toISOString(),
    score,
    status: getWorstStatus(checks),
    summary: {
      dangerCount,
      warningCount,
      okCount,
      mutedCount,
      totalChecks
    },
    sections
  };
}

export async function getPlatformHealthSnapshot({
  emails,
  users
}: PlatformHealthInput): Promise<PlatformHealthSnapshot> {
  noStore();

  const [rlsChecks, storageChecks] = await Promise.all([
    buildRlsChecks(),
    buildStorageChecks()
  ]);

  return buildSnapshot([
    {
      id: "environment",
      title: "Configuration",
      description: "Variables critiques pour Supabase, Auth et operations admin.",
      checks: buildEnvironmentChecks()
    },
    {
      id: "launch-readiness",
      title: "Pre-lancement",
      description: "Controle des prerequis production Supabase et Vercel avant ouverture.",
      checks: getLaunchReadinessChecks()
    },
    {
      id: "rls",
      title: "RLS & migrations",
      description: "Lectures admin, fonctions de securite et tables issues des migrations v1.",
      checks: rlsChecks
    },
    {
      id: "emails",
      title: "Emails transactionnels",
      description: "Etat de la file locale avant branchement final Resend/Brevo.",
      checks: buildEmailChecks(emails)
    },
    {
      id: "storage",
      title: "Storage",
      description: "Buckets attendus et coherence des documents candidats.",
      checks: storageChecks
    },
    {
      id: "invitations",
      title: "Invitations & acces",
      description: "Suivi des invitations internes, rattachements recruteurs et acces sensibles.",
      checks: buildInvitationChecks(users)
    }
  ]);
}
