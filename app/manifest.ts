import type { MetadataRoute } from "next";
import { SITE } from "@/lib/config";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE.fullName,
    short_name: SITE.name,
    description: SITE.description,
    start_url: "/",
    id: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#F7F1E7",
    theme_color: "#173F35",
    categories: ["lifestyle", "social", "education"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      {
        name: "Report an animal",
        short_name: "Report",
        description: "Report an animal who needs help",
        url: "/report",
      },
      { name: "Meet the paws", short_name: "Adopt", url: "/adopt" },
    ],
  };
}
