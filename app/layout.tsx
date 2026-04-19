import type { Metadata } from "next";
import type { ReactNode } from "react";

import { SiteFooter } from "@/components/site/footer";
import { SiteHeader } from "@/components/site/header";

import "./globals.css";

export const metadata: Metadata = {
  title: "Madajob | Plateforme RH et site carriere natif",
  description:
    "Madajob connecte les candidats, les recruteurs et les equipes RH dans une experience native, rapide et orientee conversion."
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
