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

type BuildingRowActionsProps = {
  buildingId: string;
  titre: string;
  statut: PropertyStatus;
  imageUrls: string[];
};

export default function BuildingRowActions({
  buildingId,
  titre,
  statut,
  imageUrls,
}: BuildingRowActionsProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [loading, setLoading] = useState(false);

  async function toggleStatus() {
    const supabase = createClient();
    const nextStatus: PropertyStatus = statut === "actif" ? "inactif" : "actif";

    const { error } = await supabase
      .from("buildings")
      .update({ statut: nextStatus })
      .eq("id", buildingId);

    if (error) {
      showToast("Impossible de modifier le statut.", "error");
      return;
    }

    showToast(nextStatus === "actif" ? "Immeuble activé." : "Immeuble désactivé.", "success");
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

    const { error } = await supabase.from("buildings").delete().eq("id", buildingId);

    setLoading(false);
    setShowDeleteModal(false);

    if (error) {
      showToast("Impossible de supprimer l'immeuble.", "error");
      return;
    }

    showToast("Immeuble supprimé.", "success");
    router.refresh();
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Link
          href={`/admin/immeubles/${buildingId}/modifier`}
          className="rounded-md bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-100"
        >
          Modifier
        </Link>
        <button
          type="button"
          onClick={toggleStatus}
          className="rounded-md bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200"
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
        title="Supprimer l'immeuble"
        message={`« ${titre} » et tous ses appartements seront supprimés définitivement.`}
        confirmLabel="Supprimer"
        loading={loading}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </>
  );
}
