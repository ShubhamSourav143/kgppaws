-- ============================================================
-- Migration 0011 — notification_outbox (M6 groundwork)
-- ============================================================

create table if not exists notification_outbox (
  id           uuid primary key default gen_random_uuid(),
  channel      text not null check (channel in ('email','whatsapp')),
  template     text not null,
  payload      jsonb not null default '{}'::jsonb,
  status       text not null default 'pending' check (status in ('pending','sent','failed','skipped')),
  attempts     int not null default 0,
  last_error   text,
  created_at   timestamptz not null default now(),
  sent_at      timestamptz
);
create index if not exists idx_notification_outbox_pending on notification_outbox (created_at)
  where status = 'pending';

alter table notification_outbox enable row level security;
drop policy if exists notif_outbox_admin_read on notification_outbox;
create policy notif_outbox_admin_read on notification_outbox for select
  using (has_role(array['admin','super_admin']::user_role[]));
-- Writes are service-role only.
