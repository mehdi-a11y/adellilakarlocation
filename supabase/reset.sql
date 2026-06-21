-- ============================================================
-- Reset (uniquement si la 1ère exécution a échoué à mi-chemin)
-- Exécuter AVANT de relancer schema.sql
-- ============================================================

drop trigger if exists on_auth_user_created on auth.users;

drop table if exists public.favorites cascade;
drop table if exists public.reviews cascade;
drop table if exists public.bookings cascade;
drop table if exists public.availability_blocks cascade;
drop table if exists public.property_amenities cascade;
drop table if exists public.property_images cascade;
drop table if exists public.properties cascade;
drop table if exists public.profiles cascade;

drop function if exists public.handle_new_user() cascade;
drop function if exists public.is_admin() cascade;
drop function if exists public.handle_updated_at() cascade;

drop type if exists public.availability_reason cascade;
drop type if exists public.booking_status cascade;
drop type if exists public.property_status cascade;
drop type if exists public.property_type cascade;
drop type if exists public.user_role cascade;
