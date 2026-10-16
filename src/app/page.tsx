import { HomeHero } from "@/components/HomeHero";
import Link from "next/link";
import { CarCard } from "@/components/CarCard";
import { EmptyState } from "@/components/EmptyState";
import { Reveal } from "@/components/Reveal";
import { catalogue, featuredCars } from "@/lib/catalogue";

const TECHNOLOGIES = [
  ["Petrol & Diesel", "Familiar refuelling. Include servicing and fuel-price changes.", "Petrol"],
  ["Hybrid", "Engine and motor together. Economy depends on your route.", "Hybrid"],
  ["Electric", "Plan charging, range and battery cover with the price.", "Electric"],
  ["Plug-in Hybrid", "Budget for petrol and charging.", "Plug-in Hybrid"],
] as const;
const CHECKLIST = [
  "Get a written price including on-road fees.",
  "Confirm stock, delivery date, warranty and service plan.",
  "Compare lender terms, fees and balloon settlement.",
  "Request an insurance quote; keep a repair reserve.",
  "For used cars, check ownership and service history.",
];

export default function Home() {
  return (
    <>
      <HomeHero />
      <section className="sec">
        <Reveal as="p" className="k">01 · A fresh start</Reveal>
        <Reveal as="h2">Discover new cars.</Reveal>
        <Reveal as="p" className="mut">{`Featured from ${catalogue.length} manufacturer-published Toyota variants. Prices observed 13 October 2026.`}</Reveal>
        <div className="grid">{featuredCars.map((car) => <CarCard key={car.siteId} car={car} reveal />)}</div>
      </section>
      <section className="sec">
        <Reveal as="p" className="k">02 · A new chapter</Reveal>
        <Reveal as="h2">Second hand. First choice.</Reveal>
        <Reveal as="p" className="mut">Compare mileage, condition and service history. Budget for an inspection and a repair reserve.</Reveal>
        <EmptyState title="Seller inventory is coming" description="Explore the new-car catalogue while dealers and private sellers add stock." action="List a car" href="/sell" reveal />
      </section>
      <section className="sec">
        <Reveal as="p" className="k">03 · What moves you?</Reveal>
        <Reveal as="h2">Explore the technology.</Reveal>
        <div className="grid" style={{ marginTop: 24 }}>
          {TECHNOLOGIES.map(([title, description, fuel]) => (
            <Reveal key={fuel} as="a" className="card" href={`/marketplace?fuel=${encodeURIComponent(fuel)}`}>
              <b style={{ fontSize: 20 }}>{title}</b>
              <span className="mut">{description}</span>
              <span className="k" style={{ marginTop: 10 }}>Explore cars →</span>
            </Reveal>
          ))}
        </div>
      </section>
      <section className="sec hero">
        <div>
          <Reveal as="p" className="k">04 · Buy with a clear view</Reveal>
          <Reveal as="h2">A car you love. A budget that works.</Reveal>
          <Reveal as="p" className="mut" style={{ margin: "12px 0 20px" }}>The instalment is only the start. See finance, fuel, insurance and maintenance, then compare 1, 3 and 5 years of ownership.</Reveal>
          <Link className="btn ac" href="/affordability" prefetch={false}>Check my budget</Link>{" "}
          <Link className="btn o" href="/compare" prefetch={false}>Compare two cars</Link>
        </div>
        <Reveal className="card"><b>Before you buy</b>{CHECKLIST.map((item) => <p key={item} className="ln mut" style={{ fontSize: 14 }}>{item}</p>)}</Reveal>
      </section>
      <Reveal as="section" className="empty">
        <p className="k">For dealerships &amp; private sellers</p>
        <h2 style={{ margin: "8px 0 16px" }}>Find your next buyer.</h2>
        <Link className="btn ac" href="/sell" prefetch={false}>Sell on Carpur</Link>
      </Reveal>
    </>
  );
}
