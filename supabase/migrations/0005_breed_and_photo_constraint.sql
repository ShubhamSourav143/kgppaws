-- Two small gap-closes found while wiring up the real-photo pipeline:
--   1. The documented Dogs sheet (GOOGLE_SHEETS_SCHEMA.md) has a Breed
--      column with nothing on `animals` to map it to.
--   2. The Drive ingest route upserts `animal_photos` by
--      (animal_id, storage_path), which needs a real unique constraint —
--      would have errored on the route's first real run otherwise.
alter table animals add column if not exists breed text not null default '';
alter table animal_photos add constraint animal_photos_animal_path_key unique (animal_id, storage_path);
