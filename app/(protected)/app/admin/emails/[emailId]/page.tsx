import { notFound } from "next/navigation";

import { TransactionalEmailDetailWorkspace } from "@/components/emails/transactional-email-detail-workspace";
import { requireRole } from "@/lib/auth";
import { getTransactionalEmailById } from "@/lib/transactional-emails";

type AdminTransactionalEmailDetailPageProps = {
  params: Promise<{
    emailId: string;
  }>;
};

export default async function AdminTransactionalEmailDetailPage({
  params
}: AdminTransactionalEmailDetailPageProps) {
  const profile = await requireRole(["admin"]);
  const { emailId } = await params;
  const email = await getTransactionalEmailById(emailId);

  if (!email) {
    notFound();
  }

  return <TransactionalEmailDetailWorkspace profile={profile} email={email} />;
}
