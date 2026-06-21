-- ============================================================
-- Adel Immobilier — Schéma initial (Étape 2)
-- Exécuter dans Supabase → SQL Editor → New query → Run
-- ============================================================

-- Extensions
create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- Types énumérés
-- ------------------------------------------------------------
create type public.user_role as enum ('client', 'admin');
create type public.property_type as enum ('villa', 'appartement');
create type public.property_status as enum ('actif', 'inactif');
create type public.booking_status as enum (
  'en_attente',
  'confirmee',
  'annulee',
  'terminee'
);
create type public.availability_reason as enum ('reserve', 'bloque_manuellement');

-- ------------------------------------------------------------
-- Fonction utilitaire (sans dépendance aux tables)
-- ------------------------------------------------------------
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

-- ------------------------------------------------------------
-- Table : profiles
-- ------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nom text not null default '',
  telephone text,
  role public.user_role not null default 'client',
  created_at timestamptz not null default timezone('utc', now())
);

-- Fonctions qui dépendent de la table profiles (après sa création)
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

-- Crée automatiquement un profil client à l'inscription
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nom, telephone, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nom', ''),
    coalesce(new.raw_user_meta_data ->> 'telephone', ''),
    'client'
  );
  return new;
end;
$$;

-- ------------------------------------------------------------
-- Table : properties
-- ------------------------------------------------------------
create table public.properties (
  id uuid primary key default gen_random_uuid(),
  titre text not null,
  description text not null default '',
  type public.property_type not null,
  prix_nuit numeric(10, 2) not null check (prix_nuit >= 0),
  capacite integer not null check (capacite > 0),
  piscine boolean not null default false,
  distance_mer_metres integer check (distance_mer_metres is null or distance_mer_metres >= 0),
  adresse text not null,
  ville text not null,
  latitude numeric(10, 7),
  longitude numeric(10, 7),
  statut public.property_status not null default 'inactif',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger properties_updated_at
before update on public.properties
for each row execute function public.handle_updated_at();

create index properties_statut_idx on public.properties (statut);
create index properties_ville_idx on public.properties (ville);
create index properties_type_idx on public.properties (type);
create index properties_prix_nuit_idx on public.properties (prix_nuit);

-- ------------------------------------------------------------
-- Table : property_images
-- ------------------------------------------------------------
create table public.property_images (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  url text not null,
  ordre integer not null default 0 check (ordre >= 0)
);

create index property_images_property_id_idx on public.property_images (property_id);
create index property_images_ordre_idx on public.property_images (property_id, ordre);

-- ------------------------------------------------------------
-- Table : property_amenities
-- ------------------------------------------------------------
create table public.property_amenities (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  nom_equipement text not null,
  unique (property_id, nom_equipement)
);

create index property_amenities_property_id_idx on public.property_amenities (property_id);

-- ------------------------------------------------------------
-- Table : availability_blocks
-- ------------------------------------------------------------
create table public.availability_blocks (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  date_debut date not null,
  date_fin date not null,
  raison public.availability_reason not null default 'bloque_manuellement',
  check (date_fin >= date_debut)
);

create index availability_blocks_property_id_idx on public.availability_blocks (property_id);
create index availability_blocks_dates_idx on public.availability_blocks (property_id, date_debut, date_fin);

-- ------------------------------------------------------------
-- Table : bookings
-- ------------------------------------------------------------
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete restrict,
  user_id uuid not null references public.profiles (id) on delete cascade,
  date_debut date not null,
  date_fin date not null,
  nb_personnes integer not null check (nb_personnes > 0),
  prix_total numeric(10, 2) not null check (prix_total >= 0),
  statut public.booking_status not null default 'en_attente',
  created_at timestamptz not null default timezone('utc', now()),
  check (date_fin > date_debut)
);

create index bookings_property_id_idx on public.bookings (property_id);
create index bookings_user_id_idx on public.bookings (user_id);
create index bookings_statut_idx on public.bookings (statut);
create index bookings_dates_idx on public.bookings (property_id, date_debut, date_fin);

-- ------------------------------------------------------------
-- Table : reviews
-- ------------------------------------------------------------
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  note integer not null check (note between 1 and 5),
  commentaire text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  unique (property_id, user_id)
);

create index reviews_property_id_idx on public.reviews (property_id);
create index reviews_user_id_idx on public.reviews (user_id);

-- ------------------------------------------------------------
-- Table : favorites
-- ------------------------------------------------------------
create table public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  property_id uuid not null references public.properties (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  unique (user_id, property_id)
);

create index favorites_user_id_idx on public.favorites (user_id);
create index favorites_property_id_idx on public.favorites (property_id);

-- ------------------------------------------------------------
-- Trigger : profil auto à l'inscription
-- ------------------------------------------------------------
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ------------------------------------------------------------
-- Row Level Security (RLS)
-- ------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.properties enable row level security;
alter table public.property_images enable row level security;
alter table public.property_amenities enable row level security;
alter table public.availability_blocks enable row level security;
alter table public.bookings enable row level security;
alter table public.reviews enable row level security;
alter table public.favorites enable row level security;

-- PROFILES
create policy "Profils visibles par l'utilisateur ou admin"
on public.profiles for select
using (auth.uid() = id or public.is_admin());

create policy "Utilisateur modifie son profil"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "Admin modifie tous les profils"
on public.profiles for update
using (public.is_admin())
with check (public.is_admin());

-- PROPERTIES
create policy "Biens actifs visibles par tous"
on public.properties for select
using (statut = 'actif' or public.is_admin());

create policy "Admin crée des biens"
on public.properties for insert
with check (public.is_admin());

create policy "Admin modifie des biens"
on public.properties for update
using (public.is_admin())
with check (public.is_admin());

create policy "Admin supprime des biens"
on public.properties for delete
using (public.is_admin());

-- PROPERTY IMAGES
create policy "Images visibles si bien visible"
on public.property_images for select
using (
  exists (
    select 1 from public.properties p
    where p.id = property_id
      and (p.statut = 'actif' or public.is_admin())
  )
);

create policy "Admin gère les images"
on public.property_images for all
using (public.is_admin())
with check (public.is_admin());

-- PROPERTY AMENITIES
create policy "Équipements visibles si bien visible"
on public.property_amenities for select
using (
  exists (
    select 1 from public.properties p
    where p.id = property_id
      and (p.statut = 'actif' or public.is_admin())
  )
);

create policy "Admin gère les équipements"
on public.property_amenities for all
using (public.is_admin())
with check (public.is_admin());

-- AVAILABILITY BLOCKS
create policy "Disponibilités visibles si bien visible"
on public.availability_blocks for select
using (
  exists (
    select 1 from public.properties p
    where p.id = property_id
      and (p.statut = 'actif' or public.is_admin())
  )
);

create policy "Admin gère les disponibilités"
on public.availability_blocks for all
using (public.is_admin())
with check (public.is_admin());

-- BOOKINGS
create policy "Utilisateur voit ses réservations"
on public.bookings for select
using (auth.uid() = user_id or public.is_admin());

create policy "Utilisateur crée ses réservations"
on public.bookings for insert
with check (auth.uid() = user_id);

create policy "Utilisateur modifie ses réservations en attente"
on public.bookings for update
using (
  (auth.uid() = user_id and statut = 'en_attente')
  or public.is_admin()
)
with check (
  (auth.uid() = user_id and statut in ('en_attente', 'annulee'))
  or public.is_admin()
);

-- REVIEWS
create policy "Avis visibles par tous"
on public.reviews for select
using (true);

create policy "Utilisateur crée ses avis"
on public.reviews for insert
with check (auth.uid() = user_id);

create policy "Utilisateur modifie ses avis"
on public.reviews for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Utilisateur supprime ses avis"
on public.reviews for delete
using (auth.uid() = user_id or public.is_admin());

-- FAVORITES
create policy "Utilisateur voit ses favoris"
on public.favorites for select
using (auth.uid() = user_id);

create policy "Utilisateur ajoute des favoris"
on public.favorites for insert
with check (auth.uid() = user_id);

create policy "Utilisateur supprime ses favoris"
on public.favorites for delete
using (auth.uid() = user_id);
