-- 0014_president_and_general_secretary_roles.sql
-- Introduction of President and General Secretary executive roles,
-- and the exclusive admin.manage permission for Super Admin.

-- 1. Insert admin.manage permission
insert into public.permissions (code, description) values
  ('admin.manage', 'Exclusive super admin right to create, edit, or remove administrators')
on conflict (code) do update set description = excluded.description;

-- 2. Insert president and general_secretary roles
insert into public.roles (key, description) values
  ('president', 'Club President - Full operational access excluding admin management'),
  ('general_secretary', 'General Secretary - Full operational access excluding admin management')
on conflict (key) do update set description = excluded.description;

-- 3. Insert role_permissions for president, general_secretary, and super_admin
insert into public.role_permissions (role_key, permission_code)
select 'super_admin', 'admin.manage'
on conflict do nothing;

insert into public.role_permissions (role_key, permission_code)
select t.role_key, p.code
from (values
  ('president', array[
    'content.read',
    'content.manage',
    'registration.read_own',
    'registration.manage',
    'roster.read',
    'roster.read_all',
    'finance.read',
    'sponsorship.read_public',
    'sponsorship.manage',
    'directory.read_own',
    'credential.issue',
    'credential.validate',
    'credential.override',
    'cms.publish',
    'export.bulk'
  ]),
  ('general_secretary', array[
    'content.read',
    'content.manage',
    'registration.read_own',
    'registration.manage',
    'roster.read',
    'roster.read_all',
    'finance.read',
    'sponsorship.read_public',
    'sponsorship.manage',
    'directory.read_own',
    'credential.issue',
    'credential.validate',
    'credential.override',
    'cms.publish',
    'export.bulk'
  ])
) as t(role_key, codes)
cross join unnest(t.codes) as p(code)
on conflict do nothing;
