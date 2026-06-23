import Link from "next/link";
import { notFound } from "next/navigation";
import BuildingBookingPanel from "@/components/building/BuildingBookingPanel";
import AmenityList from "@/components/property/AmenityList";
import Gallery from "@/components/property/Gallery";
import PropertyMap from "@/components/property/PropertyMap";
import { getActiveUnitCount } from "@/lib/queries/buildings";
import { getDictionary } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n/locale-server";
import { createClient } from "@/lib/supabase/server";
import type { Building, BuildingUnit } from "@/types/building";
import type { PropertyImage } from "@/types/property";

export const revalidate = 60;

type PageProps = {
  params: { id: string };
};

export async function generateMetadata({ params }: PageProps) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("buildings")
    .select("titre, ville")
    .eq("id", params.id)
    .single();

  return {
    title: data ? `${data.titre} — ${data.ville}` : "Immeuble",
  };
}

export default async function BuildingDetailPage({ params }: PageProps) {
  const locale = await getLocale();
  const t = getDictionary(locale);
  const supabase = await createClient();

  const { data: building, error } = await supabase
    .from("buildings")
    .select("*")
    .eq("id", params.id)
    .eq("statut", "actif")
    .single();

  if (error || !building) {
    notFound();
  }

  const b = building as Building;

  const [{ data: images }, { data: amenities }, { data: units }] = await Promise.all([
    supabase
      .from("building_images")
      .select("id, url, ordre")
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

  const unitList = (units ?? []) as BuildingUnit[];
  const unitIds = unitList.map((unit) => unit.id);

  let blocksByUnit: Record<string, { date_debut: string; date_fin: string }[]> = {};

  if (unitIds.length > 0) {
    const { data: blocks } = await supabase
      .from("availability_blocks")
      .select("building_unit_id, date_debut, date_fin")
      .in("building_unit_id", unitIds);

    blocksByUnit = (blocks ?? []).reduce<
      Record<string, { date_debut: string; date_fin: string }[]>
    >((acc, block) => {
      if (!block.building_unit_id) return acc;
      if (!acc[block.building_unit_id]) acc[block.building_unit_id] = [];
      acc[block.building_unit_id].push({
        date_debut: block.date_debut,
        date_fin: block.date_fin,
      });
      return acc;
    }, {});
  }

  const galleryImages = (images ?? []).map((image) => ({
    id: image.id,
    property_id: params.id,
    url: image.url,
    ordre: image.ordre,
  })) as PropertyImage[];

  const activeCount = getActiveUnitCount(unitList);

  return (
    <main className="bg-white">
      <div className="container py-8">
        <Link href="/biens" className="text-sm text-brand-700 hover:underline">
          {t.property.backToList}
        </Link>

        <div className="mt-4">
          <Gallery images={galleryImages} title={b.titre} locale={locale} />
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_380px]">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
                Immeuble
              </span>
              {activeCount > 0 && (
                <span className="rounded-full bg-accent-100 px-3 py-1 text-xs font-semibold text-accent-700">
                  {activeCount} appartement{activeCount > 1 ? "s" : ""}
                </span>
              )}
            </div>

            <h1 className="mt-3 heading-display text-3xl sm:text-4xl">{b.titre}</h1>
            <p className="mt-2 flex items-center gap-1.5 text-ink-muted">
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-brand-600">
                <path
                  d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z"
                  stroke="currentColor"
                  strokeWidth="1.6"
                />
                <circle cx="12" cy="10" r="2.4" stroke="currentColor" strokeWidth="1.6" />
              </svg>
              {b.adresse}, {b.ville}
            </p>

            <section className="mt-8">
              <h2 className="heading-display text-2xl">{t.property.description}</h2>
              <p className="mt-3 whitespace-pre-line text-ink-soft">
                {b.description || t.property.noDescription}
              </p>
            </section>

            <section className="mt-8">
              <h2 className="heading-display text-2xl">{t.property.amenities}</h2>
              <div className="mt-4">
                <AmenityList
                  amenities={(amenities ?? []).map((item) => item.nom_equipement)}
                />
              </div>
            </section>

            <section className="mt-8">
              <h2 className="heading-display text-2xl">{t.property.location}</h2>
              <div className="mt-4">
                <PropertyMap
                  latitude={b.latitude}
                  longitude={b.longitude}
                  adresse={b.adresse}
                  ville={b.ville}
                  locale={locale}
                />
              </div>
            </section>
          </div>

          <div className="lg:sticky lg:top-20 lg:self-start">
            <BuildingBookingPanel
              buildingTitle={b.titre}
              ville={b.ville}
              units={unitList}
              blocksByUnit={blocksByUnit}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
