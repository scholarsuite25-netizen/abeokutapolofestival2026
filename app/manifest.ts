import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "The Blueprint — 2026 Abeokuta Polo Festival",
    short_name: "Abeokuta Polo",
    description: "Official platform for the 2026 Abeokuta Polo Festival: passes, schedules, hospitality and gate ingress.",
    start_url: "/",
    display: "standalone",
    background_color: "#0C241E",
    theme_color: "#123D32",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
