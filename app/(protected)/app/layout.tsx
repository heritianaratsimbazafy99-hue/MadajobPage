import type { ReactNode } from "react";

import { requireAuthenticatedProfile } from "@/lib/auth";

export default async function ProtectedAppLayout({
  children
}: {
  children: ReactNode;
}) {
  await requireAuthenticatedProfile();
  return children;
}
