import { TransactionalEmailsWorkspace } from "@/components/emails/transactional-emails-workspace";
import { requireRole } from "@/lib/auth";
import { getTransactionalEmails } from "@/lib/transactional-emails";

export default async function AdminTransactionalEmailsPage() {
  const profile = await requireRole(["admin"]);
  const emails = await getTransactionalEmails();

  return <TransactionalEmailsWorkspace profile={profile} emails={emails} />;
}
