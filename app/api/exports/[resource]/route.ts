import { NextResponse } from "next/server";

import { getCurrentProfile } from "@/lib/auth";
import { isFinalApplicationStatus } from "@/lib/application-status";
import {
  getAdminApplications,
  getManagedCandidates,
  getManagedJobs,
  getRecruiterApplications
} from "@/lib/jobs";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    resource: string;
  }>;
};

function escapeCsvValue(value: unknown) {
  const stringValue = value === null || value === undefined ? "" : String(value);

  if (/[",\n;]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

function buildCsv(rows: unknown[][]) {
  return rows.map((row) => row.map(escapeCsvValue).join(";")).join("\n");
}

function getBooleanFilter(value: string | null) {
  if (value === null) {
    return null;
  }

  if (value === "1" || value === "true" || value === "oui") {
    return true;
  }

  if (value === "0" || value === "false" || value === "non") {
    return false;
  }

  return null;
}

function isWithinRecentDays(dateValue: string | null | undefined, recentDays: number | null) {
  if (recentDays === null) {
    return true;
  }

  if (!dateValue) {
    return false;
  }

  return Date.now() - new Date(dateValue).getTime() <= recentDays * 86_400_000;
}

function buildFileNameSuffix(searchParams: URLSearchParams) {
  const parts: string[] = [];

  const status = searchParams.get("status");
  const recentDays = searchParams.get("recentDays");

  if (status) {
    parts.push(status);
  }

  if (searchParams.get("advanced") === "1") {
    parts.push("avance");
  }

  if (searchParams.get("pendingFeedback") === "1") {
    parts.push("feedback-attente");
  }

  if (searchParams.get("ready") === "1") {
    parts.push("prets");
  }

  if (recentDays) {
    parts.push(`${recentDays}j`);
  }

  return parts.length > 0 ? `-${parts.join("-")}` : "";
}

export async function GET(request: Request, context: RouteContext) {
  const profile = await getCurrentProfile();

  if (!profile) {
    return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  }

  if (profile.role !== "admin" && profile.role !== "recruteur") {
    return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
  }

  const { resource } = await context.params;
  const now = new Date().toISOString().slice(0, 10);
  const searchParams = new URL(request.url).searchParams;
  const recentDays = Number.parseInt(searchParams.get("recentDays") ?? "", 10);
  const safeRecentDays = Number.isFinite(recentDays) && recentDays > 0 ? recentDays : null;
  const fileNameSuffix = buildFileNameSuffix(searchParams);

  if (resource === "jobs") {
    const statusFilter = searchParams.get("status");
    const featuredFilter = getBooleanFilter(searchParams.get("featured"));
    const minApplications = Number.parseInt(searchParams.get("minApplications") ?? "", 10);

    const jobs = (await getManagedJobs(profile, { limit: 1000 })).filter((job) => {
      if (statusFilter && job.status !== statusFilter) {
        return false;
      }

      if (featuredFilter !== null && job.is_featured !== featuredFilter) {
        return false;
      }

      if (
        Number.isFinite(minApplications) &&
        minApplications > 0 &&
        job.applications_count < minApplications
      ) {
        return false;
      }

      return isWithinRecentDays(job.published_at ?? job.created_at, safeRecentDays);
    });

    const csv = buildCsv([
      [
        "id",
        "titre",
        "organisation",
        "statut",
        "departement",
        "lieu",
        "contrat",
        "mode_travail",
        "secteur",
        "mise_en_avant",
        "date_publication",
        "date_creation",
        "date_mise_a_jour",
        "date_cloture",
        "candidatures"
      ],
      ...jobs.map((job) => [
        job.id,
        job.title,
        job.organization_name ?? "",
        job.status,
        job.department ?? "",
        job.location,
        job.contract_type,
        job.work_mode,
        job.sector,
        job.is_featured ? "oui" : "non",
        job.published_at ?? "",
        job.created_at,
        job.updated_at,
        job.closing_at ?? "",
        job.applications_count
      ])
    ]);

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="madajob-offres-${profile.role}${fileNameSuffix}-${now}.csv"`
      }
    });
  }

  if (resource === "applications") {
    const statusFilter = searchParams.get("status");
    const withCvFilter = getBooleanFilter(searchParams.get("withCv"));
    const advancedOnly = searchParams.get("advanced") === "1";
    const pendingFeedbackOnly = searchParams.get("pendingFeedback") === "1";
    const nextInterviewOnly = searchParams.get("nextInterview") === "1";
    const staleDays = Number.parseInt(searchParams.get("staleDays") ?? "", 10);

    const applications =
      profile.role === "admin"
        ? await getAdminApplications({ limit: 1000 })
        : await getRecruiterApplications(profile, { limit: 1000 });
    const filteredApplications = applications.filter((application) => {
      if (statusFilter && application.status !== statusFilter) {
        return false;
      }

      if (withCvFilter !== null && application.has_cv !== withCvFilter) {
        return false;
      }

      if (
        advancedOnly &&
        !["shortlist", "interview", "hired"].includes(application.status)
      ) {
        return false;
      }

      if (pendingFeedbackOnly && !application.interview_signal.pending_feedback) {
        return false;
      }

      if (nextInterviewOnly && !application.interview_signal.next_interview_at) {
        return false;
      }

      if (
        Number.isFinite(staleDays) &&
        staleDays > 0 &&
        Date.now() -
          new Date(application.updated_at ?? application.created_at).getTime() <=
          staleDays * 86_400_000
      ) {
        return false;
      }

      return isWithinRecentDays(application.created_at, safeRecentDays);
    });

    const csv = buildCsv([
      [
        "id",
        "statut",
        "date_creation",
        "date_mise_a_jour",
        "candidat",
        "email_candidat",
        "poste",
        "lieu_poste",
        "cv_joint",
        "message_candidature",
        "entretiens",
        "prochain_entretien",
        "feedback_entretien_attendu"
      ],
      ...filteredApplications.map((application) => [
        application.id,
        application.status,
        application.created_at,
        application.updated_at ?? "",
        application.candidate_name,
        application.candidate_email,
        application.job_title,
        application.job_location,
        application.has_cv ? "oui" : "non",
        application.cover_letter ?? "",
        application.interview_signal.interviews_count,
        application.interview_signal.next_interview_at ?? "",
        application.interview_signal.pending_feedback ? "oui" : "non"
      ])
    ]);

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="madajob-candidatures-${profile.role}${fileNameSuffix}-${now}.csv"`
      }
    });
  }

  if (resource === "candidates") {
    const withCvFilter = getBooleanFilter(searchParams.get("withCv"));
    const readyOnly = searchParams.get("ready") === "1";
    const lowCompletionOnly = searchParams.get("lowCompletion") === "1";
    const activePipelineOnly = searchParams.get("activePipeline") === "1";

    const candidates = await getManagedCandidates(profile, {
      limit: profile.role === "admin" ? 1000 : 500
    });
    const filteredCandidates = candidates.filter((candidate) => {
      if (withCvFilter !== null && candidate.has_primary_cv !== withCvFilter) {
        return false;
      }

      if (readyOnly && !(candidate.has_primary_cv && candidate.profile_completion >= 80)) {
        return false;
      }

      if (lowCompletionOnly && candidate.profile_completion >= 50) {
        return false;
      }

      if (
        activePipelineOnly &&
        !(candidate.applications_count > 0 &&
          (!candidate.latest_status || !isFinalApplicationStatus(candidate.latest_status)))
      ) {
        return false;
      }

      return isWithinRecentDays(candidate.latest_application_at, safeRecentDays);
    });

    const csv = buildCsv([
      [
        "id",
        "nom",
        "email",
        "telephone",
        "ville",
        "poste_actuel",
        "poste_cible",
        "completion_profil",
        "cv_principal",
        "candidatures",
        "derniere_activite",
        "dernier_statut",
        "dernier_poste"
      ],
      ...filteredCandidates.map((candidate) => [
        candidate.id,
        candidate.full_name,
        candidate.email ?? "",
        candidate.phone ?? "",
        candidate.city,
        candidate.current_position,
        candidate.desired_position,
        candidate.profile_completion,
        candidate.has_primary_cv ? "oui" : "non",
        candidate.applications_count,
        candidate.latest_application_at ?? "",
        candidate.latest_status ?? "",
        candidate.latest_job_title ?? ""
      ])
    ]);

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="madajob-candidats-${profile.role}${fileNameSuffix}-${now}.csv"`
      }
    });
  }

  return NextResponse.json({ error: "Export introuvable" }, { status: 404 });
}
