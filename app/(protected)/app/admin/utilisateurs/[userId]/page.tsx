import { notFound } from "next/navigation";

import { UserDetailWorkspace } from "@/components/admin/user-detail-workspace";
import { requireRole } from "@/lib/auth";
import { getAdminOrganizations, getAdminUserDetail } from "@/lib/jobs";

type AdminUserDetailPageProps = {
  params: Promise<{
    userId: string;
  }>;
};

export default async function AdminUserDetailPage({
  params
}: AdminUserDetailPageProps) {
  const profile = await requireRole(["admin"]);
  const { userId } = await params;
  const [user, organizations] = await Promise.all([
    getAdminUserDetail(userId),
    getAdminOrganizations()
  ]);

  if (!user) {
    notFound();
  }

  return (
    <UserDetailWorkspace
      profile={profile}
      user={user}
      organizations={organizations}
    />
  );
}
