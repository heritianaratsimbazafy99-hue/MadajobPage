import { CvLibraryWorkspace } from "@/components/cv-library/cv-library-workspace";
import { requireRole } from "@/lib/auth";
import { getCvLibraryDocuments } from "@/lib/cv-library";
import { getManagedJobs } from "@/lib/jobs";

export default async function RecruiterCvLibraryPage() {
  const profile = await requireRole(["recruteur"]);
  const [documents, jobs] = await Promise.all([
    getCvLibraryDocuments(profile),
    getManagedJobs(profile, { limit: 200 })
  ]);

  return (
    <CvLibraryWorkspace
      profile={profile}
      documents={documents}
      jobs={jobs}
      currentPath="/app/recruteur/cvtheque"
    />
  );
}
