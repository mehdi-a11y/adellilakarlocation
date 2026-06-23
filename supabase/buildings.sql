-- ============================================================
-- Adel Immobilier — Immeubles & appartements
-- Exécuter dans Supabase → SQL Editor (safe à relancer)
-- ============================================================

create table if not exists public.buildings (
  id uuid primary key default gen_random_uuid(),
  titre text not null,
  description text not null default '',
  adresse text not null,
  ville text not null,
  latitude numeric(10, 7),
  longitude numeric(10, 7),
  statut public.property_status not null default 'inactif',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists buildings_updated_at on public.buildings;
create trigger buildings_updated_at
before update on public.buildings
for each row execute function public.handle_updated_at();

create index if not exists buildings_statut_idx on public.buildings (statut);
create index if not exists buildings_ville_idx on public.buildings (ville);

create table if not exists public.building_images (
  id uuid primary key default gen_random_uuid(),
  building_id uuid not null references public.buildings (id) on delete cascade,
  url text not null,
  ordre integer not null default 0 check (ordre >= 0)
);

create index if not exists building_images_building_id_idx
  on public.building_images (building_id);

create table if not exists public.building_amenities (
  id uuid primary key default gen_random_uuid(),
  building_id uuid not null references public.buildings (id) on delete cascade,
  nom_equipement text not null,
  unique (building_id, nom_equipement)
);

create index if not exists building_amenities_building_id_idx
  on public.building_amenities (building_id);

create table if not exists public.building_units (
  id uuid primary key default gen_random_uuid(),
  building_id uuid not null references public.buildings (id) on delete cascade,
  label text not null,
  description text not null default '',
  prix_nuit numeric(10, 2) not null check (prix_nuit >= 0),
  capacite integer not null check (capacite > 0),
  statut public.property_status not null default 'inactif',
  ordre integer not null default 0 check (ordre >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists building_units_updated_at on public.building_units;
create trigger building_units_updated_at
before update on public.building_units
for each row execute function public.handle_updated_at();

create index if not exists building_units_building_id_idx
  on public.building_units (building_id, ordre);

-- Étendre availability_blocks et booking_requests
alter table public.availability_blocks
  add column if not exists building_unit_id uuid references public.building_units (id) on delete cascade;

alter table public.availability_blocks
  alter column property_id drop not null;

alter table public.booking_requests
  add column if not exists building_unit_id uuid references public.building_units (id) on delete cascade;

alter table public.booking_requests
  alter column property_id drop not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'availability_target_check'
  ) then
    alter table public.availability_blocks
      add constraint availability_target_check check (
        (property_id is not null and building_unit_id is null)
        or (property_id is null and building_unit_id is not null)
      );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'booking_request_target_check'
  ) then
    alter table public.booking_requests
      add constraint booking_request_target_check check (
        (property_id is not null and building_unit_id is null)
        or (property_id is null and building_unit_id is not null)
      );
  end if;
end $$;

create index if not exists availability_blocks_unit_dates_idx
  on public.availability_blocks (building_unit_id, date_debut, date_fin);

create index if not exists booking_requests_building_unit_id_idx
  on public.booking_requests (building_unit_id);

-- RLS
alter table public.buildings enable row level security;
alter table public.building_images enable row level security;
alter table public.building_amenities enable row level security;
alter table public.building_units enable row level security;

drop policy if exists "Immeubles actifs visibles par tous" on public.buildings;
drop policy if exists "Admin gère les immeubles" on public.buildings;
drop policy if exists "Images immeuble visibles si actif" on public.building_images;
drop policy if exists "Admin gère images immeuble" on public.building_images;
drop policy if exists "Équipements immeuble visibles si actif" on public.building_amenities;
drop policy if exists "Admin gère équipements immeuble" on public.building_amenities;
drop policy if exists "Apparts visibles si immeuble actif" on public.building_units;
drop policy if exists "Admin gère les appartements" on public.building_units;

create policy "Immeubles actifs visibles par tous"
on public.buildings for select
using (statut = 'actif' or public.is_admin());

create policy "Admin gère les immeubles"
on public.buildings for all
using (public.is_admin())
with check (public.is_admin());

create policy "Images immeuble visibles si actif"
on public.building_images for select
using (
  exists (
    select 1 from public.buildings b
    where b.id = building_id
      and (b.statut = 'actif' or public.is_admin())
  )
);

create policy "Admin gère images immeuble"
on public.building_images for all
using (public.is_admin())
with check (public.is_admin());

create policy "Équipements immeuble visibles si actif"
on public.building_amenities for select
using (
  exists (
    select 1 from public.buildings b
    where b.id = building_id
      and (b.statut = 'actif' or public.is_admin())
  )
);

create policy "Admin gère équipements immeuble"
on public.building_amenities for all
using (public.is_admin())
with check (public.is_admin());

create policy "Apparts visibles si immeuble actif"
on public.building_units for select
using (
  exists (
    select 1 from public.buildings b
    where b.id = building_id
      and (b.statut = 'actif' or public.is_admin())
  )
  and (statut = 'actif' or public.is_admin())
);

create policy "Admin gère les appartements"
on public.building_units for all
using (public.is_admin())
with check (public.is_admin());

-- Trigger libération dates (property OU appartement)
create or replace function public.release_availability_on_booking_request_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.availability_blocks
  where raison = 'reserve'
    and date_debut <= old.date_fin
    and date_fin >= old.date_debut
    and (
      (old.building_unit_id is not null and building_unit_id = old.building_unit_id)
      or (old.property_id is not null and property_id = old.property_id)
    );

  return old;
end;
$$;

drop trigger if exists booking_requests_release_availability on public.booking_requests;

create trigger booking_requests_release_availability
before delete on public.booking_requests
for each row execute function public.release_availability_on_booking_request_delete();
