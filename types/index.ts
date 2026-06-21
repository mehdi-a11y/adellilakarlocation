export type UserRole = "client" | "admin";

export type PropertyType = "villa" | "appartement";

export type PropertyStatus = "actif" | "inactif";

export type BookingStatus =
  | "en_attente"
  | "confirmee"
  | "annulee"
  | "terminee";

export type AvailabilityReason = "reserve" | "bloque_manuellement";
