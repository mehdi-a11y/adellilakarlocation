import Link from "next/link";
import ReservationActions from "@/components/admin/ReservationActions";
import { formatPrice } from "@/lib/i18n";
import { isMissingRelationError } from "@/lib/supabase/errors";
import { createClient } from "@/lib/supabase/server";
import type { BookingStatus } from "@/types";
import type { BookingRequestWithProperty } from "@/types/booking";

const statusFilters: { value: string; label: string }[] = [
  { value: "", label: "Toutes" },
  { value: "en_attente", label: "En attente" },
  { value: "confirmee", label: "Confirmées" },
  { value: "annulee", label: "Annulées" },
  { value: "terminee", label: "Terminées" },
];

const statusStyles: Record<BookingStatus, string> = {
  en_attente: "bg-amber-100 text-amber-800",
  confirmee: "bg-brand-50 text-brand-700",
  annulee: "bg-red-100 text-red-700",
  terminee: "bg-slate-100 text-slate-600",
};

const statusLabels: Record<BookingStatus, string> = {
  en_attente: "En attente",
  confirmee: "Confirmée",
  annulee: "Annulée",
  terminee: "Terminée",
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default async function AdminReservationsPage({
  searchParams,
}: {
  searchParams: { statut?: string };
}) {
  const supabase = await createClient();

  const statusFilter =
    searchParams.statut &&
    ["en_attente", "confirmee", "annulee", "terminee"].includes(searchParams.statut)
      ? searchParams.statut
      : null;

  let query = supabase
    .from("booking_requests")
    .select(
      "*, properties(titre, ville), building_units(label, buildings(titre, ville))"
    )
    .order("created_at", { ascending: false });

  if (statusFilter) {
    query = query.eq("statut", statusFilter);
  }

  let { data, error } = await query;

  if (
    error &&
    (isMissingRelationError(error, "building_units") ||
      isMissingRelationError(error, "buildings"))
  ) {
    let fallbackQuery = supabase
      .from("booking_requests")
      .select("*, properties(titre, ville)")
      .order("created_at", { ascending: false });

    if (statusFilter) {
      fallbackQuery = fallbackQuery.eq("statut", statusFilter);
    }

    ({ data, error } = await fallbackQuery);
  }

  if (error) {
    throw new Error(error.message);
  }

  const requests = (data ?? []) as BookingRequestWithProperty[];

  return (
    <div>
      <h1 className="heading-display text-3xl">Réservations</h1>
      <p className="mt-2 text-ink-muted">
        Gérez les demandes de réservation envoyées par les visiteurs.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {statusFilters.map((filter) => {
          const isActive = (searchParams.statut ?? "") === filter.value;
          return (
            <Link
              key={filter.value}
              href={
                filter.value
                  ? `/admin/reservations?statut=${filter.value}`
                  : "/admin/reservations"
              }
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                isActive
                  ? "bg-brand-600 text-white"
                  : "bg-slate-100 text-ink-muted hover:bg-slate-200"
              }`}
            >
              {filter.label}
            </Link>
          );
        })}
      </div>

      {requests.length === 0 ? (
        <div className="card-surface mt-8 py-16 text-center text-ink-muted">
          Aucune demande de réservation pour ce filtre.
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {requests.map((request) => {
            const unitInfo = request.building_units;
            const propertyTitle = request.properties?.titre || unitInfo?.buildings?.titre || "Bien supprimé";
            const unitLabel = unitInfo?.label;
            const location = request.properties?.ville || unitInfo?.buildings?.ville;

            return (
            <div key={request.id} className="card-surface p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-display text-lg font-semibold text-ink">
                      {propertyTitle}
                      {unitLabel && (
                        <span className="font-normal text-ink-muted">
                          {" "}
                          — {unitLabel}
                        </span>
                      )}
                    </h2>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[request.statut]}`}
                    >
                      {statusLabels[request.statut]}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-ink-muted">{location}</p>
                </div>
                <p className="text-lg font-bold text-ink">
                  {formatPrice(request.prix_total)}
                </p>
              </div>

              <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="text-ink-muted">Client</p>
                  <p className="font-medium text-ink">{request.nom}</p>
                </div>
                <div>
                  <p className="text-ink-muted">Contact</p>
                  <p className="font-medium text-ink">{request.telephone}</p>
                  {request.email && (
                    <p className="text-ink-muted">{request.email}</p>
                  )}
                </div>
                <div>
                  <p className="text-ink-muted">Séjour</p>
                  <p className="font-medium text-ink">
                    {formatDate(request.date_debut)} → {formatDate(request.date_fin)}
                  </p>
                </div>
                <div>
                  <p className="text-ink-muted">Voyageurs</p>
                  <p className="font-medium text-ink">{request.nb_personnes}</p>
                </div>
              </div>

              {request.message && (
                <p className="mt-4 rounded-lg bg-slate-50 px-4 py-3 text-sm text-ink-soft">
                  « {request.message} »
                </p>
              )}

              <div className="mt-4 flex items-center justify-between gap-4">
                <p className="text-xs text-ink-muted">
                  Reçue le {formatDate(request.created_at)}
                </p>
                <ReservationActions
                  requestId={request.id}
                  propertyId={request.property_id}
                  buildingUnitId={request.building_unit_id}
                  dateDebut={request.date_debut}
                  dateFin={request.date_fin}
                  statut={request.statut}
                  clientName={request.nom}
                />
              </div>
            </div>
          );
          })}
        </div>
      )}
    </div>
  );
}
