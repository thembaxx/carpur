import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CarStudio } from "@/components/CarStudio";
import { EnergyModelNote } from "@/components/EnergyModelNote";
import { OwnershipCostCard } from "@/components/OwnershipCostCard";
import { VehicleActions } from "@/components/VehicleActions";
import { catalogue, getCatalogueCar } from "@/lib/catalogue";
import { R } from "@/lib/data";

type Props = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return catalogue.map((car) => ({ id: car.siteId }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const car = getCatalogueCar((await params).id);
  return { title: car ? `${car.n} — Carpur` : "Page not found — Carpur" };
}

export default async function Vehicle({ params }: Props) {
  const car = getCatalogueCar((await params).id);
  if (!car) notFound();
  return (
    <section className="hero">
      <CarStudio body={car.b} color={car.c} />
      <div>
        <p className="k">{`New · ${car.t} · ${car.f}`}</p>
        <h2 style={{ margin: "6px 0 10px" }}>{car.n}</h2>
        <p className="mut">Manufacturer reference price</p>
        <h1 style={{ fontSize: "clamp(34px,6vw,56px)" }}>{R(car.p)}</h1>
        <OwnershipCostCard price={car.p} />
        <VehicleActions siteId={car.siteId} alias={car.id} />
        <p className="mut" style={{ fontSize: 12 }}>{`3D model is an illustrative ${car.b} body style, not this exact variant. Confirm stock and delivery with a dealer.`}</p>
        <EnergyModelNote show={car.f !== "Petrol"} />
      </div>
    </section>
  );
}
