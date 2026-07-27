-- ============================================================
-- 0012_user_approval_workflow.sql
-- ============================================================
-- Add a pending-approval gate to every new account.
--
-- Motivation:
--   The client-side "pending approval" screen after signup is only useful
--   if the server actually blocks unapproved users from taking write
--   actions. This migration turns user_roles.role into two orthogonal
--   pieces of state:
--     * `role`         — user | volunteer | admin | super_admin (as before)
--     * `is_approved`  — false by default; only admins can flip this
--   and updates the has_role() helper so it treats unapproved users as
--   if they had no role.
--
-- What changes:
--   1. user_roles gains an `is_approved` boolean, defaulting to false.
--      Existing rows are backfilled to TRUE so no current staff loses
--      access — approval only gates *new* signups from now on.
--   2. has_role() now requires is_approved = true. Every existing RLS
--      policy that calls has_role() (there are many) automatically
--      inherits the gate — no per-table changes needed.
--   3. New admin-only helpers:
--        approve_user(uuid, user_role)  — flips is_approved and sets role
--        set_user_role(uuid, user_role) — reassigns role (admin only)
--   4. A trigger on auth.users creates an unapproved user_roles row for
--      every new signup, so admins have something to see and approve.
--
-- Rollback: drop the trigger, the two helper functions, and the column
-- (approved defaults would then need re-backfilling if reintroduced).
-- ============================================================

alter table user_roles
  add column if not exists is_approved boolean not null default false,
  add column if not exists approved_by uuid references auth.users(id),
  add column if not exists approved_at timestamptz;

-- Existing users on install day are grandfathered in — otherwise this
-- migration would lock every current admin out of their own dashboard.
update user_roles set is_approved = true, approved_at = now() where is_approved = false;

-- Replace has_role() so an unapproved account is invisible to every RLS
-- policy that gates on a role. Signature and callers are unchanged.
create or replace function has_role(required user_role[]) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from user_roles
    where user_id = auth.uid()
      and is_approved = true
      and role = any(required)
  );
$$;

-- Helper: was the caller ever approved? Useful for pages that want to
-- distinguish "not signed in" from "signed in but still pending".
create or replace function is_approved_user() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from user_roles
    where user_id = auth.uid() and is_approved = true
  );
$$;

-- Admin action: approve a pending signup and (optionally) assign a role.
create or replace function approve_user(target uuid, new_role user_role default 'user')
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not has_role(array['admin','super_admin']::user_role[]) then
    raise exception 'only admins can approve users';
  end if;
  update user_roles
    set is_approved = true,
        role = new_role,
        approved_by = auth.uid(),
        approved_at = now()
  where user_id = target;
end;
$$;

-- Admin action: change a user's role after approval. Super-admin only so
-- one admin cannot escalate another to super_admin.
create or replace function set_user_role(target uuid, new_role user_role)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not has_role(array['super_admin']::user_role[]) then
    raise exception 'only super admins can change roles';
  end if;
  update user_roles set role = new_role where user_id = target;
end;
$$;

-- Trigger: every new auth.users row gets a matching pending user_roles row.
-- Runs as security definer because auth.users triggers execute in a
-- restricted context that cannot see the user_roles policies.
create or replace function public.handle_new_user_signup()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  insert into user_roles (user_id, role, is_approved)
  values (new.id, 'user', false)
  on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user_signup();
