import type { Metadata } from "next";
import { CompareTool } from "@/components/CompareTool";
import { catalogue } from "@/lib/catalogue";
import type { SearchParams } from "@/lib/marketplace";

export const metadata: Metadata = { title: "Compare two cars — Carpur" };

export default async function Compare({ searchParams }: { searchParams: Promise<SearchParams> }) {
  // Bind to the request so the query-driven client view is rendered on the server too.
  await searchParams;
  const cars = catalogue.map(({ id, siteId, n, p, t, f, b, reference }) => ({ id, siteId, n, p, t, f, b, bodyStyle: reference.bodyStyle }));
  return (
    <section className="sec">
      <p className="k">Compare</p>
      <h2>Compare two cars.</h2>
      <CompareTool cars={cars} />
    </section>
  );
}
