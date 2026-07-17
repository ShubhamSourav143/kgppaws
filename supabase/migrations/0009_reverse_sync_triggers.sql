-- ============================================================
-- Migration 0009 — DB → Sheets sync triggers (M-CMS-5)
--
-- After INSERT or UPDATE on the three transactional tables, enqueue a
-- single-row db_to_sheets sync job. Dedup on the sync_jobs unique index
-- means rapid successive updates coalesce naturally.
-- ============================================================

create or replace function enqueue_db_to_sheets_sync() returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
declare
  target_tab text;
begin
  target_tab := case tg_table_name
    when 'adoption_applications'  then 'Adoption Applications'
    when 'donation_confirmations' then 'Donation Confirmations'
    when 'rescue_reports'         then 'Reports'
    else null
  end;
  if target_tab is null then
    return new;
  end if;

  insert into sync_jobs (tab, direction, scope, row_id, triggered_by, next_run_at)
  values (target_tab, 'db_to_sheets', 'row', new.id, 'trigger', now())
  on conflict do nothing;
  return new;
end $fn$;

drop trigger if exists tr_adoption_applications_sync on adoption_applications;
create trigger tr_adoption_applications_sync
  after insert or update on adoption_applications
  for each row execute function enqueue_db_to_sheets_sync();

drop trigger if exists tr_donation_confirmations_sync on donation_confirmations;
-- donation_confirmations doesn't exist yet (M5); guard by feature.
do $$ begin
  if exists (select 1 from information_schema.tables
             where table_schema='public' and table_name='donation_confirmations') then
    execute 'create trigger tr_donation_confirmations_sync '
         || 'after insert or update on donation_confirmations '
         || 'for each row execute function enqueue_db_to_sheets_sync()';
  end if;
end $$;

drop trigger if exists tr_rescue_reports_sync on rescue_reports;
create trigger tr_rescue_reports_sync
  after insert or update on rescue_reports
  for each row execute function enqueue_db_to_sheets_sync();
