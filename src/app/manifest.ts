import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Carpur — Find your next car",
    short_name: "Carpur",
    description: "Find, compare and understand the real cost of owning a car in South Africa.",
    lang: "en-ZA",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#090b0e",
    theme_color: "#090b0e",
    categories: ["automotive", "shopping", "utilities"],
    icons: [
      { src: "/api/pwa-icon/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/api/pwa-icon/512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/api/pwa-icon/512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Compare cars", short_name: "Compare", url: "/compare" },
      { name: "Check affordability", short_name: "Affordability", url: "/affordability" },
      { name: "Explore the studio", short_name: "Studio", url: "/studio" },
    ],
  };
}
