import Link from "next/link";
import { notFound } from "next/navigation";
import PropertyForm from "@/components/admin/PropertyForm";
import { createClient } from "@/lib/supabase/server";
import type { Property, PropertyImage } from "@/types/property";

type PageProps = {
  params: { id: string };
};

export default async function EditPropertyPage({ params }: PageProps) {
  const supabase = await createClient();

  const { data: property, error } = await supabase
    .from("properties")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !property) {
    notFound();
  }

  const { data: images } = await supabase
    .from("property_images")
    .select("*")
    .eq("property_id", params.id)
    .order("ordre", { ascending: true });

  const { data: amenities } = await supabase
    .from("property_amenities")
    .select("nom_equipement")
    .eq("property_id", params.id);

  return (
    <main>
      <Link
        href="/admin/biens"
        className="text-sm text-brand-700 hover:underline"
      >
        ← Retour à la liste
      </Link>
      <h1 className="mt-4 heading-display text-3xl">Modifier le bien</h1>
      <p className="mt-2 text-ink-muted">{property.titre}</p>
      <div className="mt-2 flex flex-wrap gap-3">
        <Link
          href={`/admin/biens/${params.id}/disponibilite`}
          className="text-sm font-medium text-brand-700 hover:underline"
        >
          Gérer le calendrier de disponibilité
        </Link>
      </div>
      <div className="mt-8">
        <PropertyForm
          mode="edit"
          property={property as Property}
          initialImages={(images ?? []) as PropertyImage[]}
          initialAmenities={(amenities ?? []).map((item) => item.nom_equipement)}
        />
      </div>
    </main>
  );
}
