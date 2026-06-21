import type { BookingStatus } from "./index";

export type BookingRequest = {
  id: string;
  property_id: string;
  nom: string;
  telephone: string;
  email: string | null;
  date_debut: string;
  date_fin: string;
  nb_personnes: number;
  prix_total: number;
  message: string | null;
  statut: BookingStatus;
  created_at: string;
};

export type BookingRequestWithProperty = BookingRequest & {
  properties: { titre: string; ville: string } | null;
};
