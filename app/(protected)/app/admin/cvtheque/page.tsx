import { CvLibraryWorkspace } from "@/components/cv-library/cv-library-workspace";
import { requireRole } from "@/lib/auth";
import { getCvLibraryDocuments } from "@/lib/cv-library";
import { getManagedJobs } from "@/lib/jobs";

export default async function AdminCvLibraryPage() {
  const profile = await requireRole(["admin"]);
  const [documents, jobs] = await Promise.all([
    getCvLibraryDocuments(profile),
    getManagedJobs(profile, { limit: 300 })
  ]);

  return (
    <CvLibraryWorkspace
      profile={profile}
      documents={documents}
      jobs={jobs}
      currentPath="/app/admin/cvtheque"
    />
  );
}
