import Link from "next/link";
import { notFound } from "next/navigation";
import BuildingForm from "@/components/admin/BuildingForm";
import BuildingUnitsManager from "@/components/admin/BuildingUnitsManager";
import { createClient } from "@/lib/supabase/server";
import type { Building, BuildingImage, BuildingUnit } from "@/types/building";

type PageProps = {
  params: { id: string };
};

export default async function EditBuildingPage({ params }: PageProps) {
  const supabase = await createClient();

  const { data: building, error } = await supabase
    .from("buildings")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !building) {
    notFound();
  }

  const [{ data: images }, { data: amenities }, { data: units }] = await Promise.all([
    supabase
      .from("building_images")
      .select("id, building_id, url, ordre")
      .eq("building_id", params.id)
      .order("ordre", { ascending: true }),
    supabase
      .from("building_amenities")
      .select("nom_equipement")
      .eq("building_id", params.id),
    supabase
      .from("building_units")
      .select("*")
      .eq("building_id", params.id)
      .order("ordre", { ascending: true }),
  ]);

  return (
    <main>
      <Link href="/admin/immeubles" className="text-sm text-brand-700 hover:underline">
        ← Retour à la liste
      </Link>
      <h1 className="mt-4 heading-display text-3xl">Modifier l&apos;immeuble</h1>
      <p className="mt-2 text-ink-muted">{building.titre}</p>

      <div className="mt-8 space-y-8">
        <BuildingForm
          mode="edit"
          building={building as Building}
          initialImages={(images ?? []) as BuildingImage[]}
          initialAmenities={(amenities ?? []).map((item) => item.nom_equipement)}
        />
        <BuildingUnitsManager
          buildingId={params.id}
          initialUnits={(units ?? []) as BuildingUnit[]}
        />
      </div>
    </main>
  );
}
