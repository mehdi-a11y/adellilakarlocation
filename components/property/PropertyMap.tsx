type PropertyMapProps = {
  latitude: number | null;
  longitude: number | null;
  adresse: string;
  ville: string;
};

export default function PropertyMap({
  latitude,
  longitude,
  adresse,
  ville,
}: PropertyMapProps) {
  if (latitude === null || longitude === null) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-ink-muted">
        Localisation approximative : {adresse}, {ville}.
      </div>
    );
  }

  const delta = 0.01;
  const bbox = [
    longitude - delta,
    latitude - delta,
    longitude + delta,
    latitude + delta,
  ].join("%2C");

  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${latitude}%2C${longitude}`;
  const link = `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=15/${latitude}/${longitude}`;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200">
      <iframe
        title="Localisation du bien"
        src={src}
        className="h-72 w-full"
        loading="lazy"
      />
      <div className="flex items-center justify-between gap-3 bg-white px-4 py-3 text-sm">
        <span className="text-ink-muted">
          {adresse}, {ville}
        </span>
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-brand-700 hover:underline"
        >
          Voir en grand
        </a>
      </div>
    </div>
  );
}
