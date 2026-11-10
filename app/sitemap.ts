import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL && !process.env.NEXT_PUBLIC_SITE_URL.includes("localhost")
      ? process.env.NEXT_PUBLIC_SITE_URL
      : "https://www.abeokutapolofestival2026.org.ng";
  const now = new Date();

  const publicRoutes = [
    { path: "", priority: 1.0, changeFrequency: "daily" as const },
    { path: "/register", priority: 0.95, changeFrequency: "daily" as const },
    { path: "/royal-cup", priority: 0.9, changeFrequency: "weekly" as const },
    { path: "/programme", priority: 0.9, changeFrequency: "weekly" as const },
    { path: "/tables", priority: 0.85, changeFrequency: "weekly" as const },
    { path: "/hospitality", priority: 0.85, changeFrequency: "weekly" as const },
    { path: "/sponsorship", priority: 0.85, changeFrequency: "weekly" as const },
    { path: "/affiliates", priority: 0.8, changeFrequency: "weekly" as const },
    { path: "/news", priority: 0.75, changeFrequency: "daily" as const },
    { path: "/experiences", priority: 0.7, changeFrequency: "weekly" as const },
    { path: "/gallery", priority: 0.65, changeFrequency: "weekly" as const },
    { path: "/publications", priority: 0.65, changeFrequency: "weekly" as const },
    { path: "/press", priority: 0.6, changeFrequency: "weekly" as const },
    { path: "/pass/lookup", priority: 0.6, changeFrequency: "weekly" as const },
    { path: "/register/poster", priority: 0.55, changeFrequency: "monthly" as const },
    { path: "/faq", priority: 0.5, changeFrequency: "weekly" as const },
    { path: "/visit", priority: 0.5, changeFrequency: "monthly" as const },
    { path: "/terms", priority: 0.3, changeFrequency: "yearly" as const },
    { path: "/privacy", priority: 0.3, changeFrequency: "yearly" as const },
    { path: "/accessibility", priority: 0.3, changeFrequency: "yearly" as const },
  ];

  return publicRoutes.map((route) => ({
    url: `${siteUrl}${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
