import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL && !process.env.NEXT_PUBLIC_SITE_URL.includes("localhost")
      ? process.env.NEXT_PUBLIC_SITE_URL
      : "https://www.abeokutapolofestival2026.org.ng";

  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/about",
          "/programme",
          "/programme/*",
          "/royal-cup",
          "/hospitality",
          "/tables",
          "/sponsorship",
          "/affiliates",
          "/experiences",
          "/gallery",
          "/news",
          "/publications",
          "/press",
          "/faq",
          "/visit",
          "/register",
          "/register/*",
          "/pass/lookup",
        ],
        disallow: [
          "/abawole",
          "/abawole/*",
          "/admin",
          "/admin/*",
          "/scan",
          "/scan/*",
          "/dashboard",
          "/dashboard/*",
          "/api/*",
          "/auth/*",
        ],
      },
      {
        userAgent: ["Googlebot", "Bingbot", "Applebot", "YandexBot", "Baiduspider"],
        allow: "/",
        disallow: [
          "/abawole/*",
          "/admin/*",
          "/scan/*",
          "/dashboard/*",
          "/api/*",
          "/auth/*",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
