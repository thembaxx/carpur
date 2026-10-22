import type { Metadata } from "next";
import { Suspense } from "react";
import { StudioPreview } from "@/components/StudioPreview";

export const metadata: Metadata = {
  title: "Carpur — Studio preview",
  robots: { index: false, follow: false },
};

export default function StudioPage() {
  return (
    <Suspense fallback={null}>
      <StudioPreview />
    </Suspense>
  );
}
