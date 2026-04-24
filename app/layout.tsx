import type { Metadata } from "next";
import type { ReactNode } from "react";

import { LegacyUiEffects } from "@/components/site/legacy-ui-effects";
import { SiteFooter } from "@/components/site/footer";
import { SiteHeader } from "@/components/site/header";

import "./globals.css";
import "./legacy.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://madajob-page.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Madajob | Plateforme RH et site carriere natif",
  description:
    "Madajob connecte les candidats, les recruteurs et les equipes RH dans une experience native, rapide et orientee conversion.",
  alternates: {
    canonical: "/"
  },
  openGraph: {
    title: "Madajob | Plateforme RH et site carriere natif",
    description:
      "Cabinet RH, site carriere public et plateforme native pour candidats, recruteurs et administrateurs.",
    url: siteUrl,
    siteName: "Madajob",
    locale: "fr_FR",
    type: "website"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>
        <LegacyUiEffects />
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
