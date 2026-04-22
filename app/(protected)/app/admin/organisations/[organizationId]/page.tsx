import { notFound } from "next/navigation";

import { OrganizationDetailWorkspace } from "@/components/admin/organization-detail-workspace";
import { requireRole } from "@/lib/auth";
import { getAdminOrganizationDetail } from "@/lib/jobs";

type AdminOrganizationDetailPageProps = {
  params: Promise<{
    organizationId: string;
  }>;
};

export default async function AdminOrganizationDetailPage({
  params
}: AdminOrganizationDetailPageProps) {
  const profile = await requireRole(["admin"]);
  const { organizationId } = await params;
  const organization = await getAdminOrganizationDetail(organizationId);

  if (!organization) {
    notFound();
  }

  return (
    <OrganizationDetailWorkspace
      profile={profile}
      organization={organization}
    />
  );
}
