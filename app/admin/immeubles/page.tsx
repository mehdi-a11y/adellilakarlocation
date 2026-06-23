import Link from "next/link";
import BuildingRowActions from "@/components/admin/BuildingRowActions";
import { formatPrice } from "@/lib/i18n";
import {
  getActiveUnitCount,
  getBuildingMinPrice,
} from "@/lib/queries/buildings";
import { createClient } from "@/lib/supabase/server";
import type { BuildingListItem } from "@/types/building";

export default async function AdminBuildingsPage() {
  const supabase = await createClient();

  const { data: buildings, error } = await supabase
    .from("buildings")
    .select("*, building_images(url, ordre), building_units(prix_nuit, statut)")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const items = (buildings ?? []) as BuildingListItem[];

  return (
    <main>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="heading-display text-3xl">Immeubles</h1>
          <p className="mt-2 text-ink-muted">
            Gérez les résidences et leurs appartements.
          </p>
        </div>
        <Link href="/admin/immeubles/nouveau" className="btn-primary">
          + Nouvel immeuble
        </Link>
      </div>

      <div className="card-surface mt-8 overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 font-medium">Titre</th>
              <th className="px-4 py-3 font-medium">Appartements</th>
              <th className="px-4 py-3 font-medium">À partir de</th>
              <th className="px-4 py-3 font-medium">Wilaya</th>
              <th className="px-4 py-3 font-medium">Statut</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  Aucun immeuble.{" "}
                  <Link href="/admin/immeubles/nouveau" className="text-brand-700 hover:underline">
                    Créer le premier
                  </Link>
                </td>
              </tr>
            ) : (
              items.map((building) => {
                const minPrice = getBuildingMinPrice(building.building_units ?? []);
                const unitCount = getActiveUnitCount(building.building_units ?? []);

                return (
                  <tr key={building.id} className="border-b border-slate-100">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {building.titre}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {unitCount} actif(s) / {(building.building_units ?? []).length} total
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {minPrice !== null ? formatPrice(minPrice) : "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{building.ville}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          building.statut === "actif"
                            ? "bg-brand-50 text-brand-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {building.statut === "actif" ? "Actif" : "Inactif"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <BuildingRowActions
                        buildingId={building.id}
                        titre={building.titre}
                        statut={building.statut}
                        imageUrls={(building.building_images ?? []).map((image) => image.url)}
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
