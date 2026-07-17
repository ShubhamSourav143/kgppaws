-- ============================================================
-- Migration 0007 — pin search_path on 0002/0004-era functions
--
-- Supabase advisor 0011 (function_search_path_mutable) flagged
-- next_animal_public_id and assign_animal_public_id — the same
-- privilege-escalation class fixed for set_updated_at in M1.
-- Surfaced by the post-0006 advisor sweep (see CHANGELOG 2026-07-17).
-- ============================================================

alter function next_animal_public_id(species) set search_path = public;
alter function assign_animal_public_id() set search_path = public;
