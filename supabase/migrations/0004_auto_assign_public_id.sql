-- Migration 0002 backfilled public_id for existing rows but added no
-- trigger for new ones — the very next insert (the real "dreamland" animal)
-- failed with a not-null violation, caught immediately by testing rather
-- than assuming the migration was complete. This closes that gap.
create or replace function assign_animal_public_id() returns trigger
language plpgsql as $$
begin
  if new.public_id is null then
    new.public_id := next_animal_public_id(new.species);
  end if;
  return new;
end $$;

create trigger trg_animals_public_id before insert on animals
  for each row execute function assign_animal_public_id();
