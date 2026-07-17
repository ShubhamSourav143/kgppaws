-- ============================================================
-- Migration 0002 — CMS foundations
-- Permanent public IDs, Drive asset tracking, Sheets sync metadata,
-- site-wide settings, sync run log.
--
-- Applied directly to the live project (unyhhkulkgznqoqalqxk) via the
-- Supabase MCP on 2026-07-17; this file is the record of that change for
-- `supabase db push` / a fresh clone to reproduce the same schema.
-- ============================================================

-- ---------- permanent animal ID (DOG00023 / CAT00004) ----------
create sequence if not exists animal_public_id_seq start 1;

create or replace function next_animal_public_id(sp species) returns text
language sql as $$
  select upper(sp::text) || lpad(nextval('animal_public_id_seq')::text, 5, '0');
$$;

alter table animals add column if not exists public_id text;
-- Backfill existing rows deterministically (ordered by creation) so IDs are stable.
with ordered as (
  select id, row_number() over (order by created_at) as rn, species
  from animals where public_id is null
)
update animals a
set public_id = upper(o.species::text) || lpad(o.rn::text, 5, '0')
from ordered o
where a.id = o.id;
-- keep the sequence ahead of whatever the backfill consumed
select setval('animal_public_id_seq', greatest((select count(*) from animals), 1));
alter table animals alter column public_id set not null;
alter table animals add constraint animals_public_id_key unique (public_id);

-- ---------- Sheets sync metadata (Dogs + Blogs sheets only, for now) ----------
alter table animals add column if not exists sheet_row_id text;
alter table animals add column if not exists row_version int not null default 1;
alter table animals add column if not exists sync_source text not null default 'app';
alter table animals add column if not exists synced_at timestamptz;

alter table stories add column if not exists sheet_row_id text;
alter table stories add column if not exists row_version int not null default 1;
alter table stories add column if not exists sync_source text not null default 'app';
alter table stories add column if not exists synced_at timestamptz;

-- ---------- Drive-ingested media tracking ----------
create table if not exists drive_assets (
  id uuid primary key default gen_random_uuid(),
  drive_file_id text unique,              -- null for locally-imported assets (no Drive API yet)
  kind text not null,                     -- 'dog_photo' | 'story_photo' | 'blog_image' | 'video' | 'document'
  animal_id uuid references animals(id),
  story_id uuid references stories(id),
  storage_path text not null,
  variants jsonb not null default '{}',
  checksum text,
  source text not null default 'local_import',  -- 'local_import' | 'drive_api'
  ingested_at timestamptz not null default now()
);
create index if not exists idx_drive_assets_animal on drive_assets(animal_id);
create index if not exists idx_drive_assets_story on drive_assets(story_id);
alter table drive_assets enable row level security;
create policy drive_assets_public_read on drive_assets for select using (true);
create policy drive_assets_admin_write on drive_assets for all
  using (has_role(array['admin','super_admin']::user_role[]))
  with check (has_role(array['admin','super_admin']::user_role[]));

-- ---------- Site-wide settings (UPI details, donation config, etc.) ----------
create table if not exists site_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);
alter table site_settings enable row level security;
create policy settings_public_read on site_settings for select using (true);
create policy settings_admin_write on site_settings for all
  using (has_role(array['admin','super_admin']::user_role[]))
  with check (has_role(array['admin','super_admin']::user_role[]));

-- ---------- Sheets sync run log ----------
create table if not exists sync_log (
  id uuid primary key default gen_random_uuid(),
  run_at timestamptz not null default now(),
  tab_name text not null,
  direction text not null,   -- 'sheets_to_db' | 'db_to_sheets'
  rows_read int not null default 0,
  rows_written int not null default 0,
  conflicts int not null default 0,
  errors jsonb not null default '[]',
  duration_ms int
);
alter table sync_log enable row level security;
create policy sync_log_admin_read on sync_log for select
  using (has_role(array['admin','super_admin']::user_role[]));
