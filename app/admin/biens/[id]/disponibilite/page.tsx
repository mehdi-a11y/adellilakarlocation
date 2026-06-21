import Link from "next/link";
import { notFound } from "next/navigation";
import AvailabilityCalendar from "@/components/admin/AvailabilityCalendar";
import { createClient } from "@/lib/supabase/server";

type PageProps = {
  params: { id: string };
};

export default async function PropertyAvailabilityPage({ params }: PageProps) {
  const supabase = await createClient();

  const { data: property, error } = await supabase
    .from("properties")
    .select("id, titre")
    .eq("id", params.id)
    .single();

  if (error || !property) {
    notFound();
  }

  const { data: bookings } = await supabase
    .from("bookings")
    .select("id, date_debut, date_fin, statut")
    .eq("property_id", params.id);

  const { data: blocks } = await supabase
    .from("availability_blocks")
    .select("id, date_debut, date_fin, raison")
    .eq("property_id", params.id);

  return (
    <main>
      <Link
        href="/admin/biens"
        className="text-sm text-brand-700 hover:underline"
      >
        ← Retour à la liste
      </Link>
      <h1 className="mt-4 heading-display text-3xl">Disponibilité</h1>
      <p className="mt-2 text-ink-muted">{property.titre}</p>

      <div className="mt-8">
        <AvailabilityCalendar
          propertyId={property.id}
          propertyTitle={property.titre}
          initialBookings={bookings ?? []}
          initialBlocks={blocks ?? []}
        />
      </div>
    </main>
  );
}
