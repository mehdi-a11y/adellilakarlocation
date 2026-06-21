import type { UserRole } from "./index";

export type Profile = {
  id: string;
  nom: string;
  telephone: string | null;
  role: UserRole;
  created_at: string;
};
