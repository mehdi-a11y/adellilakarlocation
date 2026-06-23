"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { formatPrice } from "@/lib/i18n";
import type { BuildingUnit } from "@/types/building";

const BookingWidget = dynamic(
  () => import("@/components/property/BookingWidget"),
  {
    loading: () => (
      <div className="card-surface h-[520px] animate-pulse rounded-2xl" />
    ),
    ssr: false,
  }
);

type BlockRange = { date_debut: string; date_fin: string };

type BuildingBookingPanelProps = {
  buildingTitle: string;
  ville: string;
  units: BuildingUnit[];
  blocksByUnit: Record<string, BlockRange[]>;
};

export default function BuildingBookingPanel({
  buildingTitle,
  ville,
  units,
  blocksByUnit,
}: BuildingBookingPanelProps) {
  const activeUnits = useMemo(
    () => [...units].filter((unit) => unit.statut === "actif").sort((a, b) => a.ordre - b.ordre),
    [units]
  );

  const [selectedUnitId, setSelectedUnitId] = useState(activeUnits[0]?.id ?? "");

  const selectedUnit = activeUnits.find((unit) => unit.id === selectedUnitId);

  if (activeUnits.length === 0) {
    return (
      <div className="card-surface p-6 text-sm text-ink-muted">
        Aucun appartement disponible pour le moment.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section>
        <h2 className="heading-display text-xl">Choisir un appartement</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {activeUnits.map((unit) => {
            const isSelected = unit.id === selectedUnitId;
            return (
              <button
                key={unit.id}
                type="button"
                onClick={() => setSelectedUnitId(unit.id)}
                className={`rounded-xl border p-4 text-left transition ${
                  isSelected
                    ? "border-brand-500 bg-brand-50 shadow-soft"
                    : "border-slate-200 bg-white hover:border-brand-200"
                }`}
              >
                <p className="font-semibold text-ink">{unit.label}</p>
                <p className="mt-1 text-sm text-ink-muted">
                  {unit.capacite} pers. · {formatPrice(unit.prix_nuit)} / nuit
                </p>
                {unit.description && (
                  <p className="mt-2 line-clamp-2 text-xs text-ink-muted">
                    {unit.description}
                  </p>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {selectedUnit && (
        <BookingWidget
          target={{ kind: "unit", buildingUnitId: selectedUnit.id }}
          titre={`${buildingTitle} — ${selectedUnit.label}`}
          ville={ville}
          prixNuit={selectedUnit.prix_nuit}
          capacite={selectedUnit.capacite}
          bookings={[]}
          blocks={blocksByUnit[selectedUnit.id] ?? []}
        />
      )}
    </div>
  );
}
