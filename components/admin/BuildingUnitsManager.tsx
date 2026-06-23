"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FormField, inputClassName } from "@/components/AuthForm";
import ConfirmModal from "@/components/admin/ConfirmModal";
import { useToast } from "@/components/ui/Toast";
import { formatPrice } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";
import type { BuildingUnit } from "@/types/building";
import type { PropertyStatus } from "@/types";

type BuildingUnitsManagerProps = {
  buildingId: string;
  initialUnits: BuildingUnit[];
};

const emptyUnit = {
  label: "",
  description: "",
  prix_nuit: 0,
  capacite: 2,
  statut: "inactif" as PropertyStatus,
};

export default function BuildingUnitsManager({
  buildingId,
  initialUnits,
}: BuildingUnitsManagerProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [units, setUnits] = useState(
    [...initialUnits].sort((a, b) => a.ordre - b.ordre)
  );
  const [form, setForm] = useState(emptyUnit);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  function resetForm() {
    setForm(emptyUnit);
    setEditingId(null);
  }

  async function saveUnit() {
    if (!form.label.trim()) {
      showToast("Indiquez un nom pour l'appartement.", "error");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const payload = {
      building_id: buildingId,
      label: form.label.trim(),
      description: form.description.trim(),
      prix_nuit: form.prix_nuit,
      capacite: form.capacite,
      statut: form.statut,
      ordre: editingId
        ? units.find((unit) => unit.id === editingId)?.ordre ?? units.length
        : units.length,
    };

    try {
      if (editingId) {
        const { error } = await supabase
          .from("building_units")
          .update(payload)
          .eq("id", editingId);
        if (error) throw error;
        showToast("Appartement mis à jour.", "success");
      } else {
        const { error } = await supabase.from("building_units").insert(payload);
        if (error) throw error;
        showToast("Appartement ajouté.", "success");
      }

      resetForm();
      router.refresh();
      const { data } = await supabase
        .from("building_units")
        .select("*")
        .eq("building_id", buildingId)
        .order("ordre", { ascending: true });
      setUnits((data ?? []) as BuildingUnit[]);
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Impossible d'enregistrer l'appartement.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }

  function startEdit(unit: BuildingUnit) {
    setEditingId(unit.id);
    setForm({
      label: unit.label,
      description: unit.description,
      prix_nuit: unit.prix_nuit,
      capacite: unit.capacite,
      statut: unit.statut,
    });
  }

  async function confirmDelete() {
    if (!deleteId) return;
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.from("building_units").delete().eq("id", deleteId);
    setLoading(false);
    setDeleteId(null);

    if (error) {
      showToast("Impossible de supprimer l'appartement.", "error");
      return;
    }

    showToast("Appartement supprimé.", "success");
    setUnits((current) => current.filter((unit) => unit.id !== deleteId));
    if (editingId === deleteId) resetForm();
    router.refresh();
  }

  return (
    <section className="card-surface space-y-6 p-6">
      <div>
        <h2 className="font-display text-lg font-semibold text-ink">Appartements</h2>
        <p className="mt-1 text-sm text-slate-600">
          Chaque appartement a son prix et son calendrier de disponibilité.
        </p>
      </div>

      {units.length === 0 ? (
        <p className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600">
          Aucun appartement. Ajoutez le premier ci-dessous.
        </p>
      ) : (
        <div className="space-y-3">
          {units.map((unit) => (
            <div
              key={unit.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-4"
            >
              <div>
                <p className="font-medium text-ink">{unit.label}</p>
                <p className="text-sm text-slate-600">
                  {formatPrice(unit.prix_nuit)} / nuit · {unit.capacite} pers.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    unit.statut === "actif"
                      ? "bg-brand-50 text-brand-700"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {unit.statut === "actif" ? "Actif" : "Inactif"}
                </span>
                <Link
                  href={`/admin/immeubles/${buildingId}/unites/${unit.id}/disponibilite`}
                  className="rounded-md bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200"
                >
                  Calendrier
                </Link>
                <button
                  type="button"
                  onClick={() => startEdit(unit)}
                  className="rounded-md bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700"
                >
                  Modifier
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteId(unit.id)}
                  className="rounded-md bg-red-100 px-3 py-1.5 text-xs font-medium text-red-700"
                >
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="border-t border-slate-100 pt-6">
        <h3 className="text-sm font-semibold text-ink">
          {editingId ? "Modifier l'appartement" : "Ajouter un appartement"}
        </h3>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <FormField label="Nom" id="unit-label">
            <input
              id="unit-label"
              value={form.label}
              onChange={(event) => setForm({ ...form, label: event.target.value })}
              className={inputClassName}
              placeholder="Ex. Appartement 1 — F3 étage 2"
            />
          </FormField>
          <FormField label="Prix / nuit (DA)" id="unit-prix">
            <input
              id="unit-prix"
              type="number"
              min="0"
              value={form.prix_nuit}
              onChange={(event) =>
                setForm({ ...form, prix_nuit: Number(event.target.value) })
              }
              className={inputClassName}
            />
          </FormField>
          <FormField label="Capacité" id="unit-capacite">
            <input
              id="unit-capacite"
              type="number"
              min="1"
              value={form.capacite}
              onChange={(event) =>
                setForm({ ...form, capacite: Number(event.target.value) })
              }
              className={inputClassName}
            />
          </FormField>
          <FormField label="Statut" id="unit-statut">
            <select
              id="unit-statut"
              value={form.statut}
              onChange={(event) =>
                setForm({ ...form, statut: event.target.value as PropertyStatus })
              }
              className={inputClassName}
            >
              <option value="actif">Actif</option>
              <option value="inactif">Inactif</option>
            </select>
          </FormField>
          <div className="md:col-span-2">
            <FormField label="Description (optionnel)" id="unit-description">
              <textarea
                id="unit-description"
                rows={3}
                value={form.description}
                onChange={(event) =>
                  setForm({ ...form, description: event.target.value })
                }
                className={inputClassName}
              />
            </FormField>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={loading}
            onClick={saveUnit}
            className="btn-primary px-4 py-2 text-sm"
          >
            {loading ? "Enregistrement..." : editingId ? "Mettre à jour" : "Ajouter"}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm} className="btn-secondary px-4 py-2 text-sm">
              Annuler
            </button>
          )}
        </div>
      </div>

      <ConfirmModal
        open={Boolean(deleteId)}
        title="Supprimer l'appartement"
        message="Cet appartement et ses réservations associées seront supprimés."
        confirmLabel="Supprimer"
        loading={loading}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </section>
  );
}
