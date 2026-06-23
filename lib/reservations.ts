import type { SupabaseClient } from "@supabase/supabase-js";

export async function releaseReservationAvailability(
  supabase: SupabaseClient,
  propertyId: string,
  dateDebut: string,
  dateFin: string
) {
  const { data: blocks, error: selectError } = await supabase
    .from("availability_blocks")
    .select("id")
    .eq("property_id", propertyId)
    .eq("raison", "reserve")
    .lte("date_debut", dateFin)
    .gte("date_fin", dateDebut);

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
