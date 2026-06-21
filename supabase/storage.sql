-- ============================================================
-- Adel Immobilier — Storage images (Étape 4)
-- Exécuter dans Supabase → SQL Editor
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'property-images',
  'property-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "Images des biens visibles par tous"
on storage.objects for select
using (bucket_id = 'property-images');

create policy "Admin upload images des biens"
on storage.objects for insert
with check (bucket_id = 'property-images' and public.is_admin());

create policy "Admin modifie images des biens"
on storage.objects for update
using (bucket_id = 'property-images' and public.is_admin())
with check (bucket_id = 'property-images' and public.is_admin());

create policy "Admin supprime images des biens"
on storage.objects for delete
using (bucket_id = 'property-images' and public.is_admin());
