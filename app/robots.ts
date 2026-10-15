import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://2026abeokutapolofestival.com";

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
          "/sponsorship",
          "/experiences",
          "/gallery",
          "/news",
          "/publications",
          "/press",
          "/faq",
          "/visit",
          "/register",
        ],
        disallow: [
          "/admin",
          "/admin/*",
          "/committee",
          "/committee/*",
          "/scan",
          "/scan/*",
          "/dashboard",
          "/dashboard/*",
          "/api/*",
          "/auth/*",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
