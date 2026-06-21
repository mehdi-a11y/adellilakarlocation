"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import ConfirmModal from "@/components/admin/ConfirmModal";
import { useToast } from "@/components/ui/Toast";
import { STORAGE_BUCKET } from "@/lib/constants";
import { getStoragePathFromUrl } from "@/lib/storage";
import { createClient } from "@/lib/supabase/client";
import type { PropertyStatus } from "@/types";

type PropertyRowActionsProps = {
  propertyId: string;
  titre: string;
  statut: PropertyStatus;
  imageUrls: string[];
};

export default function PropertyRowActions({
  propertyId,
  titre,
  statut,
  imageUrls,
}: PropertyRowActionsProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [loading, setLoading] = useState(false);

  async function toggleStatus() {
    const supabase = createClient();
    const nextStatus: PropertyStatus = statut === "actif" ? "inactif" : "actif";

    const { error } = await supabase
      .from("properties")
      .update({ statut: nextStatus })
      .eq("id", propertyId);

    if (error) {
      showToast("Impossible de modifier le statut.", "error");
      return;
    }

    showToast(
      nextStatus === "actif" ? "Bien activé." : "Bien désactivé.",
      "success"
    );
    router.refresh();
  }

  async function handleDelete() {
    setLoading(true);
    const supabase = createClient();

    const paths = imageUrls
      .map((url) => getStoragePathFromUrl(url))
      .filter((path): path is string => Boolean(path));

    if (paths.length > 0) {
      await supabase.storage.from(STORAGE_BUCKET).remove(paths);
    }

    const { error } = await supabase
      .from("properties")
      .delete()
      .eq("id", propertyId);

    setLoading(false);
    setShowDeleteModal(false);

    if (error) {
      showToast("Impossible de supprimer le bien.", "error");
      return;
    }

    showToast("Bien supprimé.", "success");
    router.refresh();
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Link
          href={`/admin/biens/${propertyId}/disponibilite`}
          className="rounded-md bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-100"
        >
          Calendrier
        </Link>
        <Link
          href={`/admin/biens/${propertyId}/modifier`}
          className="rounded-md bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200"
        >
          Modifier
        </Link>
        <button
          type="button"
          onClick={toggleStatus}
          className="rounded-md bg-amber-100 px-3 py-1.5 text-xs font-medium text-amber-800 hover:bg-amber-200"
        >
          {statut === "actif" ? "Désactiver" : "Activer"}
        </button>
        <button
          type="button"
          onClick={() => setShowDeleteModal(true)}
          className="rounded-md bg-red-100 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-200"
        >
          Supprimer
        </button>
      </div>

      <ConfirmModal
        open={showDeleteModal}
        title="Supprimer ce bien ?"
        message={`Êtes-vous sûr de vouloir supprimer « ${titre} » ? Cette action est irréversible.`}
        confirmLabel="Supprimer"
        loading={loading}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </>
  );
}
