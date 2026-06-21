import Link from "next/link";
import PropertyRowActions from "@/components/admin/PropertyRowActions";
import { formatPrice } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";
import type { PropertyListItem } from "@/types/property";

export default async function AdminPropertiesPage() {
  const supabase = await createClient();

  const { data: properties, error } = await supabase
    .from("properties")
    .select("*, property_images(url, ordre)")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const items = (properties ?? []) as PropertyListItem[];

  return (
    <main>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="heading-display text-3xl">Biens immobiliers</h1>
          <p className="mt-2 text-ink-muted">
            Gérez le catalogue de villas et appartements.
          </p>
        </div>
        <Link href="/admin/biens/nouveau" className="btn-primary">
          + Nouveau bien
        </Link>
      </div>

      <div className="card-surface mt-8 overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 font-medium">Titre</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Prix/nuit</th>
              <th className="px-4 py-3 font-medium">Ville</th>
              <th className="px-4 py-3 font-medium">Statut</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  Aucun bien pour le moment.{" "}
                  <Link href="/admin/biens/nouveau" className="text-brand-700 hover:underline">
                    Créer le premier bien
                  </Link>
                </td>
              </tr>
            ) : (
              items.map((property) => (
                <tr key={property.id} className="border-b border-slate-100">
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {property.titre}
                  </td>
                  <td className="px-4 py-3 capitalize text-slate-600">
                    {property.type}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {formatPrice(property.prix_nuit)}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{property.ville}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        property.statut === "actif"
                          ? "bg-brand-50 text-brand-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {property.statut === "actif" ? "Actif" : "Inactif"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <PropertyRowActions
                      propertyId={property.id}
                      titre={property.titre}
                      statut={property.statut}
                      imageUrls={property.property_images.map((image) => image.url)}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
