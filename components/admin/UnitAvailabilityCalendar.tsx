"use client";

import "react-day-picker/dist/style.css";
import { fr } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { DayPicker } from "react-day-picker";
import { useToast } from "@/components/ui/Toast";
import {
  dateKeysToDates,
  expandRangesToDateKeys,
  getNightsInRange,
  isPastDate,
  toDateKey,
} from "@/lib/dates";
import { createClient } from "@/lib/supabase/client";

type BlockRow = {
  id: string;
  date_debut: string;
  date_fin: string;
  raison: "reserve" | "bloque_manuellement";
};

type UnitAvailabilityCalendarProps = {
  buildingUnitId: string;
  unitLabel: string;
  initialBlocks: BlockRow[];
};

export default function UnitAvailabilityCalendar({
  buildingUnitId,
  unitLabel,
  initialBlocks,
}: UnitAvailabilityCalendarProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [month, setMonth] = useState(new Date());
  const [blocks, setBlocks] = useState(initialBlocks);
  const [loading, setLoading] = useState(false);

  const unavailableKeys = useMemo(
    () => expandRangesToDateKeys(blocks),
    [blocks]
  );

  const unavailableDates = useMemo(
    () => dateKeysToDates(unavailableKeys),
    [unavailableKeys]
  );

  const manualBlockKeys = useMemo(() => {
    const manual = blocks.filter((block) => block.raison === "bloque_manuellement");
    return expandRangesToDateKeys(manual);
  }, [blocks]);

  async function refreshBlocks() {
    const supabase = createClient();
    const { data } = await supabase
      .from("availability_blocks")
      .select("id, date_debut, date_fin, raison")
      .eq("building_unit_id", buildingUnitId);

    setBlocks(data ?? []);
    router.refresh();
  }

  async function handleDayClick(day: Date) {
    if (loading || isPastDate(day)) return;

    const dateKey = toDateKey(day);
    const reservedBlock = blocks.find(
      (block) =>
        block.raison === "reserve" &&
        getNightsInRange(block.date_debut, block.date_fin).includes(dateKey)
    );

    if (reservedBlock) {
      showToast("Date réservée — modifiez la réservation dans Admin → Réservations.", "error");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    try {
      if (manualBlockKeys.has(dateKey)) {
        const blockToRemove = blocks.find(
          (block) =>
            block.raison === "bloque_manuellement" &&
            getNightsInRange(block.date_debut, block.date_fin).includes(dateKey)
        );

        if (!blockToRemove) throw new Error("Bloc introuvable.");

        const { error } = await supabase
          .from("availability_blocks")
          .delete()
          .eq("id", blockToRemove.id);

        if (error) throw error;
        showToast("Date débloquée.", "success");
      } else {
        const { error } = await supabase.from("availability_blocks").insert({
          building_unit_id: buildingUnitId,
          date_debut: dateKey,
          date_fin: dateKey,
          raison: "bloque_manuellement",
        });

        if (error) throw error;
        showToast("Date bloquée.", "success");
      }

      await refreshBlocks();
    } catch (calendarError) {
      showToast(
        calendarError instanceof Error
          ? calendarError.message
          : "Impossible de mettre à jour la disponibilité.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
      <div className="card-surface p-6">
        <DayPicker
          mode="single"
          month={month}
          onMonthChange={setMonth}
          locale={fr}
          showOutsideDays
          modifiers={{
            unavailable: unavailableDates,
            reserved: dateKeysToDates(
              expandRangesToDateKeys(
                blocks.filter((block) => block.raison === "reserve")
              )
            ),
          }}
          modifiersClassNames={{
            unavailable: "day-blocked",
            reserved: "day-booked",
          }}
          onDayClick={handleDayClick}
          className="availability-calendar mx-auto"
        />
      </div>

      <aside className="space-y-6">
        <div className="card-surface p-5">
          <h2 className="font-display font-semibold text-ink">{unitLabel}</h2>
          <p className="mt-2 text-sm text-ink-muted">
            Cliquez sur une date future pour bloquer ou débloquer manuellement.
          </p>
        </div>
        <div className="card-surface p-5 text-sm text-ink-muted">
          <p>
            <strong>{unavailableKeys.size}</strong> nuit(s) indisponible(s)
          </p>
          {loading && <p className="mt-3 text-brand-700">Mise à jour...</p>}
        </div>
      </aside>
    </div>
  );
}
