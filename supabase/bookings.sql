-- ============================================================
-- Adel Immobilier — Demandes de réservation publiques (Étape 8)
-- Modèle "admin seulement" : les visiteurs envoient une demande
-- sans compte ; seuls les admins la gèrent.
-- Exécuter dans Supabase → SQL Editor
-- ============================================================

create table if not exists public.booking_requests (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  nom text not null,
  telephone text not null,
  email text,
  date_debut date not null,
  date_fin date not null,
  nb_personnes integer not null check (nb_personnes > 0),
  prix_total numeric(10, 2) not null default 0 check (prix_total >= 0),
  message text,
  statut public.booking_status not null default 'en_attente',
  created_at timestamptz not null default timezone('utc', now()),
  check (date_fin > date_debut)
);

create index if not exists booking_requests_property_id_idx
  on public.booking_requests (property_id);
create index if not exists booking_requests_statut_idx
  on public.booking_requests (statut);
create index if not exists booking_requests_created_at_idx
  on public.booking_requests (created_at desc);

alter table public.booking_requests enable row level security;

-- Tout le monde (visiteur anonyme) peut envoyer une demande
create policy "Demande de réservation publique"
on public.booking_requests for insert
with check (true);

-- Seul l'admin peut consulter / gérer les demandes
create policy "Admin consulte les demandes"
on public.booking_requests for select
using (public.is_admin());

create policy "Admin met à jour les demandes"
on public.booking_requests for update
using (public.is_admin())
with check (public.is_admin());

create policy "Admin supprime les demandes"
on public.booking_requests for delete
using (public.is_admin());

-- Libère automatiquement les dates réservées quand une demande est supprimée
create or replace function public.release_availability_on_booking_request_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.availability_blocks
  where property_id = old.property_id
    and raison = 'reserve'
    and date_debut <= old.date_fin
    and date_fin >= old.date_debut;

  return old;
end;
$$;

drop trigger if exists booking_requests_release_availability on public.booking_requests;

create trigger booking_requests_release_availability
before delete on public.booking_requests
for each row execute function public.release_availability_on_booking_request_delete();
