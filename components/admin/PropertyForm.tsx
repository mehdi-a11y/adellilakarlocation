"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { FormField, inputClassName } from "@/components/AuthForm";
import LocationPicker from "@/components/admin/LocationPicker";
import { useToast } from "@/components/ui/Toast";
import { PROPERTY_AMENITIES, STORAGE_BUCKET } from "@/lib/constants";
import { getStoragePathFromUrl } from "@/lib/storage";
import { createClient } from "@/lib/supabase/client";
import type { Property, PropertyFormData, PropertyImage } from "@/types/property";
import type { PropertyStatus, PropertyType } from "@/types";

type ExistingImage = PropertyImage & { markedForDeletion?: boolean };

type NewImage = {
  tempId: string;
  file: File;
  preview: string;
};

type PropertyFormProps = {
  mode: "create" | "edit";
  property?: Property;
  initialImages?: PropertyImage[];
  initialAmenities?: string[];
};

function generateId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

const defaultForm: PropertyFormData = {
  titre: "",
  description: "",
  type: "villa",
  prix_nuit: 0,
  capacite: 2,
  piscine: false,
  distance_mer_metres: null,
  adresse: "",
  ville: "",
  latitude: null,
  longitude: null,
  statut: "inactif",
  amenities: [],
};

export default function PropertyForm({
  mode,
  property,
  initialImages = [],
  initialAmenities = [],
}: PropertyFormProps) {
  const router = useRouter();
  const { showToast } = useToast();

  const [form, setForm] = useState<PropertyFormData>(() =>
    property
      ? {
          titre: property.titre,
          description: property.description,
          type: property.type,
          prix_nuit: property.prix_nuit,
          capacite: property.capacite,
          piscine: property.piscine,
          distance_mer_metres: property.distance_mer_metres,
          adresse: property.adresse,
          ville: property.ville,
          latitude: property.latitude,
          longitude: property.longitude,
          statut: property.statut,
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

  function updateForm<K extends keyof PropertyFormData>(
    key: K,
    value: PropertyFormData[K]
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
    if (!files?.length) {
      return;
    }

    try {
      const nextImages = Array.from(files).map((file) => ({
        tempId: generateId(),
        file,
        preview: URL.createObjectURL(file),
      }));

      setNewImages((current) => [...current, ...nextImages]);
    } catch (fileError) {
      const message =
        fileError instanceof Error
          ? fileError.message
          : "Impossible d'afficher l'aperçu de l'image.";
      showToast(message, "error");
    }
  }

  function moveExistingImage(index: number, direction: -1 | 1) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= visibleExistingImages.length) {
      return;
    }

    setExistingImages((current) => {
      const visible = current.filter((image) => !image.markedForDeletion);
      const hidden = current.filter((image) => image.markedForDeletion);
      const reordered = [...visible];
      const [moved] = reordered.splice(index, 1);
      reordered.splice(targetIndex, 0, moved);
      return [...reordered, ...hidden];
    });
  }

  function moveNewImage(index: number, direction: -1 | 1) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= newImages.length) {
      return;
    }

    setNewImages((current) => {
      const reordered = [...current];
      const [moved] = reordered.splice(index, 1);
      reordered.splice(targetIndex, 0, moved);
      return reordered;
    });
  }

  function removeExistingImage(id: string) {
    setExistingImages((current) =>
      current.map((image) =>
        image.id === id ? { ...image, markedForDeletion: true } : image
      )
    );
  }

  function removeNewImage(tempId: string) {
    setNewImages((current) => {
      const image = current.find((item) => item.tempId === tempId);
      if (image) {
        URL.revokeObjectURL(image.preview);
      }
      return current.filter((item) => item.tempId !== tempId);
    });
  }

  async function uploadImage(propertyId: string, file: File, ordre: number) {
    const supabase = createClient();
    const extension = file.name.split(".").pop() || "jpg";
    const path = `${propertyId}/${Date.now()}-${generateId()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(path, file, { upsert: false });

    if (uploadError) {
      throw uploadError;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);

    const { error: insertError } = await supabase.from("property_images").insert({
      property_id: propertyId,
      url: publicUrl,
      ordre,
    });

    if (insertError) {
      throw insertError;
    }
  }

  async function syncAmenities(propertyId: string) {
    const supabase = createClient();

    await supabase.from("property_amenities").delete().eq("property_id", propertyId);

    if (form.amenities.length === 0) {
      return;
    }

    const { error } = await supabase.from("property_amenities").insert(
      form.amenities.map((nom_equipement) => ({
        property_id: propertyId,
        nom_equipement,
      }))
    );

    if (error) {
      throw error;
    }
  }

  async function saveProperty(statut: PropertyStatus) {
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
      type: form.type,
      prix_nuit: form.prix_nuit,
      capacite: form.capacite,
      piscine: form.piscine,
      distance_mer_metres: form.distance_mer_metres,
      adresse: form.adresse.trim(),
      ville: form.ville.trim(),
      latitude: form.latitude,
      longitude: form.longitude,
      statut,
    };

    try {
      let propertyId = property?.id;

      if (mode === "create") {
        const { data, error: insertError } = await supabase
          .from("properties")
          .insert(payload)
          .select("id")
          .single();

        if (insertError || !data) {
          throw insertError ?? new Error("Impossible de créer le bien.");
        }

        propertyId = data.id;
      } else if (propertyId) {
        const { error: updateError } = await supabase
          .from("properties")
          .update(payload)
          .eq("id", propertyId);

        if (updateError) {
          throw updateError;
        }

        const deletedImages = existingImages.filter(
          (image) => image.markedForDeletion
        );

        for (const image of deletedImages) {
          const path = getStoragePathFromUrl(image.url);
          if (path) {
            await supabase.storage.from(STORAGE_BUCKET).remove([path]);
          }
          await supabase.from("property_images").delete().eq("id", image.id);
        }

        const keptImages = existingImages.filter(
          (image) => !image.markedForDeletion
        );

        for (let index = 0; index < keptImages.length; index += 1) {
          await supabase
            .from("property_images")
            .update({ ordre: index })
            .eq("id", keptImages[index].id);
        }
      }

      if (!propertyId) {
        throw new Error("Identifiant du bien manquant.");
      }

      const startOrder = existingImages.filter(
        (image) => !image.markedForDeletion
      ).length;

      for (let index = 0; index < newImages.length; index += 1) {
        await uploadImage(propertyId, newImages[index].file, startOrder + index);
      }

      await syncAmenities(propertyId);

      showToast(
        statut === "actif"
          ? "Bien publié avec succès."
          : "Bien enregistré comme brouillon.",
        "success"
      );
      router.push("/admin/biens");
      router.refresh();
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : "Une erreur est survenue.";
      setError(message);
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  }

  function updateCoordinates(latitude: number, longitude: number) {
    setForm((current) => ({ ...current, latitude, longitude }));
  }

  return (
    <div className="space-y-8">
      {error && (
        <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <LocationPicker
        adresse={form.adresse}
        ville={form.ville}
        latitude={form.latitude}
        longitude={form.longitude}
        onAdresseChange={(value) => updateForm("adresse", value)}
        onVilleChange={(value) => updateForm("ville", value)}
        onCoordinatesChange={updateCoordinates}
      />

      <section className="card-surface grid gap-4 p-6 md:grid-cols-2">
        <div className="md:col-span-2">
          <FormField label="Titre" id="titre">
            <input
              id="titre"
              required
              value={form.titre}
              onChange={(event) => updateForm("titre", event.target.value)}
              className={inputClassName}
            />
          </FormField>
        </div>

        <div className="md:col-span-2">
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
        </div>

        <FormField label="Type" id="type">
          <select
            id="type"
            value={form.type}
            onChange={(event) =>
              updateForm("type", event.target.value as PropertyType)
            }
            className={inputClassName}
          >
            <option value="villa">Villa</option>
            <option value="appartement">Appartement</option>
          </select>
        </FormField>

        <FormField label="Prix par nuit (DA)" id="prix_nuit">
          <input
            id="prix_nuit"
            type="number"
            min="0"
            step="0.01"
            required
            value={form.prix_nuit}
            onChange={(event) =>
              updateForm("prix_nuit", Number(event.target.value))
            }
            className={inputClassName}
          />
        </FormField>

        <FormField label="Capacité (personnes)" id="capacite">
          <input
            id="capacite"
            type="number"
            min="1"
            required
            value={form.capacite}
            onChange={(event) =>
              updateForm("capacite", Number(event.target.value))
            }
            className={inputClassName}
          />
        </FormField>

        <FormField label="Distance de la mer (mètres)" id="distance_mer">
          <input
            id="distance_mer"
            type="number"
            min="0"
            value={form.distance_mer_metres ?? ""}
            onChange={(event) =>
              updateForm(
                "distance_mer_metres",
                event.target.value ? Number(event.target.value) : null
              )
            }
            className={inputClassName}
          />
        </FormField>

        <label className="flex items-center gap-2 text-sm text-slate-700 md:col-span-2">
          <input
            type="checkbox"
            checked={form.piscine}
            onChange={(event) => updateForm("piscine", event.target.checked)}
            className="rounded border-slate-300"
          />
          Piscine
        </label>
      </section>

      <section className="card-surface p-6">
        <h2 className="font-display text-lg font-semibold text-ink">Photos</h2>
        <p className="mt-1 text-sm text-slate-600">
          Ajoutez plusieurs images et réordonnez-les.
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
          {visibleExistingImages.map((image, index) => (
            <div
              key={image.id}
              className="overflow-hidden rounded-lg border border-slate-200"
            >
              <div className="relative h-40">
                <Image
                  src={image.url}
                  alt="Photo du bien"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex items-center justify-between gap-2 p-2">
                <span className="text-xs text-slate-500">#{index + 1}</span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => moveExistingImage(index, -1)}
                    className="rounded bg-slate-100 px-2 py-1 text-xs"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveExistingImage(index, 1)}
                    className="rounded bg-slate-100 px-2 py-1 text-xs"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => removeExistingImage(image.id)}
                    className="rounded bg-red-100 px-2 py-1 text-xs text-red-700"
                  >
                    Retirer
                  </button>
                </div>
              </div>
            </div>
          ))}

          {newImages.map((image, index) => (
            <div
              key={image.tempId}
              className="overflow-hidden rounded-lg border border-dashed border-brand-300"
            >
              <div className="relative h-40">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.preview}
                  alt="Nouvelle photo"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex items-center justify-between gap-2 p-2">
                <span className="text-xs font-medium text-brand-700">Nouvelle</span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => moveNewImage(index, -1)}
                    className="rounded bg-slate-100 px-2 py-1 text-xs"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveNewImage(index, 1)}
                    className="rounded bg-slate-100 px-2 py-1 text-xs"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => removeNewImage(image.tempId)}
                    className="rounded bg-red-100 px-2 py-1 text-xs text-red-700"
                  >
                    Retirer
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="card-surface p-6">
        <h2 className="font-display text-lg font-semibold text-ink">Équipements</h2>
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
          onClick={() => saveProperty("actif")}
          className="btn-primary px-6"
        >
          {loading ? "Enregistrement..." : "Publier"}
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => saveProperty("inactif")}
          className="btn-secondary px-6"
        >
          Enregistrer comme brouillon
        </button>
      </div>
    </div>
  );
}
