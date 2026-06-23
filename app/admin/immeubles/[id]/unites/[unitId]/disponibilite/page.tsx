import Link from "next/link";
import { notFound } from "next/navigation";
import UnitAvailabilityCalendar from "@/components/admin/UnitAvailabilityCalendar";
import { createClient } from "@/lib/supabase/server";

type PageProps = {
  params: { id: string; unitId: string };
};

export default async function UnitAvailabilityPage({ params }: PageProps) {
  const supabase = await createClient();

  const { data: unit, error } = await supabase
    .from("building_units")
    .select("id, label, building_id, buildings(titre)")
    .eq("id", params.unitId)
    .eq("building_id", params.id)
    .single();

  if (error || !unit) {
    notFound();
  }

  const { data: blocks } = await supabase
    .from("availability_blocks")
    .select("id, date_debut, date_fin, raison")
    .eq("building_unit_id", params.unitId);

  const buildingTitle =
    unit.buildings && typeof unit.buildings === "object" && "titre" in unit.buildings
      ? (unit.buildings as { titre: string }).titre
      : "Immeuble";

  return (
    <main>
      <Link
        href={`/admin/immeubles/${params.id}/modifier`}
        className="text-sm text-brand-700 hover:underline"
      >
        ← Retour à l&apos;immeuble
      </Link>
      <h1 className="mt-4 heading-display text-3xl">Disponibilité</h1>
      <p className="mt-2 text-ink-muted">
        {buildingTitle} — {unit.label}
      </p>

      <div className="mt-8">
        <UnitAvailabilityCalendar
          buildingUnitId={unit.id}
          unitLabel={unit.label}
          initialBlocks={blocks ?? []}
        />
      </div>
    </main>
  );
}
