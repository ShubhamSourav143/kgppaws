-- ============================================================
-- Migration 0014 — close two read-side holes found in the
-- 2026-08 production audit.
--
-- NOT YET APPLIED. Review, then run against staging before
-- production: this migration changes table-level privileges, and
-- an incomplete column list here shows up as a 403 on a public
-- page rather than a build failure.
-- ============================================================


-- ------------------------------------------------------------
-- 1. Staff-only columns were readable by anon.
--
-- 0001 tried to withhold them with column-level REVOKEs:
--
--   0001:515  revoke select (internal_note)  on animal_medical_events from anon, authenticated;
--   0001:640  revoke select (internal_notes) on adoption_applications  from authenticated;
--
-- Those are no-ops. A column-level REVOKE cannot subtract from a
-- table-level GRANT, and Supabase grants table-level SELECT on the
-- public schema to anon and authenticated. 0001 knows this — it says
-- so at line 706 and applies the correct pattern for INSERT
-- (revoke at table level, grant back an explicit column list) — the
-- SELECT statements simply never got the same treatment.
--
-- Effect before this migration: any visitor using the public anon key
-- could read `internal_note` on every medical event belonging to a
-- public animal, and `animals.internal_note` / `animals.emergency_note`
-- (never revoked at all) for every public animal. An applicant could
-- read the reviewers' `internal_notes` on their own adoption
-- application.
--
-- The app-side half of this fix is already in place: PUBLIC_ANIMAL_SELECT
-- in services/animal-mapper.ts now names its columns instead of `*`.
-- This is the half that holds even if someone queries with the anon key
-- directly.
-- ------------------------------------------------------------

-- animals: everything except internal_note.
-- emergency_note stays granted — mapAnimalRow() maps it to Animal.emergencyNote
-- and the UI consumes it. Narrowing that is a product decision, not a bug fix,
-- so it is called out in the audit report rather than changed here.
revoke select on animals from anon, authenticated;
grant select (
  id, paws_id, slug, name, species, sex, age_label, color, size, zone_id,
  tagline, personality, bio, friendliness, vaccinated, sterilized,
  health_status, health_note, last_health_update, adoption_status,
  good_with_people, good_with_animals, special_care, emergency_note,
  portrait, is_public, is_demo, created_at, updated_at
) on animals to anon, authenticated;

-- animal_medical_events: the public timeline only.
revoke select on animal_medical_events from anon, authenticated;
grant select (
  id, animal_id, event_date, event_type, title, public_note, created_at
) on animal_medical_events to anon, authenticated;

-- adoption_applications: an applicant may read their own row (RLS decides
-- which rows) but never the reviewers' notes on it. Every column except
-- internal_notes is granted back — the "reviewers only" comment in 0001
-- applies to that column alone.
revoke select on adoption_applications from anon, authenticated;
grant select (
  id, app_code, animal_id, applicant_id, applicant, living, experience,
  motivation, status, meet_at, is_demo, created_at, updated_at
) on adoption_applications to anon, authenticated;


-- ------------------------------------------------------------
-- 2. The `submissions` bucket was enumerable.
--
-- 0013 makes the bucket public. That is a recorded product decision
-- ("User decision: the bucket is public") and is NOT changed here:
-- public object URLs keep working exactly as before.
--
-- What that decision rests on is stated in the same comment —
-- "Filenames use UUIDs so URLs aren't guessable". The
-- `submissions_public_read` policy undercuts it: a SELECT policy on
-- storage.objects is what powers storage.from('submissions').list(),
-- so anyone holding the (public) anon key could enumerate every object
-- path in the bucket and then fetch each one. Bite-report wound photos
-- and medical PDFs were listable, not just reachable-if-leaked.
--
-- Dropping the policy removes listing. It does not affect reads through
-- the public object endpoint, which bypasses RLS for a public bucket,
-- and it does not affect writes, which go through service-role signed
-- upload URLs (0013:37-39).
--
-- Verify after applying:
--   • a public attachment URL from a past submission still loads
--   • supabase.storage.from('submissions').list() with the anon key
--     returns an empty array
-- ------------------------------------------------------------

drop policy if exists submissions_public_read on storage.objects;


-- ------------------------------------------------------------
-- 3. Admins could not approve a UPI donation.
--
-- 0010 creates `donation_conf_admin_all` as a `for all` policy, but the
-- grants below it cover only SELECT and INSERT. RLS filters rows; it does
-- not confer privileges. With no UPDATE privilege on the table, an admin
-- moving a confirmation from 'pending' to 'approved' — the one step that
-- puts a donor on the public wall — gets a permission error no matter
-- what the policy says.
--
-- Granted narrowly, and only to authenticated: just the columns an
-- approval touches. The admin-only policy is still what decides who may
-- use them, and the deliberate column-level SELECT/INSERT lists in 0010
-- are left exactly as they are (a blanket `grant update` or re-grant of
-- select/insert here would quietly widen donor phone/email exposure).
-- ------------------------------------------------------------

grant update (status, approved_by, approved_at, is_public, updated_at)
  on donation_confirmations to authenticated;
