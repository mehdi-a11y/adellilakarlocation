import Link from "next/link";
import PropertyCard from "@/components/PropertyCard";
import PropertyFilters from "@/components/PropertyFilters";
import { getDictionary } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n/locale-server";
import { PROPERTY_CARD_SELECT } from "@/lib/queries/properties";
import { getUniqueWilayas } from "@/lib/wilayas";
import { createClient } from "@/lib/supabase/server";
import type { PropertyListItem } from "@/types/property";

export const metadata = {
  title: "Nos biens",
};

export const revalidate = 60;

const PAGE_SIZE = 9;

type SearchParams = {
  ville?: string;
  type?: string;
  capacite?: string;
  piscine?: string;
  prix_min?: string;
  prix_max?: string;
  distance_max?: string;
  page?: string;
};

function buildQueryString(params: SearchParams, page: number) {
  const search = new URLSearchParams();
  if (params.ville) search.set("ville", params.ville);
  if (params.type) search.set("type", params.type);
  if (params.capacite) search.set("capacite", params.capacite);
  if (params.piscine) search.set("piscine", params.piscine);
  if (params.prix_min) search.set("prix_min", params.prix_min);
  if (params.prix_max) search.set("prix_max", params.prix_max);
  if (params.distance_max) search.set("distance_max", params.distance_max);
  if (page > 1) search.set("page", String(page));
  const str = search.toString();
  return str ? `?${str}` : "";
}

export default async function BiensPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const locale = await getLocale();
  const t = getDictionary(locale);
  const supabase = await createClient();

  const page = Math.max(Number(searchParams.page) || 1, 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from("properties")
    .select(PROPERTY_CARD_SELECT, { count: "exact" })
    .eq("statut", "actif");

  if (searchParams.type === "villa" || searchParams.type === "appartement") {
    query = query.eq("type", searchParams.type);
  }
  if (searchParams.piscine === "true") {
    query = query.eq("piscine", true);
  }
  if (searchParams.capacite) {
    const min = Number(searchParams.capacite);
    if (!Number.isNaN(min)) query = query.gte("capacite", min);
  }
  if (searchParams.prix_min) {
    const min = Number(searchParams.prix_min);
    if (!Number.isNaN(min)) query = query.gte("prix_nuit", min);
  }
  if (searchParams.prix_max) {
    const max = Number(searchParams.prix_max);
    if (!Number.isNaN(max)) query = query.lte("prix_nuit", max);
  }
  if (searchParams.distance_max) {
    const max = Number(searchParams.distance_max);
    if (!Number.isNaN(max)) query = query.lte("distance_mer_metres", max);
  }
  if (searchParams.ville?.trim()) {
    query = query.eq("ville", searchParams.ville.trim());
  }

  const { data, count } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  const properties = (data ?? []) as PropertyListItem[];
  const total = count ?? 0;
  const totalPages = Math.max(Math.ceil(total / PAGE_SIZE), 1);

  const { data: villeRows } = await supabase
    .from("properties")
    .select("ville")
    .eq("statut", "actif");

  const villes = getUniqueWilayas((villeRows ?? []).map((row) => row.ville));

  const initialFilters = {
    ville: searchParams.ville ?? "",
    types: searchParams.type ? [searchParams.type] : [],
    piscine: searchParams.piscine === "true",
    prixMin: searchParams.prix_min ?? "",
    prixMax: searchParams.prix_max ?? "",
    distanceMax: searchParams.distance_max ?? "",
    capacite: searchParams.capacite ?? "",
  };

  return (
    <main>
      <section className="border-b border-slate-200 bg-gradient-to-b from-slate-50 to-white">
        <div className="container py-12">
          <p className="section-eyebrow">{t.properties.catalogue}</p>
          <h1 className="mt-2 heading-display text-3xl sm:text-4xl">
            {t.properties.title}
          </h1>
          <p className="mt-3 max-w-2xl text-ink-muted">{t.properties.subtitle}</p>
        </div>
      </section>

      <section className="bg-white py-10">
        <div className="container">
          <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
            <div className="lg:sticky lg:top-20 lg:self-start">
              <PropertyFilters villes={villes} initial={initialFilters} />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <p className="text-sm text-ink-muted">
                  {total}{" "}
                  {total > 1 ? t.properties.foundPlural : t.properties.found}
                </p>
                <p className="text-sm text-ink-muted">
                  {t.properties.page} {page} / {totalPages}
                </p>
              </div>

              {properties.length === 0 ? (
                <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-slate-50 py-20 text-center">
                  <p className="font-display text-lg text-ink">{t.properties.empty}</p>
                  <p className="mt-2 text-sm text-ink-muted">{t.properties.emptyHint}</p>
                  <Link href="/biens" className="btn-secondary mt-6">
                    {t.properties.reset}
                  </Link>
                </div>
              ) : (
                <>
                  <div className="mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                    {properties.map((property) => (
                      <PropertyCard
                        key={property.id}
                        property={property}
                        locale={locale}
                      />
                    ))}
                  </div>

                  {totalPages > 1 && (
                    <nav className="mt-10 flex items-center justify-center gap-2">
                      {page > 1 && (
                        <Link
                          href={`/biens${buildQueryString(searchParams, page - 1)}`}
                          className="btn-secondary px-4"
                        >
                          {t.properties.prev}
                        </Link>
                      )}
                      {Array.from({ length: totalPages }).map((_, index) => {
                        const pageNumber = index + 1;
                        const isCurrent = pageNumber === page;
                        return (
                          <Link
                            key={pageNumber}
                            href={`/biens${buildQueryString(searchParams, pageNumber)}`}
                            className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium transition ${
                              isCurrent
                                ? "bg-brand-600 text-white"
                                : "border border-slate-200 text-ink-muted hover:bg-slate-50"
                            }`}
                          >
                            {pageNumber}
                          </Link>
                        );
                      })}
                      {page < totalPages && (
                        <Link
                          href={`/biens${buildQueryString(searchParams, page + 1)}`}
                          className="btn-secondary px-4"
                        >
                          {t.properties.next}
                        </Link>
                      )}
                    </nav>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
