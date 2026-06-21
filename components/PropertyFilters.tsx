"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useLocale } from "@/components/providers/LocaleProvider";

type PropertyFiltersProps = {
  villes: string[];
  initial: {
    ville: string;
    types: string[];
    piscine: boolean;
    prixMin: string;
    prixMax: string;
    distanceMax: string;
    capacite: string;
  };
};

const distanceOptionsFr = [
  { value: "", label: "Indifférent" },
  { value: "500", label: "Moins de 500 m" },
  { value: "1000", label: "Moins de 1 km" },
  { value: "2000", label: "Moins de 2 km" },
  { value: "5000", label: "Moins de 5 km" },
];

const distanceOptionsAr = [
  { value: "", label: "غير محدد" },
  { value: "500", label: "أقل من 500 م" },
  { value: "1000", label: "أقل من 1 كم" },
  { value: "2000", label: "أقل من 2 كم" },
  { value: "5000", label: "أقل من 5 كم" },
];

export default function PropertyFilters({ villes, initial }: PropertyFiltersProps) {
  const router = useRouter();
  const { locale, t } = useLocale();
  const [open, setOpen] = useState(false);

  const distanceOptions = locale === "ar" ? distanceOptionsAr : distanceOptionsFr;
  const capaciteOptions = useMemo(
    () => [
      { value: "", label: t.search.any },
      { value: "2", label: `2 ${t.search.peoplePlus}` },
      { value: "4", label: `4 ${t.search.peoplePlus}` },
      { value: "6", label: `6 ${t.search.peoplePlus}` },
      { value: "8", label: `8 ${t.search.peoplePlus}` },
    ],
    [t]
  );

  const [ville, setVille] = useState(initial.ville);
  const [types, setTypes] = useState<string[]>(initial.types);
  const [piscine, setPiscine] = useState(initial.piscine);
  const [prixMin, setPrixMin] = useState(initial.prixMin);
  const [prixMax, setPrixMax] = useState(initial.prixMax);
  const [distanceMax, setDistanceMax] = useState(initial.distanceMax);
  const [capacite, setCapacite] = useState(initial.capacite);

  function toggleType(value: string) {
    setTypes((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value]
    );
  }

  function applyFilters() {
    const params = new URLSearchParams();
    if (ville) params.set("ville", ville);
    if (types.length === 1) params.set("type", types[0]);
    if (piscine) params.set("piscine", "true");
    if (prixMin) params.set("prix_min", prixMin);
    if (prixMax) params.set("prix_max", prixMax);
    if (distanceMax) params.set("distance_max", distanceMax);
    if (capacite) params.set("capacite", capacite);
    router.push(`/biens${params.toString() ? `?${params.toString()}` : ""}`);
    setOpen(false);
  }

  function resetFilters() {
    setVille("");
    setTypes([]);
    setPiscine(false);
    setPrixMin("");
    setPrixMax("");
    setDistanceMax("");
    setCapacite("");
    router.push("/biens");
    setOpen(false);
  }

  const content = (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-ink">{t.search.propertyType}</h3>
        <div className="mt-3 space-y-2">
          {[
            { value: "villa", label: t.common.villa },
            { value: "appartement", label: t.common.apartment },
          ].map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer items-center gap-2.5 text-sm text-ink-soft"
            >
              <input
                type="checkbox"
                checked={types.includes(option.value)}
                onChange={() => toggleType(option.value)}
                className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              {option.label}
            </label>
          ))}
        </div>
      </div>

      <div className="border-t border-slate-100 pt-5">
        <label className="flex cursor-pointer items-center justify-between">
          <span className="text-sm font-semibold text-ink">{t.filters.pool}</span>
          <button
            type="button"
            role="switch"
            aria-checked={piscine}
            onClick={() => setPiscine((value) => !value)}
            className={`relative h-6 w-11 rounded-full transition ${
              piscine ? "bg-brand-600" : "bg-slate-300"
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
                piscine ? "left-[22px]" : "left-0.5"
              }`}
            />
          </button>
        </label>
      </div>

      <div className="border-t border-slate-100 pt-5">
        <h3 className="text-sm font-semibold text-ink">{t.filters.price}</h3>
        <div className="mt-3 flex items-center gap-2">
          <input
            type="number"
            min="0"
            placeholder={t.filters.priceMin}
            value={prixMin}
            onChange={(event) => setPrixMin(event.target.value)}
            className="input-field"
          />
          <span className="text-ink-muted">—</span>
          <input
            type="number"
            min="0"
            placeholder={t.filters.priceMax}
            value={prixMax}
            onChange={(event) => setPrixMax(event.target.value)}
            className="input-field"
          />
        </div>
      </div>

      <div className="border-t border-slate-100 pt-5">
        <h3 className="text-sm font-semibold text-ink">{t.filters.distance}</h3>
        <select
          value={distanceMax}
          onChange={(event) => setDistanceMax(event.target.value)}
          className="input-field mt-3"
        >
          {distanceOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="border-t border-slate-100 pt-5">
        <h3 className="text-sm font-semibold text-ink">{t.filters.capacity}</h3>
        <select
          value={capacite}
          onChange={(event) => setCapacite(event.target.value)}
          className="input-field mt-3"
        >
          {capaciteOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="border-t border-slate-100 pt-5">
        <h3 className="text-sm font-semibold text-ink">{t.filters.wilaya}</h3>
        <select
          value={ville}
          onChange={(event) => setVille(event.target.value)}
          className="input-field mt-3"
        >
          <option value="">{t.filters.allWilayas}</option>
          {villes.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2 border-t border-slate-100 pt-5">
        <button type="button" onClick={applyFilters} className="btn-primary w-full">
          {t.filters.apply}
        </button>
        <button type="button" onClick={resetFilters} className="btn-ghost w-full">
          {t.filters.reset}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Bouton mobile */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn-secondary w-full lg:hidden"
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
          <path
            d="M4 6h16M7 12h10M10 18h4"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
        {t.filters.open}
      </button>

      {/* Sidebar desktop */}
      <aside className="card-surface hidden h-fit p-6 lg:block">{content}</aside>

      {/* Drawer mobile */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-[85%] max-w-sm overflow-y-auto bg-white p-6 shadow-float">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-ink">
                {t.filters.title}
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-slate-100"
                aria-label="Fermer"
              >
                <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                  <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            {content}
          </div>
        </div>
      )}
    </>
  );
}
