import Image from "next/image";
import Link from "next/link";
import { formatPrice, getDictionary, type Locale } from "@/lib/i18n";
import {
  getActiveUnitCount,
  getBuildingMinPrice,
} from "@/lib/queries/buildings";
import type { BuildingListItem } from "@/types/building";

type BuildingCardProps = {
  building: BuildingListItem;
  locale: Locale;
  priority?: boolean;
};

export default function BuildingCard({
  building,
  locale,
  priority,
}: BuildingCardProps) {
  const t = getDictionary(locale);
  const cover = [...(building.building_images ?? [])].sort(
    (a, b) => a.ordre - b.ordre
  )[0];
  const minPrice = getBuildingMinPrice(building.building_units ?? []);
  const unitCount = getActiveUnitCount(building.building_units ?? []);

  return (
    <Link
      href={`/immeubles/${building.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-soft transition-shadow duration-300 hover:shadow-glow-blue"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        {cover ? (
          <Image
            src={cover.url}
            alt={building.titre}
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
          <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-ink shadow-sm backdrop-blur">
            Immeuble
          </span>
          {unitCount > 0 && (
            <span className="rounded-full bg-brand-600/90 px-3 py-1 text-xs font-semibold text-white shadow-sm backdrop-blur">
              {unitCount} appart.
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
          {building.ville}
        </div>

        <h3 className="mt-2 line-clamp-1 font-display text-lg font-semibold text-ink">
          {building.titre}
        </h3>

        <p className="mt-2 text-sm text-ink-muted">
          {unitCount > 0
            ? `${unitCount} appartement${unitCount > 1 ? "s" : ""} disponible${unitCount > 1 ? "s" : ""}`
            : "Appartements bientôt disponibles"}
        </p>

        <div className="mt-auto flex items-end justify-between pt-5">
          <p className="text-ink">
            {minPrice !== null ? (
              <>
                <span className="text-sm text-ink-muted">À partir de </span>
                <span className="text-xl font-bold">
                  {formatPrice(minPrice, locale)}
                </span>
                <span className="text-sm text-ink-muted"> {t.common.perNight}</span>
              </>
            ) : (
              <span className="text-sm text-ink-muted">Prix sur demande</span>
            )}
          </p>
          <span className="text-sm font-semibold text-brand-600 transition group-hover:translate-x-0.5">
            {t.common.discover}
          </span>
        </div>
      </div>
    </Link>
  );
}
