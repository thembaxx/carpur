import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Carpur — Find your next car",
    short_name: "Carpur",
    description: "Compare South African cars and understand the true cost of ownership.",
    lang: "en-ZA",
    start_url: "/",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    background_color: "#090b0e",
    theme_color: "#090b0e",
    categories: ["shopping", "automotive", "finance"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      { name: "Compare cars", short_name: "Compare", url: "/compare" },
      { name: "Affordability", short_name: "Budget", url: "/affordability" },
      { name: "Browse cars", short_name: "Cars", url: "/marketplace" },
    ],
  };
}
