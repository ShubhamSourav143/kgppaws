-- Permanent, properly-scoped policy: only authenticated admins may write to
-- the animal-photos bucket (public read already exists from bucket creation
-- — see the one-time bucket setup this migration assumes has already run:
--   insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
--   values ('animal-photos', 'animal-photos', true, 10485760,
--           array['image/jpeg','image/png','image/webp','image/avif']);
--   create policy "animal photos public read" on storage.objects
--     for select using (bucket_id = 'animal-photos');
--
-- This is the real, long-term policy the admin dashboard's photo upload
-- feature needs — not a temporary hole. An earlier attempt at a temporary
-- `for insert to anon` policy was blocked by this session's own safety
-- tooling as a public-write security concern; this is the corrected design.
create policy "admin_write_animal_photos" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'animal-photos' and has_role(array['admin','super_admin']::user_role[]));

create policy "admin_update_animal_photos" on storage.objects
  for update to authenticated
  using (bucket_id = 'animal-photos' and has_role(array['admin','super_admin']::user_role[]))
  with check (bucket_id = 'animal-photos' and has_role(array['admin','super_admin']::user_role[]));
