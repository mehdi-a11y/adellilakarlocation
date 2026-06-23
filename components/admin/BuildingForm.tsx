"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import LocationPicker from "@/components/admin/LocationPicker";
import { FormField, inputClassName } from "@/components/AuthForm";
import { useToast } from "@/components/ui/Toast";
import { BUILDING_STORAGE_PREFIX, PROPERTY_AMENITIES, STORAGE_BUCKET } from "@/lib/constants";
import { getStoragePathFromUrl } from "@/lib/storage";
import { createClient } from "@/lib/supabase/client";
import type { Building, BuildingFormData, BuildingImage } from "@/types/building";
import type { PropertyStatus } from "@/types";

type ExistingImage = BuildingImage & { markedForDeletion?: boolean };

type NewImage = {
  tempId: string;
  file: File;
  preview: string;
};

type BuildingFormProps = {
  mode: "create" | "edit";
  building?: Building;
  initialImages?: BuildingImage[];
  initialAmenities?: string[];
};

function generateId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

const defaultForm: BuildingFormData = {
  titre: "",
  description: "",
  adresse: "",
  ville: "",
  latitude: null,
  longitude: null,
  statut: "inactif",
  amenities: [],
};

export default function BuildingForm({
  mode,
  building,
  initialImages = [],
  initialAmenities = [],
}: BuildingFormProps) {
  const router = useRouter();
  const { showToast } = useToast();

  const [form, setForm] = useState<BuildingFormData>(() =>
    building
      ? {
          titre: building.titre,
          description: building.description,
          adresse: building.adresse,
          ville: building.ville,
          latitude: building.latitude,
          longitude: building.longitude,
          statut: building.statut,
          amenities: initialAmenities,
        }
      : { ...defaultForm, amenities: [] }
  );

  const [existingImages, setExistingImages] = useState<ExistingImage[]>(
    [...initialImages].sort((a, b) => a.ordre - b.ordre)
  );
  const [newImages, setNewImages] = useState<NewImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const visibleExistingImages = useMemo(
    () => existingImages.filter((image) => !image.markedForDeletion),
    [existingImages]
  );

  function updateForm<K extends keyof BuildingFormData>(
    key: K,
    value: BuildingFormData[K]
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function toggleAmenity(amenity: string) {
    setForm((current) => ({
      ...current,
      amenities: current.amenities.includes(amenity)
        ? current.amenities.filter((item) => item !== amenity)
        : [...current.amenities, amenity],
    }));
  }

  function handleFilesSelected(files: FileList | null) {
    if (!files?.length) return;
    try {
      const nextImages = Array.from(files).map((file) => ({
        tempId: generateId(),
        file,
        preview: URL.createObjectURL(file),
      }));
      setNewImages((current) => [...current, ...nextImages]);
    } catch {
      showToast("Impossible d'afficher l'aperçu de l'image.", "error");
    }
  }

  function removeNewImage(tempId: string) {
    setNewImages((current) => {
      const image = current.find((item) => item.tempId === tempId);
      if (image) URL.revokeObjectURL(image.preview);
      return current.filter((item) => item.tempId !== tempId);
    });
  }

  async function uploadImage(buildingId: string, file: File, ordre: number) {
    const supabase = createClient();
    const extension = file.name.split(".").pop() || "jpg";
    const path = `${BUILDING_STORAGE_PREFIX}/${buildingId}/${Date.now()}-${generateId()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(path, file, { upsert: false });

    if (uploadError) throw uploadError;

    const {
      data: { publicUrl },
    } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);

    const { error: insertError } = await supabase.from("building_images").insert({
      building_id: buildingId,
      url: publicUrl,
      ordre,
    });

    if (insertError) throw insertError;
  }

  async function syncAmenities(buildingId: string) {
    const supabase = createClient();
    await supabase.from("building_amenities").delete().eq("building_id", buildingId);

    if (form.amenities.length === 0) return;

    const { error } = await supabase.from("building_amenities").insert(
      form.amenities.map((nom_equipement) => ({
        building_id: buildingId,
        nom_equipement,
      }))
    );

    if (error) throw error;
  }

  async function saveBuilding(statut: PropertyStatus) {
    setError(null);

    if (!form.ville.trim()) {
      setError("Sélectionnez une wilaya.");
      showToast("Sélectionnez une wilaya.", "error");
      return;
    }

    if (!form.adresse.trim()) {
      setError("Renseignez l'adresse exacte.");
      showToast("Renseignez l'adresse exacte.", "error");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const payload = {
      titre: form.titre.trim(),
      description: form.description.trim(),
      adresse: form.adresse.trim(),
      ville: form.ville.trim(),
      latitude: form.latitude,
      longitude: form.longitude,
      statut,
    };

    try {
      let buildingId = building?.id;

      if (mode === "create") {
        const { data, error: insertError } = await supabase
          .from("buildings")
          .insert(payload)
          .select("id")
          .single();

        if (insertError || !data) {
          throw insertError ?? new Error("Impossible de créer l'immeuble.");
        }
        buildingId = data.id;
      } else if (buildingId) {
        const { error: updateError } = await supabase
          .from("buildings")
          .update(payload)
          .eq("id", buildingId);

        if (updateError) throw updateError;

        const deletedImages = existingImages.filter((image) => image.markedForDeletion);
        for (const image of deletedImages) {
          const path = getStoragePathFromUrl(image.url);
          if (path) await supabase.storage.from(STORAGE_BUCKET).remove([path]);
          await supabase.from("building_images").delete().eq("id", image.id);
        }

        const keptImages = existingImages.filter((image) => !image.markedForDeletion);
        for (let index = 0; index < keptImages.length; index += 1) {
          await supabase
            .from("building_images")
            .update({ ordre: index })
            .eq("id", keptImages[index].id);
        }
      }

      if (!buildingId) throw new Error("Identifiant de l'immeuble manquant.");

      const startOrder = existingImages.filter((image) => !image.markedForDeletion).length;
      for (let index = 0; index < newImages.length; index += 1) {
        await uploadImage(buildingId, newImages[index].file, startOrder + index);
      }

      await syncAmenities(buildingId);

      showToast(
        statut === "actif" ? "Immeuble publié." : "Immeuble enregistré comme brouillon.",
        "success"
      );

      if (mode === "create") {
        router.push(`/admin/immeubles/${buildingId}/modifier`);
      } else {
        router.push("/admin/immeubles");
      }
      router.refresh();
    } catch (submitError) {
      const message =
        submitError instanceof Error ? submitError.message : "Une erreur est survenue.";
      setError(message);
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      {error && (
        <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <LocationPicker
        adresse={form.adresse}
        ville={form.ville}
        latitude={form.latitude}
        longitude={form.longitude}
        onAdresseChange={(value) => updateForm("adresse", value)}
        onVilleChange={(value) => updateForm("ville", value)}
        onCoordinatesChange={(latitude, longitude) =>
          setForm((current) => ({ ...current, latitude, longitude }))
        }
      />

      <section className="card-surface grid gap-4 p-6">
        <FormField label="Titre de l'immeuble" id="titre">
          <input
            id="titre"
            required
            value={form.titre}
            onChange={(event) => updateForm("titre", event.target.value)}
            className={inputClassName}
            placeholder="Ex. Résidence Les Pins"
          />
        </FormField>

        <FormField label="Description" id="description">
          <textarea
            id="description"
            required
            rows={5}
            value={form.description}
            onChange={(event) => updateForm("description", event.target.value)}
            className={inputClassName}
          />
        </FormField>
      </section>

      <section className="card-surface p-6">
        <h2 className="font-display text-lg font-semibold text-ink">Photos</h2>
        <p className="mt-1 text-sm text-slate-600">
          Photos communes : façade, hall, espaces partagés…
        </p>

        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(event) => {
            handleFilesSelected(event.target.files);
            event.target.value = "";
          }}
          className="mt-4 block w-full text-sm text-slate-600"
        />

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleExistingImages.map((image) => (
            <div key={image.id} className="overflow-hidden rounded-lg border border-slate-200">
              <div className="relative h-40">
                <Image src={image.url} alt="Photo" fill className="object-cover" />
              </div>
              <div className="p-2">
                <button
                  type="button"
                  onClick={() =>
                    setExistingImages((current) =>
                      current.map((item) =>
                        item.id === image.id ? { ...item, markedForDeletion: true } : item
                      )
                    )
                  }
                  className="rounded bg-red-100 px-2 py-1 text-xs text-red-700"
                >
                  Retirer
                </button>
              </div>
            </div>
          ))}

          {newImages.map((image) => (
            <div
              key={image.tempId}
              className="overflow-hidden rounded-lg border border-dashed border-brand-300"
            >
              <div className="relative h-40">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image.preview} alt="Nouvelle" className="h-full w-full object-cover" />
              </div>
              <div className="p-2">
                <button
                  type="button"
                  onClick={() => removeNewImage(image.tempId)}
                  className="rounded bg-red-100 px-2 py-1 text-xs text-red-700"
                >
                  Retirer
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="card-surface p-6">
        <h2 className="font-display text-lg font-semibold text-ink">Équipements communs</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PROPERTY_AMENITIES.map((amenity) => (
            <label
              key={amenity}
              className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm"
            >
              <input
                type="checkbox"
                checked={form.amenities.includes(amenity)}
                onChange={() => toggleAmenity(amenity)}
              />
              {amenity}
            </label>
          ))}
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={loading}
          onClick={() => saveBuilding("actif")}
          className="btn-primary px-6"
        >
          {loading ? "Enregistrement..." : "Publier"}
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => saveBuilding("inactif")}
          className="btn-secondary px-6"
        >
          Enregistrer comme brouillon
        </button>
      </div>
    </div>
  );
}
