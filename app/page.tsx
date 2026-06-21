import Link from "next/link";
import Hero3D from "@/components/Hero3D";
import PropertyCard from "@/components/PropertyCard";
import { getDictionary } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n/locale-server";
import { PROPERTY_LIST_SELECT } from "@/lib/queries/properties";
import { createClient } from "@/lib/supabase/server";
import type { PropertyListItem } from "@/types/property";

export const revalidate = 60;

export default async function Home() {
  const locale = await getLocale();
  const t = getDictionary(locale);
  const supabase = await createClient();

  const { data } = await supabase
    .from("properties")
    .select(PROPERTY_LIST_SELECT)
    .eq("statut", "actif")
    .order("created_at", { ascending: false })
    .limit(6);

  const featured = (data ?? []) as PropertyListItem[];

  const atouts = [
    t.home.atouts.selected,
    t.home.atouts.seaside,
    t.home.atouts.booking,
    t.home.atouts.support,
  ];

  return (
    <main>
      <Hero3D available={featured.length} />

      <section className="bg-white py-20">
        <div className="container">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="section-eyebrow">{t.home.featuredEyebrow}</p>
              <h2 className="mt-2 heading-display text-3xl sm:text-4xl">
                {t.home.featuredTitle}
              </h2>
            </div>
            <Link href="/biens" className="btn-secondary">
              {t.home.viewAll}
            </Link>
          </div>

          {featured.length === 0 ? (
            <div className="mt-12 rounded-2xl border border-dashed border-slate-300 bg-slate-50 py-16 text-center">
              <p className="text-ink-muted">{t.home.emptyFeatured}</p>
            </div>
          ) : (
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((property, index) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  locale={locale}
                  priority={index < 3}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <section id="atouts" className="bg-gradient-to-b from-slate-50 to-brand-50/40 py-20">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <p className="section-eyebrow">{t.home.whyEyebrow}</p>
            <h2 className="mt-2 heading-display text-3xl sm:text-4xl">
              {t.home.whyTitle}
            </h2>
            <p className="mt-4 text-ink-muted">{t.home.whySubtitle}</p>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {atouts.map((atout) => (
              <div
                key={atout.title}
                className="card-surface p-6 transition duration-300 hover:-translate-y-1.5 hover:shadow-glow-blue"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 text-white shadow-soft">
                  <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
                    <path
                      d="m5 13 4 4L19 7"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <h3 className="mt-5 font-display text-lg font-semibold text-ink">
                  {atout.title}
                </h3>
                <p className="mt-2 text-sm text-ink-muted">{atout.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="container">
          <div className="bg-mesh-blue relative overflow-hidden rounded-3xl px-8 py-16 text-center text-white shadow-glow-blue sm:px-16">
            <div className="relative mx-auto max-w-2xl">
              <h2 className="heading-display text-3xl text-white sm:text-4xl">
                {t.home.ctaTitle}
              </h2>
              <p className="mt-4 text-white/80">{t.home.ctaSubtitle}</p>
              <div className="mt-8 flex flex-wrap justify-center gap-4">
                <Link href="/biens" className="btn bg-white text-brand-800 hover:bg-brand-50">
                  {t.home.explore}
                </Link>
                <a
                  href="https://wa.me/213000000000"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn border border-white/30 text-white hover:bg-white/10"
                >
                  {t.home.contactUs}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
