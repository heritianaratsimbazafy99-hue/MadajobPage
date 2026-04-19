-- Remplace les emails ci-dessous par les vrais comptes deja crees dans Supabase Auth.
-- Les candidats peuvent s'inscrire eux-memes.
-- Les acces recruteur et admin sont promus manuellement via ce script.

insert into public.organizations (name, slug, kind)
values ('Madajob', 'madajob', 'internal')
on conflict (slug) do nothing;

-- Premier admin Madajob
update public.profiles
set
  role = 'admin',
  organization_id = (
    select id
    from public.organizations
    where slug = 'madajob'
    limit 1
  )
where email = 'admin@madajob.mg';

-- Premier recruteur Madajob
update public.profiles
set
  role = 'recruteur',
  organization_id = (
    select id
    from public.organizations
    where slug = 'madajob'
    limit 1
  )
where email = 'recruteur@madajob.mg';

-- Exemple de client externe a activer plus tard
insert into public.organizations (name, slug, kind)
values ('Entreprise Demo', 'entreprise-demo', 'client')
on conflict (slug) do nothing;

-- Exemple de rattachement recruteur a une organisation cliente
update public.profiles
set
  role = 'recruteur',
  organization_id = (
    select id
    from public.organizations
    where slug = 'entreprise-demo'
    limit 1
  )
where email = 'rh@entreprise-demo.mg';
