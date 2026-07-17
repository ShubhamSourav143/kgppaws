-- ============================================================
-- Migration 0010 — donation_confirmations (M5 groundwork)
--
-- UPI model: donor pays via UPI QR, then submits UTR + amount. Admin
-- approves before the row appears on the public "Recent Donors" wall.
-- ============================================================

create table if not exists donation_confirmations (
  id             uuid primary key default gen_random_uuid(),
  campaign_id    uuid references donation_campaigns(id),
  campaign_slug  text,
  donor_name     text not null,
  donor_email    text,
  donor_phone    text,
  amount         int not null check (amount > 0),
  utr            text not null,
  purpose        text,
  message        text,
  status         text not null default 'pending' check (status in ('pending','approved','rejected')),
  approved_by    uuid references auth.users(id),
  approved_at    timestamptz,
  is_public      boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists idx_donation_confirmations_status on donation_confirmations (status);
create index if not exists idx_donation_confirmations_campaign on donation_confirmations (campaign_slug);

alter table donation_confirmations enable row level security;
drop policy if exists donation_conf_public_insert on donation_confirmations;
drop policy if exists donation_conf_owner_read on donation_confirmations;
drop policy if exists donation_conf_admin_all on donation_confirmations;
drop policy if exists donation_conf_public_read_approved on donation_confirmations;

create policy donation_conf_public_insert on donation_confirmations for insert
  with check (
    status = 'pending' and
    approved_by is null and
    approved_at is null and
    is_public = false
  );
create policy donation_conf_admin_all on donation_confirmations for all
  using (has_role(array['admin','super_admin']::user_role[]))
  with check (has_role(array['admin','super_admin']::user_role[]));
create policy donation_conf_public_read_approved on donation_confirmations for select
  using (status = 'approved' and is_public = true);

-- Column-level defense in depth: never leak donor phone/email through general reads.
revoke all on donation_confirmations from anon, authenticated;
grant select (id, campaign_slug, donor_name, amount, message, status, is_public, created_at)
  on donation_confirmations to anon, authenticated;
grant insert (campaign_slug, donor_name, donor_email, donor_phone, amount, utr, purpose, message)
  on donation_confirmations to anon, authenticated;

-- updated_at trigger + DB→Sheets trigger (function already defined in 0009)
drop trigger if exists tr_donation_confirmations_updated_at on donation_confirmations;
create trigger tr_donation_confirmations_updated_at before update on donation_confirmations
  for each row execute function set_updated_at();

drop trigger if exists tr_donation_confirmations_sync on donation_confirmations;
create trigger tr_donation_confirmations_sync
  after insert or update on donation_confirmations
  for each row execute function enqueue_db_to_sheets_sync();
