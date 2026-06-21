"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { FormField, inputClassName } from "@/components/AuthForm";
import { useToast } from "@/components/ui/Toast";
import { getWilayaOptions } from "@/lib/wilayas";

type LocationPickerProps = {
  adresse: string;
  ville: string;
  latitude: number | null;
  longitude: number | null;
  onAdresseChange: (value: string) => void;
  onVilleChange: (value: string) => void;
  onCoordinatesChange: (latitude: number, longitude: number) => void;
};

const DEFAULT_CENTER: [number, number] = [36.7538, 3.0588];

const markerIcon = L.divIcon({
  className: "",
  html: `<span style="display:block;width:28px;height:28px;background:#2563eb;border:3px solid #fff;border-radius:50%;box-shadow:0 4px 12px rgba(15,23,42,.25)"></span>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

export default function LocationPicker({
  adresse,
  ville,
  latitude,
  longitude,
  onAdresseChange,
  onVilleChange,
  onCoordinatesChange,
}: LocationPickerProps) {
  const { showToast } = useToast();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const onCoordinatesChangeRef = useRef(onCoordinatesChange);
  const [searching, setSearching] = useState(false);

  onCoordinatesChangeRef.current = onCoordinatesChange;
  const initialCoordsRef = useRef({ latitude, longitude });

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) {
      return;
    }

    const { latitude: initialLat, longitude: initialLng } = initialCoordsRef.current;
    const initialCenter: [number, number] =
      initialLat !== null && initialLng !== null
        ? [initialLat, initialLng]
        : DEFAULT_CENTER;

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: initialLat !== null && initialLng !== null ? 15 : 6,
      scrollWheelZoom: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap",
      maxZoom: 19,
    }).addTo(map);

    const marker = L.marker(initialCenter, {
      draggable: true,
      icon: markerIcon,
    }).addTo(map);

    marker.on("dragend", () => {
      const { lat, lng } = marker.getLatLng();
      onCoordinatesChangeRef.current(
        Number(lat.toFixed(6)),
        Number(lng.toFixed(6))
      );
    });

    map.on("click", (event) => {
      marker.setLatLng(event.latlng);
      onCoordinatesChangeRef.current(
        Number(event.latlng.lat.toFixed(6)),
        Number(event.latlng.lng.toFixed(6))
      );
    });

    mapRef.current = map;
    markerRef.current = marker;

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (
      latitude === null ||
      longitude === null ||
      !mapRef.current ||
      !markerRef.current
    ) {
      return;
    }

    const nextPosition: [number, number] = [latitude, longitude];
    markerRef.current.setLatLng(nextPosition);
    mapRef.current.setView(nextPosition, Math.max(mapRef.current.getZoom(), 14));
  }, [latitude, longitude]);

  async function locateFromAddress() {
    if (!ville.trim()) {
      showToast("Sélectionnez une wilaya.", "error");
      return;
    }

    if (!adresse.trim()) {
      showToast("Renseignez l'adresse exacte.", "error");
      return;
    }

    const query = `${adresse.trim()}, ${ville.trim()}, Algérie`;

    setSearching(true);

    try {
      const response = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
      const data = (await response.json()) as {
        latitude?: number;
        longitude?: number;
        error?: string;
      };

      if (!response.ok || !data.latitude || !data.longitude) {
        throw new Error(data.error ?? "Adresse introuvable.");
      }

      onCoordinatesChange(data.latitude, data.longitude);
      showToast("Localisation trouvée. Ajustez le marqueur si besoin.", "success");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Impossible de localiser l'adresse.";
      showToast(message, "error");
    } finally {
      setSearching(false);
    }
  }

  const googlePreviewUrl =
    latitude !== null && longitude !== null
      ? `https://www.google.com/maps?q=${latitude},${longitude}&hl=fr&z=16&output=embed`
      : null;

  const wilayaOptions = getWilayaOptions(ville);

  return (
    <section className="card-surface space-y-4 p-6">
      <div>
        <h2 className="font-display text-lg font-semibold text-ink">
          Localisation exacte
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Choisissez la wilaya, indiquez l&apos;adresse exacte puis placez le
          marqueur. Les clients verront cette position sur Google Maps.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <FormField label="Wilaya" id="wilaya">
          <select
            id="wilaya"
            required
            value={ville}
            onChange={(event) => onVilleChange(event.target.value)}
            className={inputClassName}
          >
            <option value="">Sélectionner une wilaya</option>
            {wilayaOptions.map((wilaya) => (
              <option key={wilaya} value={wilaya}>
                {wilaya}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Adresse exacte" id="adresse">
          <input
            id="adresse"
            required
            value={adresse}
            onChange={(event) => onAdresseChange(event.target.value)}
            className={inputClassName}
            placeholder="Ex. Résidence Les Pins, bâtiment B, commune..."
          />
        </FormField>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={locateFromAddress}
          disabled={searching}
          className="btn-secondary px-4 py-2 text-sm"
        >
          {searching ? "Recherche..." : "Localiser l'adresse"}
        </button>

        {latitude !== null && longitude !== null && (
          <span className="text-sm text-slate-600">
            {latitude.toFixed(5)}, {longitude.toFixed(5)}
          </span>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200">
        <div ref={mapContainerRef} className="h-72 w-full" />
        <p className="bg-slate-50 px-4 py-2 text-xs text-slate-500">
          Cliquez sur la carte ou déplacez le marqueur pour affiner la position.
        </p>
      </div>

      {googlePreviewUrl && (
        <div className="overflow-hidden rounded-2xl border border-slate-200">
          <iframe
            title="Aperçu Google Maps"
            src={googlePreviewUrl}
            className="h-56 w-full"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
          <p className="bg-white px-4 py-2 text-xs text-slate-500">
            Aperçu tel que vu par le client sur le site.
          </p>
        </div>
      )}
    </section>
  );
}
