import { redirect } from "next/navigation";

import { getDashboardPath, requireAuthenticatedProfile } from "@/lib/auth";

export default async function DashboardIndexPage() {
  const profile = await requireAuthenticatedProfile();

  redirect(getDashboardPath(profile.role));
}
