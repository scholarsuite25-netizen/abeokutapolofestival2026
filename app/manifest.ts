import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Abeokuta Polo Festival 2026",
    short_name: "Abeokuta Polo",
    description:
      "Official platform, tournament schedule, and gate access pass wallet for Abeokuta Polo Festival 2026 — The Blueprint.",
    start_url: "/",
    display: "standalone",
    background_color: "#062D1D",
    theme_color: "#062D1D",
    icons: [
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
    categories: ["sports", "events", "lifestyle"],
  };
}
