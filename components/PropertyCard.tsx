import Image from "next/image";
import Link from "next/link";
import {
  formatPrice,
  formatPropertyType,
  getDictionary,
  type Locale,
} from "@/lib/i18n";
import type { PropertyListItem } from "@/types/property";

type PropertyCardProps = {
  property: PropertyListItem;
  locale: Locale;
  priority?: boolean;
};

function formatDistance(metres: number | null, locale: Locale) {
  const t = getDictionary(locale);
  if (metres === null) return null;
  if (metres < 1000) return `${metres} ${t.property.distanceSea}`;
  return `${(metres / 1000).toFixed(1).replace(".0", "")} ${t.property.distanceKm}`;
}

export default function PropertyCard({
  property,
  locale,
  priority,
}: PropertyCardProps) {
  const t = getDictionary(locale);
  const cover = [...(property.property_images ?? [])].sort(
    (a, b) => a.ordre - b.ordre
  )[0];
  const distance = formatDistance(property.distance_mer_metres, locale);

  return (
    <Link
      href={`/biens/${property.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-soft transition-shadow duration-300 hover:shadow-glow-blue"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        {cover ? (
          <Image
            src={cover.url}
            alt={property.titre}
            fill
            priority={priority}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 380px"
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-brand-100 to-accent-100 text-sm text-brand-700">
            {t.common.photoSoon}
          </div>
        )}

        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold capitalize text-ink shadow-sm backdrop-blur">
            {formatPropertyType(property.type, locale, t)}
          </span>
          {property.piscine && (
            <span className="rounded-full bg-brand-600/90 px-3 py-1 text-xs font-semibold text-white shadow-sm backdrop-blur">
              {t.common.pool}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-1.5 text-sm text-ink-muted">
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-brand-600">
            <path
              d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z"
              stroke="currentColor"
              strokeWidth="1.6"
            />
            <circle cx="12" cy="10" r="2.4" stroke="currentColor" strokeWidth="1.6" />
          </svg>
          {property.ville}
        </div>

        <h3 className="mt-2 line-clamp-1 font-display text-lg font-semibold text-ink">
          {property.titre}
        </h3>

        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-muted">
          <span>
            {property.capacite} {t.common.pers}
          </span>
          {distance && <span>{distance}</span>}
        </div>

        <div className="mt-auto flex items-end justify-between pt-5">
          <p className="text-ink">
            <span className="text-xl font-bold">
              {formatPrice(property.prix_nuit, locale)}
            </span>
            <span className="text-sm text-ink-muted"> {t.common.perNight}</span>
          </p>
          <span className="text-sm font-semibold text-brand-600 transition group-hover:translate-x-0.5">
            {t.common.discover}
          </span>
        </div>
      </div>
    </Link>
  );
}
