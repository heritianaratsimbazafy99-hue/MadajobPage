import { NextResponse } from "next/server";

import { getCurrentProfile } from "@/lib/auth";
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

export async function GET(_request: Request, context: RouteContext) {
  const profile = await getCurrentProfile();

  if (!profile) {
    return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  }

  if (profile.role !== "admin" && profile.role !== "recruteur") {
    return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
  }

  const { resource } = await context.params;
  const now = new Date().toISOString().slice(0, 10);

  if (resource === "jobs") {
    const jobs = await getManagedJobs(profile, { limit: 1000 });
    const csv = buildCsv([
      [
        "id",
        "titre",
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
        "candidatures"
      ],
      ...jobs.map((job) => [
        job.id,
        job.title,
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
        job.applications_count
      ])
    ]);

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="madajob-offres-${profile.role}-${now}.csv"`
      }
    });
  }

  if (resource === "applications") {
    const applications =
      profile.role === "admin"
        ? await getAdminApplications({ limit: 1000 })
        : await getRecruiterApplications(profile, { limit: 1000 });

    const csv = buildCsv([
      [
        "id",
        "statut",
        "date_creation",
        "candidat",
        "email_candidat",
        "poste",
        "lieu_poste",
        "cv_joint",
        "message_candidature"
      ],
      ...applications.map((application) => [
        application.id,
        application.status,
        application.created_at,
        application.candidate_name,
        application.candidate_email,
        application.job_title,
        application.job_location,
        application.has_cv ? "oui" : "non",
        application.cover_letter ?? ""
      ])
    ]);

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="madajob-candidatures-${profile.role}-${now}.csv"`
      }
    });
  }

  if (resource === "candidates") {
    const candidates = await getManagedCandidates(profile, {
      limit: profile.role === "admin" ? 1000 : 500
    });

    const csv = buildCsv([
      [
        "id",
        "nom",
        "email",
        "telephone",
        "ville",
        "poste_actuel",
        "completion_profil",
        "cv_principal",
        "candidatures",
        "dernier_statut",
        "dernier_poste"
      ],
      ...candidates.map((candidate) => [
        candidate.id,
        candidate.full_name,
        candidate.email ?? "",
        candidate.phone ?? "",
        candidate.city,
        candidate.current_position,
        candidate.profile_completion,
        candidate.has_primary_cv ? "oui" : "non",
        candidate.applications_count,
        candidate.latest_status ?? "",
        candidate.latest_job_title ?? ""
      ])
    ]);

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="madajob-candidats-${profile.role}-${now}.csv"`
      }
    });
  }

  return NextResponse.json({ error: "Export introuvable" }, { status: 404 });
}
