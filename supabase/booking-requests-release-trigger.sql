-- Libère les dates à la suppression d'une demande (property OU appartement)
-- Exécuter dans Supabase → SQL Editor (safe à relancer)

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
