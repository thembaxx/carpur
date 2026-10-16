import Link from "next/link";
import { CarStudio } from "@/components/CarStudio";
import type { Body } from "@/lib/car-model";

export function HomeHero({ body = "suv", color = "#b3422e", pick = true, showStudio = true }: { body?: Body; color?: string; pick?: boolean; showStudio?: boolean }) {
  return (
    <section className="hero">
      <div>
        <p className="k">South Africa · Made for your next move</p>
        <h1>Find your next car.</h1>
        <p className="mut" style={{ margin: "18px 0 26px", maxWidth: "46ch" }}>New cars and second-hand finds, with a clear view of what each one costs to own.</p>
        <Link className="btn ac" href="/marketplace" prefetch={false}>Shop new cars</Link>{" "}
        <Link className="btn o" href="/marketplace?inventory=sellers&condition=USED" prefetch={false}>Shop second hand</Link>
      </div>
      {showStudio ? <CarStudio body={body} color={color} pick={pick} /> : null}
    </section>
  );
}
