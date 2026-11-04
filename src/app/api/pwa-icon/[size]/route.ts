import { ImageResponse } from "next/og";
import { createElement } from "react";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return [{ size: "192" }, { size: "512" }];
}

// Matches public/favicon.svg, preserving the existing Carpur mark.
const carpurSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <defs>
    <linearGradient id="orange" x1="8" y1="48" x2="54" y2="9" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#FF9A63"/>
      <stop offset="1" stop-color="#FF5D36"/>
    </linearGradient>
  </defs>
  <rect width="64" height="64" rx="16" fill="#11161B"/>
  <path d="M45.4 17.2A21 21 0 1 0 45.4 46.8" fill="none" stroke="url(#orange)" stroke-width="11" stroke-linecap="round"/>
  <path d="M45.4 17.2A21 21 0 1 0 45.4 46.8" fill="none" stroke="#FFECE0" stroke-width="1.65" stroke-linecap="round" stroke-dasharray="1.8 7.4" opacity=".88"/>
  <circle cx="45.4" cy="46.8" r="3.8" fill="#FFECE0"/>
</svg>`;

export async function GET(_request: Request, context: { params: Promise<{ size: string }> }) {
  const { size } = await context.params;
  if (size !== "192" && size !== "512") return new Response("Not found", { status: 404 });
  const px = Number(size);
  const src = `data:image/svg+xml;base64,${Buffer.from(carpurSvg).toString("base64")}`;
  return new ImageResponse(createElement("img", { src, width: px, height: px }), {
    width: px,
    height: px,
  });
}
