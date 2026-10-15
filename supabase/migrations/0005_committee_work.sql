-- 0005_committee_work.sql
-- Committee operating surface: tasks, meetings, minutes, decisions, documents,
-- announcements, activity log (Phase 2).
-- Sensitivity rule (ARCHITECTURE_PLAN.md §7.4): minutes/documents are NOT
-- readable by plain membership — officers, super_admin, or an explicit grant.

create or replace function public.has_permission(p_code text, p_committee uuid default null)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    -- direct permission grant
    select 1 from public.user_role_assignments a
    where a.user_id = public.current_user_id()
      and a.permission_code = p_code
      and a.revoked_at is null
      and (a.expires_at is null or a.expires_at > now())
      and (p_committee is null or a.committee_id is null or a.committee_id = p_committee)
  )
  or exists (
    -- permission via assigned role
    select 1
    from public.user_role_assignments a
    join public.role_permissions rp on rp.role_key = a.role_key and rp.permission_code = p_code
    where a.user_id = public.current_user_id()
      and a.revoked_at is null
      and (a.expires_at is null or a.expires_at > now())
      and (p_committee is null or a.committee_id is null or a.committee_id = p_committee)
  )
  or exists (
    -- bootstrap fallback via profiles.role
    select 1
    from public.profiles p
    join public.role_permissions rp on rp.role_key = p.role::text and rp.permission_code = p_code
    where p.id = public.current_user_id()
  );
$$;

-- ── Tasks ───────────────────────────────────────────────────────────────────
create table public.committee_tasks (
  id           uuid primary key default gen_random_uuid(),
  committee_id uuid not null references public.committees (id) on delete cascade,
  edition_id   uuid not null references public.festival_editions (id) on delete cascade,
  title        text not null,
  body         text,
  status       text not null default 'not_started'
               check (status in ('not_started', 'in_progress', 'awaiting_approval', 'completed', 'blocked', 'cancelled')),
  priority     text not null default 'medium' check (priority in ('low', 'medium', 'high', 'critical')),
  due_on       date,
  created_by   uuid references auth.users (id),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create trigger committee_tasks_set_updated_at
  before update on public.committee_tasks
  for each row execute function public.set_updated_at();

create table public.task_assignments (
  id         uuid primary key default gen_random_uuid(),
  task_id    uuid not null references public.committee_tasks (id) on delete cascade,
  person_id  uuid not null references public.person_records (id) on delete cascade,
  assigned_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  unique (task_id, person_id)
);

-- ── Meetings ────────────────────────────────────────────────────────────────
create table public.committee_meetings (
  id           uuid primary key default gen_random_uuid(),
  committee_id uuid not null references public.committees (id) on delete cascade,
  title        text not null,
  agenda       text,
  starts_at    timestamptz,
  ends_at      timestamptz,
  location     text,
  status       text not null default 'scheduled'
               check (status in ('scheduled', 'held', 'cancelled')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create trigger committee_meetings_set_updated_at
  before update on public.committee_meetings
  for each row execute function public.set_updated_at();

create table public.meeting_minutes (
  id         uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references public.committee_meetings (id) on delete cascade,
  body       text not null,
  author_id  uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger meeting_minutes_set_updated_at
  before update on public.meeting_minutes
  for each row execute function public.set_updated_at();

-- ── Decisions ───────────────────────────────────────────────────────────────
create table public.committee_decisions (
  id           uuid primary key default gen_random_uuid(),
  committee_id uuid not null references public.committees (id) on delete cascade,
  title        text not null,
  body         text,
  decision_on  date,
  status       text not null default 'proposed'
               check (status in ('proposed', 'approved', 'rejected', 'superseded')),
  created_by   uuid references auth.users (id),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create trigger committee_decisions_set_updated_at
  before update on public.committee_decisions
  for each row execute function public.set_updated_at();

-- ── Documents (private vault; signed URLs at the app layer) ─────────────────
create table public.committee_documents (
  id           uuid primary key default gen_random_uuid(),
  committee_id uuid not null references public.committees (id) on delete cascade,
  title        text not null,
  storage_path text not null,
  mime_type    text,
  size_bytes   bigint,
  uploaded_by  uuid references auth.users (id),
  created_at   timestamptz not null default now()
);

comment on table public.committee_documents is
  'Private document vault. No public bucket; access via short-lived signed URLs after permission check.';

-- ── Announcements ───────────────────────────────────────────────────────────
create table public.committee_announcements (
  id           uuid primary key default gen_random_uuid(),
  committee_id uuid not null references public.committees (id) on delete cascade,
  title        text not null,
  body         text not null,
  published_at timestamptz,
  created_by   uuid references auth.users (id),
  created_at   timestamptz not null default now()
);

-- ── Activity log (committee-local forensics) ────────────────────────────────
create table public.committee_activity_logs (
  id           bigint generated always as identity primary key,
  committee_id uuid not null references public.committees (id) on delete cascade,
  actor_id     uuid references auth.users (id),
  action       text not null,
  details      jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now()
);

-- ── RLS ─────────────────────────────────────────────────────────────────────
alter table public.committee_tasks enable row level security;
alter table public.task_assignments enable row level security;
alter table public.committee_meetings enable row level security;
alter table public.meeting_minutes enable row level security;
alter table public.committee_decisions enable row level security;
alter table public.committee_documents enable row level security;
alter table public.committee_announcements enable row level security;
alter table public.committee_activity_logs enable row level security;

create policy tasks_member_read on public.committee_tasks
  for select using (public.is_committee_member(committee_id));

create policy tasks_officer_write on public.committee_tasks
  for all using (public.is_committee_officer(committee_id))
  with check (public.is_committee_officer(committee_id));

create policy task_assignments_member_read on public.task_assignments
  for select using (
    public.is_committee_member(
      (select committee_id from public.committee_tasks where id = task_id)
    )
  );

create policy task_assignments_officer_write on public.task_assignments
  for all using (
    public.is_committee_officer(
      (select committee_id from public.committee_tasks where id = task_id)
    )
  )
  with check (
    public.is_committee_officer(
      (select committee_id from public.committee_tasks where id = task_id)
    )
  );

create policy meetings_member_read on public.committee_meetings
  for select using (public.is_committee_member(committee_id));

create policy meetings_officer_write on public.committee_meetings
  for all using (public.is_committee_officer(committee_id))
  with check (public.is_committee_officer(committee_id));

-- Minutes: explicit-grant sensitivity.
create policy minutes_officer_read on public.meeting_minutes
  for select using (
    public.is_super_admin()
    or public.is_committee_officer(
      (select committee_id from public.committee_meetings where id = meeting_id)
    )
    or public.has_permission(
      'minutes.read',
      (select committee_id from public.committee_meetings where id = meeting_id)
    )
  );

create policy minutes_officer_write on public.meeting_minutes
  for all using (
    public.is_committee_officer(
      (select committee_id from public.committee_meetings where id = meeting_id)
    )
  )
  with check (
    public.is_committee_officer(
      (select committee_id from public.committee_meetings where id = meeting_id)
    )
  );

create policy decisions_member_read on public.committee_decisions
  for select using (public.is_committee_member(committee_id));

create policy decisions_officer_write on public.committee_decisions
  for all using (public.is_committee_officer(committee_id))
  with check (public.is_committee_officer(committee_id));

-- Documents: explicit-grant sensitivity (same rule as minutes).
create policy documents_officer_read on public.committee_documents
  for select using (
    public.is_super_admin()
    or public.is_committee_officer(committee_id)
    or public.has_permission('minutes.read', committee_id)
  );

create policy documents_officer_write on public.committee_documents
  for all using (public.is_committee_officer(committee_id))
  with check (public.is_committee_officer(committee_id));

create policy announcements_member_read on public.committee_announcements
  for select using (public.is_committee_member(committee_id));

create policy announcements_officer_write on public.committee_announcements
  for all using (public.is_committee_officer(committee_id))
  with check (public.is_committee_officer(committee_id));

create policy activity_log_member_read on public.committee_activity_logs
  for select using (public.is_committee_member(committee_id));

create policy activity_log_officer_insert on public.committee_activity_logs
  for insert with check (public.is_committee_member(committee_id));
