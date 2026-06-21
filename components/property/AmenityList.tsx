"use client";

import { useLocale } from "@/components/providers/LocaleProvider";

type AmenityListProps = {
  amenities: string[];
};

const icons: Record<string, React.ReactNode> = {
  Wifi: (
    <path
      d="M2 8.5a16 16 0 0 1 20 0M5 12a11 11 0 0 1 14 0M8.5 15.5a6 6 0 0 1 7 0M12 19h.01"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  Climatisation: (
    <path
      d="M12 3v18M3 12h18M6 6l12 12M18 6 6 18"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  ),
  Parking: (
    <path
      d="M6 20V4h6a5 5 0 0 1 0 10H6"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  "Vue mer": (
    <path
      d="M3 18c2 0 2-1.5 4-1.5S9 18 11 18s2-1.5 4-1.5S17 18 19 18M4 13l8-7 8 7"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
};

const defaultIcon = (
  <path
    d="m5 13 4 4L19 7"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  />
);

export default function AmenityList({ amenities }: AmenityListProps) {
  const { t } = useLocale();

  if (amenities.length === 0) {
    return <p className="text-sm text-ink-muted">{t.property.noAmenities}</p>;
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {amenities.map((amenity) => (
        <li key={amenity} className="flex items-center gap-3 text-sm text-ink-soft">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
              {icons[amenity] ?? defaultIcon}
            </svg>
          </span>
          {t.amenities[amenity] ?? amenity}
        </li>
      ))}
    </ul>
  );
}
