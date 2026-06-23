import type { PropertyStatus } from "./index";

export type Building = {
  id: string;
  titre: string;
  description: string;
  adresse: string;
  ville: string;
  latitude: number | null;
  longitude: number | null;
  statut: PropertyStatus;
  created_at: string;
  updated_at: string;
};

export type BuildingImage = {
  id: string;
  building_id: string;
  url: string;
  ordre: number;
};

export type BuildingUnit = {
  id: string;
  building_id: string;
  label: string;
  description: string;
  prix_nuit: number;
  capacite: number;
  statut: PropertyStatus;
  ordre: number;
  created_at: string;
  updated_at: string;
};

export type BuildingFormData = {
  titre: string;
  description: string;
  adresse: string;
  ville: string;
  latitude: number | null;
  longitude: number | null;
  statut: PropertyStatus;
  amenities: string[];
};

export type BuildingListItem = Building & {
  building_images: { url: string; ordre: number }[];
  building_units: { prix_nuit: number; statut: PropertyStatus }[];
};

export type BuildingWithUnits = Building & {
  building_images: BuildingImage[];
  building_amenities: { nom_equipement: string }[];
  building_units: BuildingUnit[];
};
