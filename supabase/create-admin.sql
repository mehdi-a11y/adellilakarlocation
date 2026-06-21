-- ============================================================
-- Créer / promouvoir un administrateur
-- Exécuter dans Supabase → SQL Editor
-- Remplacez l'email ci-dessous par le vôtre
-- ============================================================

-- Option 1 : Promouvoir un utilisateur existant en admin
update public.profiles
set role = 'admin'
where id = (
  select id from auth.users where email = 'VOTRE_EMAIL@example.com'
);

-- Option 2 : Si le profil n'existe pas encore (utilisateur créé avant le trigger)
insert into public.profiles (id, nom, telephone, role)
select
  id,
  coalesce(raw_user_meta_data ->> 'nom', email),
  raw_user_meta_data ->> 'telephone',
  'admin'
from auth.users
where email = 'VOTRE_EMAIL@example.com'
on conflict (id) do update
set role = 'admin';

-- Vérification
select u.email, p.nom, p.role
from auth.users u
join public.profiles p on p.id = u.id
where u.email = 'VOTRE_EMAIL@example.com';
