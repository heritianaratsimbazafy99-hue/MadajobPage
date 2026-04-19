-- Les candidats peuvent s'inscrire eux-memes.
-- Les acces recruteur et admin sont promus manuellement via ce script.

insert into public.organizations (name, slug, kind)
values ('Madajob', 'madajob', 'internal')
on conflict (slug) do nothing;

insert into public.organizations (name, slug, kind)
values ('Nvidia', 'nvidia', 'client')
on conflict (slug) do update
set
  name = excluded.name,
  kind = excluded.kind,
  is_active = true,
  updated_at = now();

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
where lower(email) = 'admin@madajob.mg';

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
where lower(email) = 'recruteur@madajob.mg';

-- Recruteur test rattache a Nvidia
update public.profiles
set
  role = 'recruteur',
  organization_id = (
    select id
    from public.organizations
    where slug = 'nvidia'
    limit 1
  )
where lower(email) = 'test@nvidia.fr';

-- Verification rapide
select email, role, organization_id
from public.profiles
where lower(email) in ('admin@madajob.mg', 'recruteur@madajob.mg', 'test@nvidia.fr')
order by email;
