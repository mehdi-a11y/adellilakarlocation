import { getDictionary, type Locale } from "@/lib/i18n";

type PropertyMapProps = {
  latitude: number | null;
  longitude: number | null;
  adresse: string;
  ville: string;
  locale: Locale;
};

export default function PropertyMap({
  latitude,
  longitude,
  adresse,
  ville,
  locale,
}: PropertyMapProps) {
  const t = getDictionary(locale);
  const mapsLang = locale === "ar" ? "ar" : "fr";

  if (latitude === null || longitude === null) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-ink-muted">
        {t.property.approxLocation.replace("{address}", adresse).replace("{city}", ville)}
      </div>
    );
  }

  const embedUrl = `https://www.google.com/maps?q=${latitude},${longitude}&hl=${mapsLang}&z=16&output=embed`;
  const openUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}&hl=${mapsLang}`;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200">
      <iframe
        title={t.property.location}
        src={embedUrl}
        className="h-72 w-full"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
      />
      <div className="flex flex-col gap-2 bg-white px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
        <span className="text-ink-muted">
          {adresse}, {ville}
        </span>
        <a
          href={openUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-brand-700 hover:underline"
        >
          {t.property.openInGoogleMaps}
        </a>
      </div>
    </div>
  );
}
