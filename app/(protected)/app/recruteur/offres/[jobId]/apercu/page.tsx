import { notFound } from "next/navigation";

import { DashboardShell } from "@/components/dashboard/shell";
import { JobPublicDetailPreview } from "@/components/jobs/job-public-detail-preview";
import { requireRole } from "@/lib/auth";
import { getManagedJobById } from "@/lib/jobs";

type RecruiterJobPreviewPageProps = {
  params: Promise<{
    jobId: string;
  }>;
};

export default async function RecruiterJobPreviewPage({
  params
}: RecruiterJobPreviewPageProps) {
  const profile = await requireRole(["recruteur"]);
  const { jobId } = await params;
  const job = await getManagedJobById(profile, jobId);

  if (!job) {
    notFound();
  }

  return (
    <DashboardShell
      title={`Apercu public - ${job.title}`}
      description="Relisez l'offre avec un rendu proche de la page carriere avant de la publier ou de la mettre en avant."
      profile={profile}
      currentPath="/app/recruteur/offres"
    >
      <JobPublicDetailPreview
        job={job}
        backHref={`/app/recruteur/offres/${job.id}`}
        publicHref={job.status === "published" ? `/carrieres/${job.slug}` : null}
      />
    </DashboardShell>
  );
}
