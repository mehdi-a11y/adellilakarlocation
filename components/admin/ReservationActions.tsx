"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import ConfirmModal from "@/components/admin/ConfirmModal";
import { useToast } from "@/components/ui/Toast";
import { releaseReservationAvailability } from "@/lib/reservations";
import { createClient } from "@/lib/supabase/client";
import type { BookingStatus } from "@/types";

type ReservationActionsProps = {
  requestId: string;
  propertyId?: string | null;
  buildingUnitId?: string | null;
  dateDebut: string;
  dateFin: string;
  statut: BookingStatus;
  clientName: string;
};

export default function ReservationActions({
  requestId,
  propertyId,
  buildingUnitId,
  dateDebut,
  dateFin,
  statut,
  clientName,
}: ReservationActionsProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

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

    if (next === "confirmee") {
      if (buildingUnitId) {
        await supabase.from("availability_blocks").insert({
          building_unit_id: buildingUnitId,
          property_id: null,
          date_debut: dateDebut,
          date_fin: dateFin,
          raison: "reserve",
        });
      } else if (propertyId) {
        await supabase.from("availability_blocks").insert({
          property_id: propertyId,
          building_unit_id: null,
          date_debut: dateDebut,
          date_fin: dateFin,
          raison: "reserve",
        });
      }
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

  async function handleDelete() {
    setLoading(true);
    const supabase = createClient();

    const { error: blockError, released } = await releaseReservationAvailability(
      supabase,
      { propertyId, buildingUnitId, dateDebut, dateFin }
    );

    if (blockError) {
      setLoading(false);
      showToast("Impossible de libérer les dates.", "error");
      return;
    }

    const { error } = await supabase
      .from("booking_requests")
      .delete()
      .eq("id", requestId);

    setLoading(false);
    setShowDeleteModal(false);

    if (error) {
      showToast("Impossible de supprimer la réservation.", "error");
      return;
    }

    showToast(
      released > 0
        ? "Réservation supprimée et dates libérées."
        : "Réservation supprimée.",
      "success"
    );
    router.refresh();
  }

  const hadBlockedDates = statut === "confirmee" || statut === "terminee";

  const deleteMessage = hadBlockedDates
    ? `La réservation de ${clientName} sera supprimée et les dates indisponibles redeviendront disponibles sur le calendrier public.`
    : `La réservation de ${clientName} sera supprimée définitivement.`;

  return (
    <>
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
        <button
          type="button"
          disabled={loading}
          onClick={() => setShowDeleteModal(true)}
          className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
        >
          Supprimer
        </button>
      </div>

      <ConfirmModal
        open={showDeleteModal}
        title="Supprimer la réservation"
        message={deleteMessage}
        confirmLabel="Supprimer"
        loading={loading}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </>
  );
}
