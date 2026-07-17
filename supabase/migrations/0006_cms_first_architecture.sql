-- ============================================================
-- Migration 0006 — CMS-first architecture (M-CMS-1)
--
-- Implements the design in docs/CMS_ARCHITECTURE.md:
--   - Job queue + audit + conflict tables
--   - Per-tab configuration table (declarative archival policy)
--   - Content tables (one per Sheets tab)
--   - Staging tables (atomic-apply landing zones)
--   - Renamed sync-metadata columns matching the 8-column Sheet system set
--   - Rename site_settings → content_settings
--   - content_audit_log immutability enforced by a BEFORE trigger (not RLS —
--     the service role bypasses RLS, so a trigger is the only real guarantee)
--
-- Concurrency note: per-tab mutual exclusion uses a heartbeat-guarded
-- "running-job lease" on sync_jobs (a tab with a fresh 'running' job cannot
-- be claimed again). Session-scoped pg_advisory_lock was rejected: PostgREST
-- connection pooling means acquire and release can land on different backend
-- sessions, leaking the lock.
--
-- Idempotent: IF NOT EXISTS / guarded DO blocks throughout, so a partial
-- application can be resumed. Row data is preserved.
-- ============================================================

create extension if not exists pgcrypto;

-- ---------- 1. Rename site_settings → content_settings ----------

do $$ begin
  if exists (select 1 from information_schema.tables
             where table_schema = 'public' and table_name = 'site_settings')
     and not exists (select 1 from information_schema.tables
                     where table_schema = 'public' and table_name = 'content_settings')
  then
    execute 'alter table public.site_settings rename to content_settings';
  end if;
end $$;

-- ---------- 2. Sync-metadata columns on existing synced tables ----------

create or replace function _add_sync_metadata_columns(tbl regclass) returns void
language plpgsql as $fn$
declare
  qualified text := tbl::text;
  cname text := replace(replace(tbl::text, 'public.', ''), '"', '') || '_sheet_row_id_key';
begin
  execute format('alter table %s add column if not exists sheet_row_id text', qualified);
  execute format('alter table %s add column if not exists public_id text', qualified);
  execute format('alter table %s add column if not exists row_version int not null default 1', qualified);
  execute format('alter table %s add column if not exists sync_status text not null default ''ok''', qualified);
  execute format('alter table %s add column if not exists last_synced_at timestamptz', qualified);
  execute format('alter table %s add column if not exists last_sync_error text', qualified);
  execute format('alter table %s add column if not exists sync_source text not null default ''sheets''', qualified);
  execute format('alter table %s add column if not exists is_active boolean not null default true', qualified);
  execute format('alter table %s add column if not exists archived_at timestamptz', qualified);
  if not exists (
    select 1 from pg_constraint where conrelid = tbl and conname = cname
  ) then
    execute format('alter table %s add constraint %I unique (sheet_row_id)', qualified, cname);
  end if;
end $fn$;

select _add_sync_metadata_columns('public.animals');
select _add_sync_metadata_columns('public.stories');
select _add_sync_metadata_columns('public.donation_campaigns');
select _add_sync_metadata_columns('public.content_settings');
select _add_sync_metadata_columns('public.animal_medical_events');

-- Rename 0002's `synced_at` to `last_synced_at` where it exists.
do $$ begin
  if exists (select 1 from information_schema.columns
             where table_schema='public' and table_name='animals' and column_name='synced_at') then
    if exists (select 1 from information_schema.columns
               where table_schema='public' and table_name='animals' and column_name='last_synced_at') then
      -- both exist (helper added last_synced_at first): keep 0002's data, drop the empty new one
      alter table animals drop column last_synced_at;
    end if;
    alter table animals rename column synced_at to last_synced_at;
  end if;

  if exists (select 1 from information_schema.columns
             where table_schema='public' and table_name='stories' and column_name='synced_at') then
    if exists (select 1 from information_schema.columns
               where table_schema='public' and table_name='stories' and column_name='last_synced_at') then
      alter table stories drop column last_synced_at;
    end if;
    alter table stories rename column synced_at to last_synced_at;
  end if;
end $$;

-- ---------- 3. tab_config — declarative per-tab configuration ----------

create table if not exists tab_config (
  tab_name         text primary key,
  category         text not null check (category in ('content', 'master_data', 'transaction_data')),
  direction        text not null check (direction in ('sheets_to_db', 'db_to_sheets')),
  db_tables        text[] not null,
  db_primary_table text not null,
  archive_policy   jsonb not null default '{"kind":"none"}'::jsonb,
  revalidate_paths text[] not null default '{}'::text[],
  active_column    boolean not null default true,
  enabled          boolean not null default true,
  updated_at       timestamptz not null default now()
);

alter table tab_config enable row level security;
drop policy if exists tab_config_admin_read on tab_config;
drop policy if exists tab_config_admin_write on tab_config;
create policy tab_config_admin_read on tab_config for select
  using (has_role(array['admin','super_admin']::user_role[]));
create policy tab_config_admin_write on tab_config for all
  using (has_role(array['admin','super_admin']::user_role[]))
  with check (has_role(array['admin','super_admin']::user_role[]));

-- Dogs archival: 'manual' until M-CMS-3 adds the current_status column the
-- intended status_based predicate needs. Changing later is a one-row UPDATE.
insert into tab_config (tab_name, category, direction, db_tables, db_primary_table, archive_policy, revalidate_paths, active_column) values
  ('Home',            'content',          'sheets_to_db', array['content_home'],       'content_home',       '{"kind":"none"}'::jsonb,                                                                                     array['/'],                          true),
  ('Adoption',        'content',          'sheets_to_db', array['content_adoption'],   'content_adoption',   '{"kind":"none"}'::jsonb,                                                                                     array['/adopt'],                     true),
  ('Donate',          'content',          'sheets_to_db', array['donation_campaigns','content_donate'], 'donation_campaigns', '{"kind":"status_based","archive_when":"is_active = false and updated_at < now() - interval ''180 days''"}'::jsonb, array['/donate','/'], true),
  ('Stories',         'content',          'sheets_to_db', array['stories'],            'stories',            '{"kind":"status_based","archive_when":"status = ''draft'' and updated_at < now() - interval ''180 days''"}'::jsonb, array['/stories'],   true),
  ('Help',            'content',          'sheets_to_db', array['content_help'],       'content_help',       '{"kind":"none"}'::jsonb,                                                                                     array['/volunteer','/about'],        true),
  ('Events',          'content',          'sheets_to_db', array['content_events'],     'content_events',     '{"kind":"status_based","archive_when":"ends_at < now() - interval ''90 days''"}'::jsonb,                    array['/'],                          true),
  ('FAQ',             'content',          'sheets_to_db', array['content_faq'],        'content_faq',        '{"kind":"none"}'::jsonb,                                                                                     array['/'],                          true),
  ('Navigation',      'content',          'sheets_to_db', array['content_navigation'], 'content_navigation', '{"kind":"none"}'::jsonb,                                                                                     array['/'],                          true),
  ('Footer',          'content',          'sheets_to_db', array['content_footer'],     'content_footer',     '{"kind":"none"}'::jsonb,                                                                                     array['/'],                          true),
  ('Dogs',            'master_data',      'sheets_to_db', array['animals'],            'animals',            '{"kind":"manual"}'::jsonb,                                                                                   array['/adopt'],                     true),
  ('Volunteers',      'master_data',      'sheets_to_db', array['volunteer_directory'],'volunteer_directory','{"kind":"none"}'::jsonb,                                                                                     array['/volunteer','/about'],        true),
  ('Website Settings','master_data',      'sheets_to_db', array['content_settings'],   'content_settings',   '{"kind":"none"}'::jsonb,                                                                                     array['/'],                          false),
  ('Medical History', 'transaction_data', 'sheets_to_db', array['animal_medical_events'],  'animal_medical_events',  '{"kind":"time_window","column":"event_date","keep":"2 years"}'::jsonb,                              array[]::text[],                     true),
  ('Vaccination',     'transaction_data', 'sheets_to_db', array['animal_vaccinations'],    'animal_vaccinations',    '{"kind":"time_window","column":"date_given","keep":"3 years"}'::jsonb,                              array[]::text[],                     true),
  ('Sterilization',   'transaction_data', 'sheets_to_db', array['animal_sterilizations'],  'animal_sterilizations',  '{"kind":"none"}'::jsonb,                                                                            array[]::text[],                     true),
  ('Adoption Applications',  'transaction_data', 'db_to_sheets', array['adoption_applications'],  'adoption_applications',  '{"kind":"status_based","archive_when":"status in (''adopted'',''not_selected'') and updated_at < now() - interval ''90 days''"}'::jsonb, array[]::text[], false),
  ('Donation Confirmations', 'transaction_data', 'db_to_sheets', array['donation_confirmations'], 'donation_confirmations', '{"kind":"size_threshold","order_by":"created_at","keep_newest":500}'::jsonb,                 array[]::text[],                     false),
  ('Reports',                'transaction_data', 'db_to_sheets', array['rescue_reports'],         'rescue_reports',         '{"kind":"status_based","archive_when":"status = ''resolved'' and updated_at < now() - interval ''30 days''"}'::jsonb, array[]::text[], false)
on conflict (tab_name) do nothing;

-- ---------- 4. sync_jobs — the job queue ----------

create table if not exists sync_jobs (
  id            uuid primary key default gen_random_uuid(),
  tab           text not null,
  direction     text not null check (direction in ('sheets_to_db', 'db_to_sheets', 'drive_to_storage')),
  scope         text not null default 'incremental' check (scope in ('full', 'incremental', 'row')),
  row_id        uuid,
  state         text not null default 'queued' check (state in ('queued', 'running', 'succeeded', 'failed', 'conflict')),
  attempt       int not null default 1,
  max_attempts  int not null default 4,
  next_run_at   timestamptz,
  last_error    jsonb,
  heartbeat_at  timestamptz,
  enqueued_at   timestamptz not null default now(),
  started_at    timestamptz,
  finished_at   timestamptz,
  triggered_by  text not null check (triggered_by in ('cron', 'admin', 'trigger', 'apps_script', 'compat_shim')),
  actor_id      uuid references auth.users(id),
  rows_read     int,
  rows_written  int,
  conflicts     int,
  duration_ms   int
);

create index if not exists idx_sync_jobs_state_next on sync_jobs (state, next_run_at)
  where state in ('queued', 'running');
create index if not exists idx_sync_jobs_tab_dir on sync_jobs (tab, direction, enqueued_at desc);

-- Dedup: at most one active job per (tab, direction, row-key).
create unique index if not exists uniq_sync_jobs_active
  on sync_jobs (tab, direction, coalesce(row_id, '00000000-0000-0000-0000-000000000000'::uuid))
  where state in ('queued', 'running');

alter table sync_jobs enable row level security;
drop policy if exists sync_jobs_admin_read on sync_jobs;
create policy sync_jobs_admin_read on sync_jobs for select
  using (has_role(array['admin','super_admin']::user_role[]));
-- Writes: service role only (no write policy for public roles).

-- Link the per-run summary log to its job.
alter table sync_log add column if not exists job_id uuid references sync_jobs(id);

-- ---------- 5. sync_conflicts ----------

create table if not exists sync_conflicts (
  id             uuid primary key default gen_random_uuid(),
  detected_at    timestamptz not null default now(),
  sync_job_id    uuid references sync_jobs(id),
  table_name     text not null,
  row_id         uuid not null,
  type           text not null check (type in ('row_version_mismatch', 'broken_media', 'unresolved_fk', 'duplicate_public_id')),
  sheet_payload  jsonb,
  db_payload     jsonb,
  resolution     text check (resolution is null or resolution in ('kept_db', 'kept_sheet', 'dismissed')),
  resolved_by    uuid references auth.users(id),
  resolved_at    timestamptz
);
create index if not exists idx_sync_conflicts_open on sync_conflicts (detected_at desc)
  where resolution is null;

alter table sync_conflicts enable row level security;
drop policy if exists sync_conflicts_admin_read on sync_conflicts;
drop policy if exists sync_conflicts_admin_write on sync_conflicts;
create policy sync_conflicts_admin_read on sync_conflicts for select
  using (has_role(array['admin','super_admin']::user_role[]));
create policy sync_conflicts_admin_write on sync_conflicts for update
  using (has_role(array['admin','super_admin']::user_role[]))
  with check (has_role(array['admin','super_admin']::user_role[]));

-- ---------- 6. content_audit_log — immutable per-row diff log ----------

create table if not exists content_audit_log (
  id            bigserial primary key,
  at            timestamptz not null default now(),
  sync_job_id   uuid references sync_jobs(id),
  table_name    text not null,
  row_id        uuid not null,
  operation     text not null check (operation in ('insert', 'update', 'soft_delete', 'archive', 'unarchive')),
  source        text not null check (source in ('sheets', 'app', 'trigger', 'system')),
  actor         text,
  diff          jsonb not null
);
create index if not exists idx_content_audit_row on content_audit_log (table_name, row_id, at desc);
create index if not exists idx_content_audit_at on content_audit_log (at desc);

alter table content_audit_log enable row level security;
drop policy if exists content_audit_admin_read on content_audit_log;
create policy content_audit_admin_read on content_audit_log for select
  using (has_role(array['admin','super_admin']::user_role[]));
-- Inserts: service role only. Updates/deletes: blocked for EVERYONE by trigger
-- below — RLS alone cannot protect against the service role (it bypasses RLS).

create or replace function forbid_audit_mutation() returns trigger
language plpgsql
set search_path = public
as $fn$
begin
  raise exception '% is append-only — % blocked', tg_table_name, tg_op;
end $fn$;

drop trigger if exists tr_content_audit_log_immutable on content_audit_log;
create trigger tr_content_audit_log_immutable
  before update or delete on content_audit_log
  for each row execute function forbid_audit_mutation();

-- ---------- 7. Content tables ----------

create table if not exists content_home (
  id                uuid primary key default gen_random_uuid(),
  sheet_row_id      text unique,
  public_id         text,
  row_version       int not null default 1,
  sync_status       text not null default 'ok',
  last_synced_at    timestamptz,
  last_sync_error   text,
  sync_source       text not null default 'sheets',
  section           text not null check (section in ('hero', 'mission', 'stats', 'featured', 'testimonials', 'sponsors', 'videos', 'gallery')),
  display_order     int not null default 0,
  title             text,
  subtitle          text,
  body              text,
  cta_label         text,
  cta_url           text,
  media_ref         text,
  data              jsonb not null default '{}'::jsonb,
  is_active         boolean not null default true,
  archived_at       timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists idx_content_home_active on content_home (section, display_order)
  where is_active and archived_at is null;

create table if not exists content_adoption (
  id                uuid primary key default gen_random_uuid(),
  sheet_row_id      text unique,
  public_id         text,
  row_version       int not null default 1,
  sync_status       text not null default 'ok',
  last_synced_at    timestamptz,
  last_sync_error   text,
  sync_source       text not null default 'sheets',
  section           text not null check (section in ('intro', 'categories', 'instructions', 'success_stories', 'faq')),
  display_order     int not null default 0,
  title             text,
  body              text,
  featured_animal_public_ids text[],
  data              jsonb not null default '{}'::jsonb,
  is_active         boolean not null default true,
  archived_at       timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists idx_content_adoption_active on content_adoption (section, display_order)
  where is_active and archived_at is null;

create table if not exists content_donate (
  id                uuid primary key default gen_random_uuid(),
  sheet_row_id      text unique,
  public_id         text,
  row_version       int not null default 1,
  sync_status       text not null default 'ok',
  last_synced_at    timestamptz,
  last_sync_error   text,
  sync_source       text not null default 'sheets',
  section           text not null check (section in ('intro', 'transparency', 'thank_you')),
  display_order     int not null default 0,
  title             text,
  subtitle          text,
  body              text,
  data              jsonb not null default '{}'::jsonb,
  is_active         boolean not null default true,
  archived_at       timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create table if not exists content_help (
  id                uuid primary key default gen_random_uuid(),
  sheet_row_id      text unique,
  public_id         text,
  row_version       int not null default 1,
  sync_status       text not null default 'ok',
  last_synced_at    timestamptz,
  last_sync_error   text,
  sync_source       text not null default 'sheets',
  section           text not null check (section in ('opportunities', 'foster_info', 'emergency', 'contact_card', 'how_to_help')),
  display_order     int not null default 0,
  title             text,
  body              text,
  icon              text,
  cta_label         text,
  cta_url           text,
  data              jsonb not null default '{}'::jsonb,
  is_active         boolean not null default true,
  archived_at       timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create table if not exists content_events (
  id                uuid primary key default gen_random_uuid(),
  sheet_row_id      text unique,
  public_id         text,
  row_version       int not null default 1,
  sync_status       text not null default 'ok',
  last_synced_at    timestamptz,
  last_sync_error   text,
  sync_source       text not null default 'sheets',
  slug              text unique,
  title             text not null,
  event_type        text,
  starts_at         timestamptz,
  ends_at           timestamptz,
  location          text,
  description       text,
  rsvp_url          text,
  featured          boolean not null default false,
  display_order     int not null default 0,
  images            jsonb not null default '[]'::jsonb,
  is_active         boolean not null default true,
  archived_at       timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists idx_content_events_time on content_events (starts_at desc)
  where is_active and archived_at is null;

create table if not exists content_faq (
  id                uuid primary key default gen_random_uuid(),
  sheet_row_id      text unique,
  public_id         text,
  row_version       int not null default 1,
  sync_status       text not null default 'ok',
  last_synced_at    timestamptz,
  last_sync_error   text,
  sync_source       text not null default 'sheets',
  category          text not null,
  question          text not null,
  answer            text not null,
  display_order     int not null default 0,
  is_active         boolean not null default true,
  archived_at       timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists idx_content_faq_active on content_faq (category, display_order)
  where is_active and archived_at is null;

create table if not exists content_navigation (
  id                uuid primary key default gen_random_uuid(),
  sheet_row_id      text unique,
  public_id         text,
  row_version       int not null default 1,
  sync_status       text not null default 'ok',
  last_synced_at    timestamptz,
  last_sync_error   text,
  sync_source       text not null default 'sheets',
  label             text not null,
  url               text not null,
  icon              text,
  parent_label      text,
  display_order     int not null default 0,
  visible           boolean not null default true,
  open_in_new_tab   boolean not null default false,
  is_active         boolean not null default true,
  archived_at       timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists idx_content_navigation_active on content_navigation (parent_label, display_order)
  where is_active and archived_at is null and visible;

create table if not exists content_footer (
  id                uuid primary key default gen_random_uuid(),
  sheet_row_id      text unique,
  public_id         text,
  row_version       int not null default 1,
  sync_status       text not null default 'ok',
  last_synced_at    timestamptz,
  last_sync_error   text,
  sync_source       text not null default 'sheets',
  section           text not null check (section in ('social_link', 'quick_link', 'contact', 'copyright', 'newsletter_blurb')),
  display_order     int not null default 0,
  label             text,
  url               text,
  icon              text,
  value             text,
  is_active         boolean not null default true,
  archived_at       timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists idx_content_footer_active on content_footer (section, display_order)
  where is_active and archived_at is null;

create table if not exists volunteer_directory (
  id                uuid primary key default gen_random_uuid(),
  sheet_row_id      text unique,
  public_id         text,
  row_version       int not null default 1,
  sync_status       text not null default 'ok',
  last_synced_at    timestamptz,
  last_sync_error   text,
  sync_source       text not null default 'sheets',
  name              text not null,
  role              text,
  contact           text,
  photo_path        text,
  responsibilities  text[],
  bio               text,
  display_order     int not null default 0,
  is_active         boolean not null default true,
  archived_at       timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create table if not exists animal_vaccinations (
  id                uuid primary key default gen_random_uuid(),
  sheet_row_id      text unique,
  public_id         text,
  row_version       int not null default 1,
  sync_status       text not null default 'ok',
  last_synced_at    timestamptz,
  last_sync_error   text,
  sync_source       text not null default 'sheets',
  animal_id         uuid not null references animals(id) on delete cascade,
  vaccine           text not null,
  date_given        date not null,
  next_due          date,
  administered_by   text,
  notes             text,
  is_active         boolean not null default true,
  archived_at       timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists idx_animal_vaccinations_animal on animal_vaccinations (animal_id, date_given desc)
  where is_active and archived_at is null;
create index if not exists idx_animal_vaccinations_due on animal_vaccinations (next_due)
  where next_due is not null and is_active and archived_at is null;

create table if not exists animal_sterilizations (
  id                uuid primary key default gen_random_uuid(),
  sheet_row_id      text unique,
  public_id         text,
  row_version       int not null default 1,
  sync_status       text not null default 'ok',
  last_synced_at    timestamptz,
  last_sync_error   text,
  sync_source       text not null default 'sheets',
  animal_id         uuid not null references animals(id) on delete cascade,
  procedure_date    date not null,
  doctor            text,
  hospital          text,
  notes             text,
  is_active         boolean not null default true,
  archived_at       timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ---------- 8. Staging tables (atomic-apply landing zones) ----------
-- One stg_<table> per Sheets→DB synced table. No FKs/triggers — pure landing
-- zone. RLS enabled with zero policies: only the service role (bypasses RLS)
-- can touch them.

do $$
declare
  t text;
begin
  foreach t in array array[
    'animals','stories','donation_campaigns','content_settings',
    'animal_medical_events','animal_vaccinations','animal_sterilizations',
    'content_home','content_adoption','content_donate','content_help',
    'content_events','content_faq','content_navigation','content_footer',
    'volunteer_directory'
  ] loop
    execute format('create table if not exists stg_%I (like %I including defaults)', t, t);
    execute format('alter table stg_%I add column if not exists sync_job_id uuid', t);
    execute format('alter table stg_%I enable row level security', t);
  end loop;
end $$;

-- ---------- 9. RLS on new content tables ----------

do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'content_home','content_adoption','content_donate','content_help',
    'content_events','content_faq','content_navigation','content_footer',
    'volunteer_directory','animal_vaccinations','animal_sterilizations'
  ] loop
    execute format('alter table %I enable row level security', tbl);
    execute format('drop policy if exists %I_public_read on %I', tbl, tbl);
    execute format('drop policy if exists %I_admin_write on %I', tbl, tbl);
    execute format('create policy %I_public_read on %I for select using (true)', tbl, tbl);
    execute format('create policy %I_admin_write on %I for all using (has_role(array[''admin'',''super_admin'']::user_role[])) with check (has_role(array[''admin'',''super_admin'']::user_role[]))', tbl, tbl);
  end loop;
end $$;

-- ---------- 10. updated_at triggers on new tables ----------

do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'content_home','content_adoption','content_donate','content_help',
    'content_events','content_faq','content_navigation','content_footer',
    'volunteer_directory','animal_vaccinations','animal_sterilizations',
    'tab_config'
  ] loop
    execute format('drop trigger if exists tr_%s_updated_at on %I', tbl, tbl);
    execute format('create trigger tr_%s_updated_at before update on %I for each row execute function set_updated_at()', tbl, tbl);
  end loop;
end $$;

-- ---------- 11. Cleanup ----------

drop function _add_sync_metadata_columns(regclass);

-- ============================================================
-- End of migration 0006
-- ============================================================
