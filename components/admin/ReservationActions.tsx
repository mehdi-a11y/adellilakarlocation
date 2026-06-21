"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/components/ui/Toast";
import { createClient } from "@/lib/supabase/client";
import type { BookingStatus } from "@/types";

type ReservationActionsProps = {
  requestId: string;
  propertyId: string;
  dateDebut: string;
  dateFin: string;
  statut: BookingStatus;
};

export default function ReservationActions({
  requestId,
  propertyId,
  dateDebut,
  dateFin,
  statut,
}: ReservationActionsProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  async function updateStatus(next: BookingStatus) {
    setLoading(true);
    const supabase = createClient();

    const { error } = await supabase
      .from("booking_requests")
      .update({ statut: next })
      .eq("id", requestId);

    if (error) {
      setLoading(false);
      showToast("Action impossible.", "error");
      return;
    }

    // À la confirmation, bloque les dates pour la disponibilité publique
    if (next === "confirmee") {
      await supabase.from("availability_blocks").insert({
        property_id: propertyId,
        date_debut: dateDebut,
        date_fin: dateFin,
        raison: "reserve",
      });
    }

    setLoading(false);
    showToast(
      next === "confirmee"
        ? "Réservation confirmée et dates bloquées."
        : next === "annulee"
          ? "Réservation refusée."
          : "Réservation marquée comme terminée.",
      "success"
    );
    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-2">
      {statut === "en_attente" && (
        <>
          <button
            type="button"
            disabled={loading}
            onClick={() => updateStatus("confirmee")}
            className="rounded-md bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-60"
          >
            Confirmer
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => updateStatus("annulee")}
            className="rounded-md bg-red-100 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-200 disabled:opacity-60"
          >
            Refuser
          </button>
        </>
      )}
      {statut === "confirmee" && (
        <button
          type="button"
          disabled={loading}
          onClick={() => updateStatus("terminee")}
          className="rounded-md bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200 disabled:opacity-60"
        >
          Marquer terminée
        </button>
      )}
    </div>
  );
}
