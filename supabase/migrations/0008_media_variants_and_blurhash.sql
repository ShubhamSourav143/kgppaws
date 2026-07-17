-- ============================================================
-- Migration 0008 — media variant metadata + blurhash + broken-media flag
--
-- Extends animal_photos and story_media to carry the M-CMS-3 variant ladder
-- and a blurhash placeholder. Adds a broken-media detection flag so the
-- nightly sweep can mark rows without needing a separate table.
-- ============================================================

alter table animal_photos add column if not exists variants jsonb;
alter table animal_photos add column if not exists blurhash text;
alter table animal_photos add column if not exists width int;
alter table animal_photos add column if not exists height int;
alter table animal_photos add column if not exists broken_at timestamptz;

alter table story_media add column if not exists variants jsonb;
alter table story_media add column if not exists blurhash text;
alter table story_media add column if not exists width int;
alter table story_media add column if not exists height int;
alter table story_media add column if not exists broken_at timestamptz;

alter table drive_assets add column if not exists variants_metadata jsonb;
alter table drive_assets add column if not exists blurhash text;
alter table drive_assets add column if not exists width int;
alter table drive_assets add column if not exists height int;
