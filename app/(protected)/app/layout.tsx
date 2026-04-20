import type { ReactNode } from "react";

import { requireAuthenticatedProfile } from "@/lib/auth";

export default async function ProtectedAppLayout({
  children
}: {
  children: ReactNode;
}) {
  await requireAuthenticatedProfile();
  return (
    <>
      <style>{`
        .topbar,
        .site-header,
        .footer {
          display: none !important;
        }

        body {
          background:
            radial-gradient(circle at top left, rgba(77, 142, 197, 0.12), transparent 26%),
            radial-gradient(circle at right center, rgba(178, 210, 33, 0.1), transparent 24%),
            linear-gradient(180deg, #fbfdff 0%, #f2f7fb 100%);
        }

        body::before,
        body::after {
          display: none !important;
        }
      `}</style>
      <div className="platform-route">{children}</div>
    </>
  );
}
