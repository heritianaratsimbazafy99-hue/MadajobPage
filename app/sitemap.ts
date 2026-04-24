import type { MetadataRoute } from "next";

import { getPublicJobs } from "@/lib/jobs";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://madajob-page.vercel.app";

const staticRoutes: Array<{
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}> = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/carrieres", changeFrequency: "daily", priority: 0.9 },
  { path: "/candidats", changeFrequency: "monthly", priority: 0.8 },
  { path: "/recruteurs", changeFrequency: "monthly", priority: 0.8 },
  { path: "/entreprise", changeFrequency: "monthly", priority: 0.8 },
  { path: "/formation", changeFrequency: "monthly", priority: 0.7 },
  { path: "/externalisation", changeFrequency: "monthly", priority: 0.7 },
  { path: "/espace", changeFrequency: "monthly", priority: 0.6 },
  { path: "/espace/candidat", changeFrequency: "monthly", priority: 0.6 },
  { path: "/espace/recruteur", changeFrequency: "monthly", priority: 0.6 },
  { path: "/mentions-legales", changeFrequency: "yearly", priority: 0.3 },
  { path: "/politique-confidentialite", changeFrequency: "yearly", priority: 0.3 },
  { path: "/conditions-utilisation", changeFrequency: "yearly", priority: 0.3 }
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const jobs = await getPublicJobs({ sort: "recent" });

  return [
    ...staticRoutes.map((route) => ({
      url: `${siteUrl}${route.path}`,
      lastModified: now,
      changeFrequency: route.changeFrequency,
      priority: route.priority
    })),
    ...jobs.map((job) => ({
      url: `${siteUrl}/carrieres/${job.slug}`,
      lastModified: job.published_at || job.created_at || now,
      changeFrequency: "weekly" as const,
      priority: job.is_featured ? 0.85 : 0.75
    }))
  ];
}
