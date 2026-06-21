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
import type { BookingStatus } from "@/types";

type BookingRow = {
  id: string;
  date_debut: string;
  date_fin: string;
  statut: BookingStatus;
};

type BlockRow = {
  id: string;
  date_debut: string;
  date_fin: string;
  raison: "reserve" | "bloque_manuellement";
};

type AvailabilityCalendarProps = {
  propertyId: string;
  propertyTitle: string;
  initialBookings: BookingRow[];
  initialBlocks: BlockRow[];
};

export default function AvailabilityCalendar({
  propertyId,
  propertyTitle,
  initialBookings,
  initialBlocks,
}: AvailabilityCalendarProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [month, setMonth] = useState(new Date());
  const [bookings, setBookings] = useState(initialBookings);
  const [blocks, setBlocks] = useState(initialBlocks);
  const [loading, setLoading] = useState(false);

  const bookedDateKeys = useMemo(() => {
    const activeBookings = bookings.filter(
      (booking) => booking.statut !== "annulee"
    );
    return expandRangesToDateKeys(activeBookings);
  }, [bookings]);

  const manualBlockKeys = useMemo(() => {
    const manualBlocks = blocks.filter(
      (block) => block.raison === "bloque_manuellement"
    );
    return expandRangesToDateKeys(manualBlocks);
  }, [blocks]);

  const bookedDates = useMemo(
    () => dateKeysToDates(bookedDateKeys),
    [bookedDateKeys]
  );

  const blockedDates = useMemo(
    () => dateKeysToDates(manualBlockKeys),
    [manualBlockKeys]
  );

  async function refreshData() {
    const supabase = createClient();

    const [{ data: nextBookings }, { data: nextBlocks }] = await Promise.all([
      supabase
        .from("bookings")
        .select("id, date_debut, date_fin, statut")
        .eq("property_id", propertyId),
      supabase
        .from("availability_blocks")
        .select("id, date_debut, date_fin, raison")
        .eq("property_id", propertyId),
    ]);

    setBookings(nextBookings ?? []);
    setBlocks(nextBlocks ?? []);
    router.refresh();
  }

  async function handleDayClick(day: Date) {
    if (loading || isPastDate(day)) {
      return;
    }

    const dateKey = toDateKey(day);

    if (bookedDateKeys.has(dateKey)) {
      showToast("Cette date est déjà réservée.", "error");
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

        if (!blockToRemove) {
          throw new Error("Bloc introuvable.");
        }

        const { error } = await supabase
          .from("availability_blocks")
          .delete()
          .eq("id", blockToRemove.id);

        if (error) {
          throw error;
        }

        showToast("Date débloquée.", "success");
      } else {
        const { error } = await supabase.from("availability_blocks").insert({
          property_id: propertyId,
          date_debut: dateKey,
          date_fin: dateKey,
          raison: "bloque_manuellement",
        });

        if (error) {
          throw error;
        }

        showToast("Date bloquée manuellement.", "success");
      }

      await refreshData();
    } catch (calendarError) {
      const message =
        calendarError instanceof Error
          ? calendarError.message
          : "Impossible de mettre à jour la disponibilité.";
      showToast(message, "error");
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
            booked: bookedDates,
            blocked: blockedDates,
          }}
          modifiersClassNames={{
            booked: "day-booked",
            blocked: "day-blocked",
          }}
          onDayClick={handleDayClick}
          className="availability-calendar mx-auto"
        />
      </div>

      <aside className="space-y-6">
        <div className="card-surface p-5">
          <h2 className="font-display font-semibold text-ink">{propertyTitle}</h2>
          <p className="mt-2 text-sm text-ink-muted">
            Cliquez sur une date future pour la bloquer ou la débloquer.
          </p>
        </div>

        <div className="card-surface p-5">
          <h3 className="text-sm font-semibold text-ink">Légende</h3>
          <ul className="mt-3 space-y-2 text-sm text-ink-muted">
            <li className="flex items-center gap-2">
              <span className="inline-block h-4 w-4 rounded bg-red-500" />
              Réservé (booking)
            </li>
            <li className="flex items-center gap-2">
              <span className="inline-block h-4 w-4 rounded bg-slate-400" />
              Bloqué manuellement
            </li>
            <li className="flex items-center gap-2">
              <span className="inline-block h-4 w-4 rounded border border-slate-300 bg-white" />
              Disponible
            </li>
          </ul>
        </div>

        <div className="card-surface p-5 text-sm text-ink-muted">
          <p>
            <strong>{bookedDateKeys.size}</strong> nuit(s) réservée(s)
          </p>
          <p className="mt-1">
            <strong>{manualBlockKeys.size}</strong> nuit(s) bloquée(s) manuellement
          </p>
          {loading && <p className="mt-3 text-brand-700">Mise à jour...</p>}
        </div>
      </aside>
    </div>
  );
}
