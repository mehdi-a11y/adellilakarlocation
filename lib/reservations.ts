import type { SupabaseClient } from "@supabase/supabase-js";

type ReleaseTarget = {
  propertyId?: string | null;
  buildingUnitId?: string | null;
  dateDebut: string;
  dateFin: string;
};

export async function releaseReservationAvailability(
  supabase: SupabaseClient,
  target: ReleaseTarget
) {
  const { propertyId, buildingUnitId, dateDebut, dateFin } = target;

  let query = supabase
    .from("availability_blocks")
    .select("id")
    .eq("raison", "reserve")
    .lte("date_debut", dateFin)
    .gte("date_fin", dateDebut);

  if (buildingUnitId) {
    query = query.eq("building_unit_id", buildingUnitId);
  } else if (propertyId) {
    query = query.eq("property_id", propertyId);
  } else {
    return { error: null, released: 0 };
  }

  const { data: blocks, error: selectError } = await query;

  if (selectError) {
    return { error: selectError, released: 0 };
  }

  if (!blocks?.length) {
    return { error: null, released: 0 };
  }

  const { error: deleteError } = await supabase
    .from("availability_blocks")
    .delete()
    .in(
      "id",
      blocks.map((block) => block.id)
    );

  return { error: deleteError, released: blocks.length };
}
