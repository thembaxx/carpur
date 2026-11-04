import { ImageResponse } from "next/og";
import { createElement } from "react";

export const dynamic = "force-static";
export function generateStaticParams() {
  return [{ size: "192" }, { size: "512" }];
}

export async function GET(_request: Request, context: { params: Promise<{ size: string }> }) {
  const { size } = await context.params;
  if (size !== "192" && size !== "512") return new Response("Not found", { status: 404 });
  const px = Number(size);
  const pad = Math.round(px * 0.17);
  const diameter = px - pad * 2;
  return new ImageResponse(
    createElement(
      "div",
      {
        style: {
          width: "100%", height: "100%", display: "flex", alignItems: "center",
          justifyContent: "center", background: "#11161b", borderRadius: Math.round(px * 0.22),
        },
      },
      createElement(
        "div",
        {
          style: {
            display: "flex", alignItems: "center", justifyContent: "center",
            width: diameter, height: diameter, borderRadius: "50%",
            border: `${Math.round(px * 0.085)}px solid #ff7948`,
            color: "#ffece0", fontFamily: "Arial, sans-serif", fontSize: Math.round(px * 0.42),
            fontWeight: 800, letterSpacing: "-0.09em",
          },
        },
        "C",
      ),
    ),
    { width: px, height: px },
  );
}
