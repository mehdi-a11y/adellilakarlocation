import Link from "next/link";
import dynamic from "next/dynamic";
import { notFound } from "next/navigation";
import AmenityList from "@/components/property/AmenityList";
import FacebookViewContent from "@/components/analytics/FacebookViewContent";
import Gallery from "@/components/property/Gallery";
import PropertyMap from "@/components/property/PropertyMap";
import ReviewsSection from "@/components/property/ReviewsSection";
import { getDictionary, formatPropertyType, type Locale } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n/locale-server";
import { createClient } from "@/lib/supabase/server";
import type { Property, PropertyImage } from "@/types/property";

const BookingWidget = dynamic(
  () => import("@/components/property/BookingWidget"),
  {
    loading: () => (
      <div className="card-surface h-[520px] animate-pulse rounded-2xl" />
    ),
    ssr: false,
  }
);

export const revalidate = 60;

type PageProps = {
  params: { id: string };
};

export async function generateMetadata({ params }: PageProps) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("properties")
    .select("titre, ville")
    .eq("id", params.id)
    .single();

  return {
    title: data ? `${data.titre} — ${data.ville}` : "Bien",
  };
}

function formatDistance(metres: number | null, locale: Locale) {
  const t = getDictionary(locale);
  if (metres === null) return null;
  if (metres < 1000) return `${metres} ${t.property.distanceSea}`;
  return `${(metres / 1000).toFixed(1).replace(".0", "")} ${t.property.distanceKm}`;
}

export default async function PropertyDetailPage({ params }: PageProps) {
  const locale = await getLocale();
  const t = getDictionary(locale);
  const supabase = await createClient();

  const { data: property, error } = await supabase
    .from("properties")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !property) {
    notFound();
  }

  const prop = property as Property;

  const [{ data: images }, { data: amenities }, { data: blocks }, { data: reviews }] =
    await Promise.all([
      supabase
        .from("property_images")
        .select("id, url, ordre")
        .eq("property_id", params.id)
        .order("ordre", { ascending: true }),
      supabase
        .from("property_amenities")
        .select("nom_equipement")
        .eq("property_id", params.id),
      supabase
        .from("availability_blocks")
        .select("date_debut, date_fin")
        .eq("property_id", params.id),
      supabase
        .from("reviews")
        .select("id, note, commentaire, created_at, profiles(nom)")
        .eq("property_id", params.id)
        .order("created_at", { ascending: false }),
    ]);

  const distance = formatDistance(prop.distance_mer_metres, locale);

  return (
    <main className="bg-white">
      <FacebookViewContent
        propertyId={prop.id}
        title={prop.titre}
        type={prop.type}
        price={prop.prix_nuit}
      />
      <div className="container py-8">
        <Link href="/biens" className="text-sm text-brand-700 hover:underline">
          {t.property.backToList}
        </Link>

        <div className="mt-4">
          <Gallery
            images={(images ?? []) as PropertyImage[]}
            title={prop.titre}
            locale={locale}
          />
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_380px]">
          {/* Contenu */}
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
                {formatPropertyType(prop.type, locale, t)}
              </span>
              {prop.piscine && (
                <span className="rounded-full bg-accent-100 px-3 py-1 text-xs font-semibold text-accent-700">
                  {t.common.pool}
                </span>
              )}
            </div>

            <h1 className="mt-3 heading-display text-3xl sm:text-4xl">
              {prop.titre}
            </h1>
            <p className="mt-2 flex items-center gap-1.5 text-ink-muted">
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-brand-600">
                <path
                  d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z"
                  stroke="currentColor"
                  strokeWidth="1.6"
                />
                <circle cx="12" cy="10" r="2.4" stroke="currentColor" strokeWidth="1.6" />
              </svg>
              {prop.adresse}, {prop.ville}
            </p>

            <div className="mt-6 flex flex-wrap gap-6 border-y border-slate-100 py-5 text-sm">
              <div>
                <p className="text-ink-muted">{t.property.capacity}</p>
                <p className="font-semibold text-ink">
                  {prop.capacite} {t.common.persons}
                </p>
              </div>
              {distance && (
                <div>
                  <p className="text-ink-muted">{t.property.sea}</p>
                  <p className="font-semibold text-ink">{distance}</p>
                </div>
              )}
              <div>
                <p className="text-ink-muted">{t.property.type}</p>
                <p className="font-semibold text-ink">
                  {formatPropertyType(prop.type, locale, t)}
                </p>
              </div>
            </div>

            <section className="mt-8">
              <h2 className="heading-display text-2xl">{t.property.description}</h2>
              <p className="mt-3 whitespace-pre-line text-ink-soft">
                {prop.description || t.property.noDescription}
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
                  latitude={prop.latitude}
                  longitude={prop.longitude}
                  adresse={prop.adresse}
                  ville={prop.ville}
                  locale={locale}
                />
              </div>
            </section>

            <section className="mt-10">
              <ReviewsSection reviews={(reviews ?? []) as never} />
            </section>
          </div>

          {/* Panneau réservation */}
          <div className="lg:sticky lg:top-20 lg:self-start">
            <BookingWidget
              target={{ kind: "property", propertyId: prop.id }}
              titre={prop.titre}
              ville={prop.ville}
              prixNuit={prop.prix_nuit}
              capacite={prop.capacite}
              bookings={[]}
              blocks={(blocks ?? []) as { date_debut: string; date_fin: string }[]}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
