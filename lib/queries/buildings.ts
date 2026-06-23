export const BUILDING_LIST_SELECT =
  "id, titre, ville, adresse, statut, created_at, building_images(url, ordre), building_units(prix_nuit, statut)";

export const BUILDING_CARD_SELECT = BUILDING_LIST_SELECT;

export const BUILDING_DETAIL_SELECT =
  "id, titre, description, adresse, ville, latitude, longitude, statut, created_at, updated_at";

export function getBuildingMinPrice(
  units: { prix_nuit: number; statut: string }[]
) {
  const active = units.filter((unit) => unit.statut === "actif");
  if (!active.length) return null;
  return Math.min(...active.map((unit) => unit.prix_nuit));
}

export function getActiveUnitCount(
  units: { statut: string }[]
) {
  return units.filter((unit) => unit.statut === "actif").length;
}
