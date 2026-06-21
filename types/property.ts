import type { PropertyStatus, PropertyType } from "./index";

export type Property = {
  id: string;
  titre: string;
  description: string;
  type: PropertyType;
  prix_nuit: number;
  capacite: number;
  piscine: boolean;
  distance_mer_metres: number | null;
  adresse: string;
  ville: string;
  latitude: number | null;
  longitude: number | null;
  statut: PropertyStatus;
  created_at: string;
  updated_at: string;
};

export type PropertyImage = {
  id: string;
  property_id: string;
  url: string;
  ordre: number;
};

export type PropertyFormData = {
  titre: string;
  description: string;
  type: PropertyType;
  prix_nuit: number;
  capacite: number;
  piscine: boolean;
  distance_mer_metres: number | null;
  adresse: string;
  ville: string;
  latitude: number | null;
  longitude: number | null;
  statut: PropertyStatus;
  amenities: string[];
};

export type PropertyListItem = Property & {
  property_images: { url: string; ordre: number }[];
};
