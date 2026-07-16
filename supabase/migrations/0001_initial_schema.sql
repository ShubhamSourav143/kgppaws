-- ============================================================
-- KGP PAWS — initial schema
-- Postgres 15+ / Supabase
--
-- Design principles
--   • UUID primary keys, created_at everywhere, updated_at where rows mutate
--   • Row Level Security ON for every table — public reads are explicit
--   • Public animal data never includes precise coordinates
--   • Donations count only when status = 'verified' (gateway webhook)
--   • Internal notes are separate columns/tables from public notes
--   • Admin mutations are audit-logged
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- enums ----------
create type user_role        as enum ('user','volunteer','admin','super_admin');
create type species          as enum ('dog','cat','other');
create type animal_sex       as enum ('male','female','unknown');
create type animal_size      as enum ('small','medium','large');
create type health_status    as enum ('healthy','under_treatment','recovering','monitoring');
create type adoption_status  as enum ('available','foster_needed','not_available','adopted');
create type friendliness     as enum ('friendly','selective','cautious','shy');
create type medical_event_type as enum
  ('vaccination','deworming','sterilization','injury','treatment','checkup','recovery');
create type report_problem   as enum
  ('injured','sick','unable_to_walk','bleeding','vehicle_accident',
   'distressed','puppies_kittens_at_risk','other');
create type report_severity  as enum ('emergency','urgent','moderate','low');
create type report_status    as enum
  ('reported','volunteer_assigned','on_the_way','animal_located',
   'treatment_started','monitoring','resolved');
create type application_status as enum
  ('submitted','under_review','contacted','meet_scheduled','approved','not_selected','adopted');
create type donation_status  as enum ('created','pending_verification','verified','failed','refunded');
create type story_status     as enum ('draft','scheduled','published','archived');
create type campaign_category as enum
  ('feeding','treatment','vaccination','sterilization','recovery','emergency');

-- ---------- helpers ----------
-- search_path is pinned: an unpinned search_path in a function is a known
-- privilege-escalation vector (Supabase advisor 0011).
create or replace function set_updated_at() returns trigger
language plpgsql set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- NOTE: has_role() is defined further down, immediately AFTER the user_roles
-- table. It is `language sql`, so Postgres validates its body at creation time
-- and would error with "relation user_roles does not exist" if declared here.

-- ============================================================
-- identity & roles
-- ============================================================

create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text not null default '',
  phone       text,                -- private: RLS keeps this owner/admin-only
  affiliation text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger trg_profiles_updated before update on profiles
  for each row execute function set_updated_at();

create table user_roles (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  role       user_role not null default 'user',
  granted_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
create index idx_user_roles_user on user_roles(user_id);

-- Role check used inside every RLS policy. security definer avoids RLS
-- recursion (a policy on user_roles that reads user_roles). Must come after
-- the table above — see the note near the top of this file.
create or replace function has_role(required user_role[]) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from user_roles
    where user_id = auth.uid() and role = any(required)
  );
$$;

-- ============================================================
-- animals & digital identity
-- ============================================================

create table animals (
  id                 uuid primary key default gen_random_uuid(),
  paws_id            text not null unique,          -- PAWS-KGP-DOG-0012
  slug               text not null unique,
  name               text not null,
  species            species not null,
  sex                animal_sex not null default 'unknown',
  age_label          text not null default 'Unknown age',
  color              text not null default '',
  size               animal_size not null default 'medium',
  zone_id            text not null,                 -- coarse public zone ONLY
  tagline            text not null default '',
  personality        text[] not null default '{}',
  bio                text not null default '',
  friendliness       friendliness not null default 'cautious',
  vaccinated         boolean not null default false,
  sterilized         boolean not null default false,
  health_status      health_status not null default 'healthy',
  health_note        text not null default '',      -- public-safe wording
  internal_note      text not null default '',      -- volunteers/admins only
  last_health_update date,
  adoption_status    adoption_status not null default 'not_available',
  good_with_people   boolean not null default false,
  good_with_animals  boolean not null default false,
  special_care       boolean not null default false,
  emergency_note     text,
  portrait           jsonb,                         -- illustrated-portrait config
  is_public          boolean not null default true, -- admins can hide vulnerable animals
  is_demo            boolean not null default false,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index idx_animals_public   on animals(is_public) where is_public;
create index idx_animals_adoption on animals(adoption_status) where is_public;
create index idx_animals_species  on animals(species);
create index idx_animals_zone     on animals(zone_id);
create trigger trg_animals_updated before update on animals
  for each row execute function set_updated_at();

create table animal_photos (
  id          uuid primary key default gen_random_uuid(),
  animal_id   uuid not null references animals(id) on delete cascade,
  storage_path text not null,        -- Supabase Storage object path
  caption     text not null default '',
  taken_on    date,
  is_public   boolean not null default true,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);
create index idx_photos_animal on animal_photos(animal_id, sort_order);

-- periodic vet assessments (weight, condition score, etc.)
create table animal_health_records (
  id            uuid primary key default gen_random_uuid(),
  animal_id     uuid not null references animals(id) on delete cascade,
  recorded_on   date not null default current_date,
  weight_kg     numeric(5,2),
  condition     text,
  public_note   text not null default '',
  internal_note text not null default '',   -- never exposed publicly
  recorded_by   uuid references auth.users(id),
  created_at    timestamptz not null default now()
);
create index idx_health_animal on animal_health_records(animal_id, recorded_on desc);

create table animal_medical_events (
  id            uuid primary key default gen_random_uuid(),
  animal_id     uuid not null references animals(id) on delete cascade,
  event_date    date not null,
  event_type    medical_event_type not null,
  title         text not null,
  public_note   text,
  internal_note text,                        -- never exposed publicly
  created_by    uuid references auth.users(id),
  created_at    timestamptz not null default now()
);
create index idx_medical_animal on animal_medical_events(animal_id, event_date desc);

create table animal_sightings (
  id          uuid primary key default gen_random_uuid(),
  animal_id   uuid not null references animals(id) on delete cascade,
  seen_on     date not null default current_date,
  zone_id     text not null,       -- coarse zone; no precise coordinates here
  public_note text not null default '',
  reported_by uuid references auth.users(id),
  created_at  timestamptz not null default now()
);
create index idx_sightings_animal on animal_sightings(animal_id, seen_on desc);

-- QR tags: opaque tokens → animal. Replaceable without touching the animal.
create table qr_tags (
  id             uuid primary key default gen_random_uuid(),
  animal_id      uuid not null references animals(id) on delete cascade,
  token          text not null unique,       -- what the printed QR encodes
  active         boolean not null default true,
  deactivated_at timestamptz,
  created_by     uuid references auth.users(id),
  created_at     timestamptz not null default now()
);
create index idx_qr_token  on qr_tags(token) where active;
create index idx_qr_animal on qr_tags(animal_id);

-- privacy-conscious scan analytics: NO identity, NO precise location
create table qr_scans (
  id              uuid primary key default gen_random_uuid(),
  tag_id          uuid not null references qr_tags(id) on delete cascade,
  scanned_at      timestamptz not null default now(),
  device_category text,          -- 'mobile' | 'desktop' | 'other'
  referrer        text
);
create index idx_scans_tag on qr_scans(tag_id, scanned_at desc);

-- ============================================================
-- rescue reports
-- ============================================================

create table rescue_reports (
  id             uuid primary key default gen_random_uuid(),
  report_code    text not null unique,       -- PAWS-RESCUE-2026-00124 (public handle)
  reporter_id    uuid references auth.users(id),   -- null for anonymous reports
  reporter_contact text,                      -- optional; responders only
  animal_type    species not null,
  problem        report_problem not null,
  severity       report_severity not null default 'moderate',
  zone_id        text not null,
  location_note  text not null default '',
  -- precise coordinates: RESTRICTED. Never exposed through public views.
  lat            double precision,
  lng            double precision,
  photo_path     text,
  description    text not null,
  status         report_status not null default 'reported',
  linked_animal  uuid references animals(id),
  is_demo        boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index idx_reports_status   on rescue_reports(status) where status <> 'resolved';
create index idx_reports_severity on rescue_reports(severity);
create index idx_reports_code     on rescue_reports(report_code);
create trigger trg_reports_updated before update on rescue_reports
  for each row execute function set_updated_at();

create table report_updates (
  id         uuid primary key default gen_random_uuid(),
  report_id  uuid not null references rescue_reports(id) on delete cascade,
  status     report_status not null,
  note       text not null default '',      -- public-safe wording
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
create index idx_report_updates on report_updates(report_id, created_at);

-- ============================================================
-- volunteers
-- ============================================================

create table volunteers (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid unique references auth.users(id) on delete set null,
  full_name    text not null,
  email        text not null,
  phone        text not null,               -- coordinators only (RLS)
  affiliation  text not null default '',
  hall_dept    text,
  skills       text,
  availability text,
  interests    text[] not null default '{}',
  status       text not null default 'applied',  -- applied | active | inactive
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create trigger trg_volunteers_updated before update on volunteers
  for each row execute function set_updated_at();

create table volunteer_assignments (
  id           uuid primary key default gen_random_uuid(),
  volunteer_id uuid not null references volunteers(id) on delete cascade,
  report_id    uuid references rescue_reports(id) on delete cascade,
  task         text,
  due_on       date,
  done         boolean not null default false,
  created_at   timestamptz not null default now()
);
create index idx_assignments_volunteer on volunteer_assignments(volunteer_id, done);

-- ============================================================
-- donations & transparency
-- ============================================================

create table donation_campaigns (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  title       text not null,
  category    campaign_category not null,
  story       text not null default '',
  goal_amount integer not null check (goal_amount > 0),   -- INR
  animal_id   uuid references animals(id),
  active      boolean not null default true,
  is_demo     boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index idx_campaigns_active on donation_campaigns(active) where active;
create trigger trg_campaigns_updated before update on donation_campaigns
  for each row execute function set_updated_at();

create table donations (
  id             uuid primary key default gen_random_uuid(),
  campaign_id    uuid not null references donation_campaigns(id),
  donor_id       uuid references auth.users(id),   -- null = guest donation
  amount         integer not null check (amount >= 10),
  monthly        boolean not null default false,
  status         donation_status not null default 'created',
  gateway        text,                     -- 'razorpay' | 'upi_manual' | …
  gateway_order  text,
  gateway_ref    text,                     -- verified payment reference
  verified_at    timestamptz,
  created_at     timestamptz not null default now()
);
create index idx_donations_campaign on donations(campaign_id) where status = 'verified';
create index idx_donations_donor    on donations(donor_id);

-- public totals come ONLY from verified donations
create or replace view campaigns_with_totals
with (security_invoker = true) as
select
  c.*,
  coalesce(sum(d.amount) filter (where d.status = 'verified'), 0)::int  as raised_amount,
  count(distinct d.donor_id) filter (where d.status = 'verified')::int  as supporter_count
from donation_campaigns c
left join donations d on d.campaign_id = c.id
group by c.id;

create table campaign_expenses (
  id          uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references donation_campaigns(id) on delete cascade,
  spent_on    date not null default current_date,
  label       text not null,
  amount      integer not null check (amount > 0),
  created_by  uuid references auth.users(id),
  created_at  timestamptz not null default now()
);
create index idx_expenses_campaign on campaign_expenses(campaign_id, spent_on desc);

create table campaign_updates (
  id          uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references donation_campaigns(id) on delete cascade,
  note        text not null,
  created_by  uuid references auth.users(id),
  created_at  timestamptz not null default now()
);

-- ============================================================
-- adoption
-- ============================================================

create table adoption_applications (
  id             uuid primary key default gen_random_uuid(),
  app_code       text not null unique,        -- APP-2026-0042 (public handle)
  animal_id      uuid not null references animals(id),
  applicant_id   uuid references auth.users(id),
  applicant      jsonb not null,              -- {name,email,phone,affiliation}
  living         jsonb not null,
  experience     jsonb not null,
  motivation     text not null,
  status         application_status not null default 'submitted',
  internal_notes text not null default '',    -- reviewers only
  meet_at        timestamptz,
  is_demo        boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index idx_apps_animal on adoption_applications(animal_id, status);
create index idx_apps_user   on adoption_applications(applicant_id);
create trigger trg_apps_updated before update on adoption_applications
  for each row execute function set_updated_at();

-- ============================================================
-- stories (CMS)
-- ============================================================

create table stories (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  title         text not null,
  excerpt       text not null default '',
  category      text not null,
  animal_slug   text,
  author        text not null default 'KGP PAWS',
  read_minutes  int not null default 4,
  hero_palette  jsonb,                     -- ["#hex","#hex"]
  blocks        jsonb not null default '[]',
  seo_description text,
  status        story_status not null default 'draft',
  featured      boolean not null default false,
  published_at  timestamptz,
  scheduled_for timestamptz,
  is_demo       boolean not null default false,
  created_by    uuid references auth.users(id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index idx_stories_published on stories(status, published_at desc);
create trigger trg_stories_updated before update on stories
  for each row execute function set_updated_at();

create table story_media (
  id          uuid primary key default gen_random_uuid(),
  story_id    uuid not null references stories(id) on delete cascade,
  storage_path text not null,
  kind        text not null default 'image',   -- image | video
  caption     text not null default '',
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- config, notifications, audit
-- ============================================================

-- admin-editable impact metrics (never hardcoded in the app)
create table impact_metrics (
  id             uuid primary key default gen_random_uuid(),
  as_of          date not null default current_date,
  dogs_supported int not null default 0,
  cats_supported int not null default 0,
  vaccinated     int not null default 0,
  sterilized     int not null default 0,
  treated        int not null default 0,
  adopted        int not null default 0,
  note           text not null default '',
  updated_by     uuid references auth.users(id),
  created_at     timestamptz not null default now()
);

create table notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  kind       text not null,
  payload    jsonb not null default '{}',
  read_at    timestamptz,
  created_at timestamptz not null default now()
);
create index idx_notifications_user on notifications(user_id) where read_at is null;

create table audit_logs (
  id         uuid primary key default gen_random_uuid(),
  actor_id   uuid references auth.users(id),
  action     text not null,          -- 'animal.update', 'qr.reissue', …
  entity     text not null,          -- table name
  entity_id  uuid,
  diff       jsonb,
  created_at timestamptz not null default now()
);
create index idx_audit_entity on audit_logs(entity, entity_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table profiles               enable row level security;
alter table user_roles             enable row level security;
alter table animals                enable row level security;
alter table animal_photos          enable row level security;
alter table animal_health_records  enable row level security;
alter table animal_medical_events  enable row level security;
alter table animal_sightings       enable row level security;
alter table qr_tags                enable row level security;
alter table qr_scans               enable row level security;
alter table rescue_reports         enable row level security;
alter table report_updates         enable row level security;
alter table volunteers             enable row level security;
alter table volunteer_assignments  enable row level security;
alter table donation_campaigns     enable row level security;
alter table donations              enable row level security;
alter table campaign_expenses      enable row level security;
alter table campaign_updates       enable row level security;
alter table adoption_applications  enable row level security;
alter table stories                enable row level security;
alter table story_media            enable row level security;
alter table impact_metrics         enable row level security;
alter table notifications          enable row level security;
alter table audit_logs             enable row level security;

-- profiles: owners read/update themselves; admins read all
create policy profiles_own_read   on profiles for select using (id = auth.uid() or has_role(array['admin','super_admin']::user_role[]));
create policy profiles_own_update on profiles for update using (id = auth.uid());
create policy profiles_own_insert on profiles for insert with check (id = auth.uid());

-- user_roles: users see their own roles; only super_admin manages roles
create policy roles_self_read on user_roles for select
  using (user_id = auth.uid() or has_role(array['super_admin']::user_role[]));
create policy roles_admin_write on user_roles for all
  using (has_role(array['super_admin']::user_role[]))
  with check (has_role(array['super_admin']::user_role[]));

-- animals: anyone reads public rows; staff read all; admins write
create policy animals_public_read on animals for select
  using (is_public or has_role(array['volunteer','admin','super_admin']::user_role[]));
create policy animals_admin_write on animals for all
  using (has_role(array['admin','super_admin']::user_role[]))
  with check (has_role(array['admin','super_admin']::user_role[]));

-- child tables follow the parent animal's visibility
create policy photos_public_read on animal_photos for select
  using (
    is_public and exists (select 1 from animals a where a.id = animal_id and a.is_public)
    or has_role(array['volunteer','admin','super_admin']::user_role[])
  );
create policy photos_staff_write on animal_photos for all
  using (has_role(array['volunteer','admin','super_admin']::user_role[]))
  with check (has_role(array['volunteer','admin','super_admin']::user_role[]));

-- health records: internal by default (contain internal notes)
create policy health_staff_all on animal_health_records for all
  using (has_role(array['volunteer','admin','super_admin']::user_role[]))
  with check (has_role(array['volunteer','admin','super_admin']::user_role[]));

-- medical events: public timeline (public_note only is selected by the app);
-- clients must not select internal_note — enforce via column privileges:
revoke select (internal_note) on animal_medical_events from anon, authenticated;
create policy medical_public_read on animal_medical_events for select
  using (
    exists (select 1 from animals a where a.id = animal_id and a.is_public)
    or has_role(array['volunteer','admin','super_admin']::user_role[])
  );
create policy medical_staff_write on animal_medical_events for insert
  with check (has_role(array['volunteer','admin','super_admin']::user_role[]));
create policy medical_admin_update on animal_medical_events for update
  using (has_role(array['admin','super_admin']::user_role[]));

create policy sightings_public_read on animal_sightings for select
  using (
    exists (select 1 from animals a where a.id = animal_id and a.is_public)
    or has_role(array['volunteer','admin','super_admin']::user_role[])
  );
create policy sightings_staff_write on animal_sightings for insert
  with check (has_role(array['volunteer','admin','super_admin']::user_role[]));

-- qr_tags: token resolution is done server-side (route handler w/ anon key)
create policy qr_public_resolve on qr_tags for select using (active);
create policy qr_admin_write on qr_tags for all
  using (has_role(array['admin','super_admin']::user_role[]))
  with check (has_role(array['admin','super_admin']::user_role[]));

-- qr_scans: insert from server route; aggregate reads for admins
create policy scans_insert on qr_scans for insert with check (true);
create policy scans_admin_read on qr_scans for select
  using (has_role(array['admin','super_admin']::user_role[]));

-- rescue reports:
--   insert: anyone (incl. anonymous) — rate-limit at the edge (see README)
--   select: reporter, staff. Anonymous tracking uses get_report_status().
create policy reports_insert on rescue_reports for insert with check (true);
create policy reports_read on rescue_reports for select
  using (
    reporter_id = auth.uid()
    or has_role(array['volunteer','admin','super_admin']::user_role[])
  );
create policy reports_staff_update on rescue_reports for update
  using (has_role(array['volunteer','admin','super_admin']::user_role[]));

create policy report_updates_read on report_updates for select
  using (
    exists (
      select 1 from rescue_reports r
      where r.id = report_id
        and (r.reporter_id = auth.uid()
             or has_role(array['volunteer','admin','super_admin']::user_role[]))
    )
  );
create policy report_updates_write on report_updates for insert
  with check (has_role(array['volunteer','admin','super_admin']::user_role[]));

-- anonymous status tracking by report code — returns ONLY safe fields
create or replace function get_report_status(code text)
returns table (
  report_code text,
  animal_type species,
  problem report_problem,
  severity report_severity,
  zone_id text,
  status report_status,
  created_at timestamptz,
  updates jsonb
)
language sql stable security definer set search_path = public as $$
  select
    r.report_code, r.animal_type, r.problem, r.severity, r.zone_id,
    r.status, r.created_at,
    coalesce(
      (select jsonb_agg(jsonb_build_object(
         'status', u.status, 'note', u.note, 'date', u.created_at)
         order by u.created_at)
       from report_updates u where u.report_id = r.id),
      '[]'::jsonb
    )
  from rescue_reports r
  where r.report_code = upper(code);
$$;

-- volunteers: own row + coordinators; public never sees contact details
create policy volunteers_self_read on volunteers for select
  using (user_id = auth.uid() or has_role(array['admin','super_admin']::user_role[]));
create policy volunteers_apply on volunteers for insert with check (true);
create policy volunteers_admin_update on volunteers for update
  using (has_role(array['admin','super_admin']::user_role[]));

create policy assignments_read on volunteer_assignments for select
  using (
    exists (select 1 from volunteers v where v.id = volunteer_id and v.user_id = auth.uid())
    or has_role(array['admin','super_admin']::user_role[])
  );
create policy assignments_admin_write on volunteer_assignments for all
  using (has_role(array['admin','super_admin']::user_role[]))
  with check (has_role(array['admin','super_admin']::user_role[]));

-- campaigns: public read of active; admin write
create policy campaigns_public_read on donation_campaigns for select
  using (active or has_role(array['admin','super_admin']::user_role[]));
create policy campaigns_admin_write on donation_campaigns for all
  using (has_role(array['admin','super_admin']::user_role[]))
  with check (has_role(array['admin','super_admin']::user_role[]));

-- donations: PRIVATE. Donors see their own; admins see all.
-- Inserts/updates only via service-role (server) — no client policy.
create policy donations_own_read on donations for select
  using (donor_id = auth.uid() or has_role(array['admin','super_admin']::user_role[]));

-- transparency: expenses & updates are public
create policy expenses_public_read on campaign_expenses for select using (true);
create policy expenses_admin_write on campaign_expenses for all
  using (has_role(array['admin','super_admin']::user_role[]))
  with check (has_role(array['admin','super_admin']::user_role[]));
create policy cupdates_public_read on campaign_updates for select using (true);
create policy cupdates_admin_write on campaign_updates for all
  using (has_role(array['admin','super_admin']::user_role[]))
  with check (has_role(array['admin','super_admin']::user_role[]));

-- adoption applications: applicant + reviewers only
create policy apps_insert on adoption_applications for insert with check (true);
create policy apps_own_read on adoption_applications for select
  using (applicant_id = auth.uid() or has_role(array['admin','super_admin']::user_role[]));
create policy apps_admin_update on adoption_applications for update
  using (has_role(array['admin','super_admin']::user_role[]));
revoke select (internal_notes) on adoption_applications from authenticated;

-- stories: published are public; drafts admin-only
create policy stories_public_read on stories for select
  using (status = 'published' or has_role(array['admin','super_admin']::user_role[]));
create policy stories_admin_write on stories for all
  using (has_role(array['admin','super_admin']::user_role[]))
  with check (has_role(array['admin','super_admin']::user_role[]));
create policy story_media_read on story_media for select
  using (
    exists (select 1 from stories s where s.id = story_id and s.status = 'published')
    or has_role(array['admin','super_admin']::user_role[])
  );
create policy story_media_admin_write on story_media for all
  using (has_role(array['admin','super_admin']::user_role[]))
  with check (has_role(array['admin','super_admin']::user_role[]));

-- impact metrics: public read, admin write
create policy metrics_public_read on impact_metrics for select using (true);
create policy metrics_admin_write on impact_metrics for all
  using (has_role(array['admin','super_admin']::user_role[]))
  with check (has_role(array['admin','super_admin']::user_role[]));

-- notifications: own only
create policy notifications_own on notifications for select using (user_id = auth.uid());
create policy notifications_own_update on notifications for update using (user_id = auth.uid());

-- audit logs: super_admin read; writes happen via triggers/service role
create policy audit_super_read on audit_logs for select
  using (has_role(array['super_admin']::user_role[]));

-- ---------- audit trigger (example wiring on sensitive tables) ----------
create or replace function log_audit() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into audit_logs (actor_id, action, entity, entity_id, diff)
  values (
    auth.uid(),
    tg_table_name || '.' || lower(tg_op),
    tg_table_name,
    coalesce(new.id, old.id),
    case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end
  );
  return coalesce(new, old);
end $$;

create trigger audit_animals   after insert or update or delete on animals
  for each row execute function log_audit();
create trigger audit_qr_tags   after insert or update or delete on qr_tags
  for each row execute function log_audit();
create trigger audit_campaigns after insert or update or delete on donation_campaigns
  for each row execute function log_audit();
create trigger audit_apps      after update on adoption_applications
  for each row execute function log_audit();

-- ============================================================
-- COLUMN-LEVEL GRANTS FOR PUBLIC WRITES
--
-- The public INSERT policies above intentionally allow anonymous writes —
-- reporting an injured animal must never require a login. But RLS only
-- decides WHICH ROWS may be inserted, not WHICH COLUMNS. Supabase grants
-- anon/authenticated table-level INSERT by default, and a table-level grant
-- implies every column, so `WITH CHECK (true)` alone would let a crafted
-- request submit an adoption application already marked `approved`, or write
-- staff-only internal_notes.
--
-- A column-level REVOKE cannot subtract from a table-level grant. The working
-- pattern is: revoke INSERT at table level, then grant back an explicit list
-- of safe columns. service_role is unaffected, so server route handlers can
-- still set triage/approval columns.
-- ============================================================

revoke insert on adoption_applications from anon, authenticated;
grant insert (
  app_code, animal_id, applicant_id, applicant, living, experience, motivation
) on adoption_applications to anon, authenticated;
-- withheld: status, internal_notes, is_demo, meet_at

revoke insert on rescue_reports from anon, authenticated;
grant insert (
  report_code, reporter_id, reporter_contact, animal_type, problem, severity,
  zone_id, location_note, lat, lng, photo_path, description
) on rescue_reports to anon, authenticated;
-- withheld: status, linked_animal, is_demo

revoke insert on volunteers from anon, authenticated;
grant insert (
  user_id, full_name, email, phone, affiliation, hall_dept, skills,
  availability, interests
) on volunteers to anon, authenticated;
-- withheld: status

-- log_audit is a trigger function and must not be reachable over RPC.
-- Postgres grants EXECUTE on new functions to PUBLIC by default and
-- anon/authenticated inherit that, so revoking from those two roles alone is
-- a no-op — it must be revoked from PUBLIC. Trigger invocation does not check
-- the caller's EXECUTE, so the audit triggers keep firing with no grant.
revoke execute on function log_audit() from public, anon, authenticated;

-- Deliberately NOT revoked:
--   • get_report_status — anonymous report tracking is a product requirement;
--     returns only safe columns (no lat/lng, no reporter_contact).
--   • has_role — RLS policy expressions evaluate as the calling role, so
--     revoking EXECUTE would break every policy that calls it. It only reports
--     whether the *caller* holds a role, so it leaks nothing.
--   • campaign_totals — campaigns_with_totals is security_invoker, so the
--     public view calls this as the caller; revoking would break donation
--     totals for anonymous visitors. It returns only an aggregate, which is
--     exactly what the view already publishes.
