import type { MetadataRoute } from "next";

/**
 * Web app manifest — makes Duevy installable as a standalone app. Next serves
 * this at /manifest.webmanifest and links it into every page automatically.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Duevy — Campus dues, made simple",
    short_name: "Duevy",
    description:
      "Pay your campus dues by card or bank transfer and keep every receipt — in one app.",
    id: "/",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fbfaf7",
    theme_color: "#0b6e4f",
    categories: ["finance", "education", "productivity"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
