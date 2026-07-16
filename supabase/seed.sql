-- ============================================================
-- KGP PAWS — DEMO SEED DATA
-- Every row is marked is_demo = true and is clearly fictional.
-- Run after 0001_initial_schema.sql:  supabase db reset  (or psql -f)
-- ============================================================

-- ---------- animals ----------
insert into animals
  (id, paws_id, slug, name, species, sex, age_label, color, size, zone_id,
   tagline, personality, bio, friendliness, vaccinated, sterilized,
   health_status, health_note, last_health_update, adoption_status,
   good_with_people, good_with_animals, special_care, portrait, is_demo)
values
  ('d3adbeef-0001-4a01-9c01-000000000001','PAWS-KGP-DOG-0012','simba','Simba','dog','male','~3 years','Honey tan','medium','tech-market',
   'Quiet observer. Professional biscuit negotiator.',
   array['Calm','Gentle','Food motivated','Good with dogs'],
   'Simba spent his first two years keeping a careful distance from people. An injured paw in April 2026 changed everything — three weeks of treatment taught him that hands can be kind.',
   'friendly', true, true, 'healthy',
   'Fully recovered from an April paw injury. Safe & healthy.', '2026-06-28',
   'available', true, true, false,
   '{"from":"#E9C98F","to":"#C97F45","coat":"#D9A05B","coatDark":"#A96F35","muzzle":"#F2E3C9","ear":"half","patch":"left-eye","patchColor":"#B37B41","tongue":true}', true),

  ('d3adbeef-0002-4a02-9c02-000000000002','PAWS-KGP-DOG-0018','muesli','Muesli','dog','female','~1.5 years','Brown & white','medium','gymkhana',
   'High energy. Zero understanding of personal space.',
   array['Playful','Affectionate','Energetic','Loves fetch'],
   'Muesli believes every human on campus is her personal friend who simply has not been greeted yet. Hand-raised by hostel volunteers, she is one of our strongest adoption candidates.',
   'friendly', true, false, 'healthy',
   'Healthy and active. Sterilization scheduled for the August camp.', '2026-07-01',
   'available', true, true, false,
   '{"from":"#E7D6BC","to":"#B08968","coat":"#A9744C","coatDark":"#7C5233","muzzle":"#F4EADB","ear":"floppy","patch":"blaze","patchColor":"#F4EADB","tongue":true}', true),

  ('d3adbeef-0003-4a03-9c03-000000000003','PAWS-KGP-DOG-0004','shanti','Shanti','dog','female','~6 years','Black','medium','main-building',
   'The unofficial dean of the Main Building steps.',
   array['Calm','Dignified','Gentle','Independent'],
   'Shanti has held her post at the Main Building steps for six years. A classic community dog — the campus is her home. PAWS supports her with meals, vaccination and senior joint care.',
   'friendly', true, true, 'monitoring',
   'Senior wellness monitoring — mild hind-leg stiffness, managed with supplements.', '2026-06-15',
   'not_available', true, true, true,
   '{"from":"#C9CBC4","to":"#6E7570","coat":"#3A3E3B","coatDark":"#232724","muzzle":"#8E9490","ear":"half","tongue":false}', true),

  ('d3adbeef-0004-4a04-9c04-000000000004','PAWS-KGP-DOG-0021','bunti','Bunti','dog','male','~2 years','Brindle','medium','rk-hall',
   'Tail first, thinks later.',
   array['Enthusiastic','Clumsy','Loyal','Food motivated'],
   'Bunti runs RK Hall''s mess entrance like a headquarters. A treatable skin condition has him on weekly medicated baths — a foster home would speed his recovery.',
   'friendly', true, true, 'under_treatment',
   'Skin condition responding well to medicated baths. Foster home would speed recovery.', '2026-07-06',
   'foster_needed', true, false, true,
   '{"from":"#D8C3A5","to":"#8C6A4F","coat":"#8A6644","coatDark":"#5E432C","muzzle":"#E8D9C2","ear":"floppy","patch":"right-eye","patchColor":"#5E432C","tongue":true}', true),

  ('d3adbeef-0005-4a05-9c05-000000000005','PAWS-KGP-DOG-0033','laika','Laika','dog','female','~4 months','Fawn','small','nalanda',
   'Small. Loud. Convinced she runs Nalanda.',
   array['Bold','Curious','Vocal','Playful'],
   'Sole survivor of a litter found in the March rains, bottle-fed by volunteers into a confident, curious puppy. At the perfect age to join a family.',
   'friendly', true, false, 'healthy',
   'Thriving. Second vaccination dose completed; final dose due in 3 weeks.', '2026-07-03',
   'available', true, true, false,
   '{"from":"#F2DEB8","to":"#D19A5B","coat":"#E0B375","coatDark":"#B3854A","muzzle":"#F7ECD8","ear":"pointed","tongue":true}', true),

  ('d3adbeef-0006-4a06-9c06-000000000006','PAWS-KGP-CAT-0007','percy','Percy','cat','male','~2 years','Grey tabby','small','library',
   'Sits on books. Judges silently.',
   array['Calm','Observant','Selective','Lap connoisseur'],
   'Percy operates out of the Central Library as self-appointed Head of Quality Control. Vaccinated, sterilized, and — unlike most library regulars — available for adoption.',
   'selective', true, true, 'healthy',
   'Excellent condition. Annual checkup complete.', '2026-06-05',
   'available', true, false, false,
   '{"from":"#D5D9D2","to":"#7E8C86","coat":"#98A29A","coatDark":"#5F6A63","muzzle":"#E6EAE3","ear":"pointed","patch":"blaze","patchColor":"#E6EAE3","tongue":false}', true),

  ('d3adbeef-0007-4a07-9c07-000000000007','PAWS-KGP-CAT-0011','mishti','Mishti','cat','female','~1 year','Calico','small','vs-hall',
   'Softest meow on campus. Uses it responsibly.',
   array['Sweet','Shy at first','Gentle','Curious'],
   'Mishti arrived at VS Hall small, hungry, and nursing a badly infected eye. Two months of patient treatment later, both eyes are bright. Recovering fastest in a foster home.',
   'shy', true, false, 'recovering',
   'Eye infection fully treated; final follow-up due mid-July. Foster home preferred.', '2026-07-02',
   'foster_needed', true, true, true,
   '{"from":"#F0DCC8","to":"#C48A5A","coat":"#E3C49B","coatDark":"#9A6B3F","muzzle":"#F8EEDF","ear":"pointed","patch":"right-eye","patchColor":"#9A6B3F","tongue":false}', true),

  ('d3adbeef-0008-4a08-9c08-000000000008','PAWS-KGP-DOG-0027','rocket','Rocket','dog','male','~2 years','White & tan','medium','main-gate',
   'Fast. Cautious. Faster when cautious.',
   array['Alert','Cautious','Independent','Smart'],
   'The Main Gate area''s early-warning system. A healthy, self-sufficient community dog who accepts food on his own terms. Not seeking a family; he has a job.',
   'cautious', true, false, 'healthy',
   'Healthy. Sterilization planned once trust-building allows safe handling.', '2026-06-10',
   'not_available', false, true, false,
   '{"from":"#EDE4D3","to":"#B59B77","coat":"#E8DCC6","coatDark":"#B08D5F","muzzle":"#F8F2E6","ear":"pointed","patch":"left-eye","patchColor":"#C9A063","tongue":false}', true);

-- ---------- qr tags ----------
insert into qr_tags (animal_id, token) values
  ('d3adbeef-0001-4a01-9c01-000000000001','t7kd2mqx'),
  ('d3adbeef-0002-4a02-9c02-000000000002','m3sl1vkq'),
  ('d3adbeef-0003-4a03-9c03-000000000003','sh4nt1pz'),
  ('d3adbeef-0004-4a04-9c04-000000000004','bnt1w8rd'),
  ('d3adbeef-0005-4a05-9c05-000000000005','l4ik9puq'),
  ('d3adbeef-0006-4a06-9c06-000000000006','prc7xt2n'),
  ('d3adbeef-0007-4a07-9c07-000000000007','msht5ye3'),
  ('d3adbeef-0008-4a08-9c08-000000000008','rkt8vz4a');

-- ---------- medical events (Simba's documented arc + a sample per animal) ----------
insert into animal_medical_events (animal_id, event_date, event_type, title, public_note) values
  ('d3adbeef-0001-4a01-9c01-000000000001','2026-03-12','vaccination','Anti-rabies vaccination','Annual booster administered during the spring drive.'),
  ('d3adbeef-0001-4a01-9c01-000000000001','2026-04-18','injury','Minor paw injury reported','Limping reported near Technology Market via a PAWS report.'),
  ('d3adbeef-0001-4a01-9c01-000000000001','2026-04-19','treatment','Treatment started','Wound cleaned and dressed; oral antibiotics for 7 days.'),
  ('d3adbeef-0001-4a01-9c01-000000000001','2026-04-27','recovery','Recovered','Walking normally. Follow-up check clear.'),
  ('d3adbeef-0002-4a02-9c02-000000000002','2026-02-08','vaccination','Anti-rabies vaccination',null),
  ('d3adbeef-0003-4a03-9c03-000000000003','2026-06-15','checkup','Senior wellness check','Mild hind-leg stiffness. Joint supplements started.'),
  ('d3adbeef-0004-4a04-9c04-000000000004','2026-05-24','treatment','Skin treatment started','Weekly medicated baths and skin supplement.'),
  ('d3adbeef-0005-4a05-9c05-000000000005','2026-07-03','vaccination','Second vaccination dose','Final dose scheduled late July.'),
  ('d3adbeef-0006-4a06-9c06-000000000006','2025-08-19','sterilization','Sterilized','Routine recovery, back on duty in 48 hours.'),
  ('d3adbeef-0007-4a07-9c07-000000000007','2026-06-25','recovery','Eye infection cleared','Both eyes healthy. Final follow-up mid-July.'),
  ('d3adbeef-0008-4a08-9c08-000000000008','2026-02-26','vaccination','Anti-rabies vaccination','Administered during the gate-area drive.');

-- ---------- campaigns ----------
insert into donation_campaigns (id, slug, title, category, story, goal_amount, animal_id, is_demo) values
  ('cafe0001-0000-4000-8000-000000000001','90-days-of-campus-feeding','90 Days of Campus Feeding','feeding',
   'The 4:55 AM feeding rickshaw runs 365 days a year. This campaign funds one full quarter: rice, eggs, kibble, and cooking fuel.', 30000, null, true),
  ('cafe0002-0000-4000-8000-000000000002','simbas-recovery-fund','Simba''s Recovery Fund','recovery',
   'Simba''s paw has healed — this fund replenishes the treatment float that paid for it.', 12000,
   'd3adbeef-0001-4a01-9c01-000000000001', true),
  ('cafe0003-0000-4000-8000-000000000003','vaccination-drive-2026','Vaccination Drive 2026','vaccination',
   'Annual anti-rabies vaccination for the full campus dog and cat population.', 45000, null, true),
  ('cafe0004-0000-4000-8000-000000000004','sterilization-support','Sterilization Support','sterilization',
   'Each procedure covers surgery, post-op care, and safe release back to the animal''s territory.', 60000, null, true),
  ('cafe0005-0000-4000-8000-000000000005','emergency-medical-fund','Emergency Medical Fund','emergency',
   'The standing reserve that lets volunteers say yes immediately at midnight.', 50000, null, true);

-- Demo VERIFIED donations so campaigns_with_totals shows realistic values
-- (clearly demo: donor_id null, gateway 'demo_seed').
-- Amounts are per-campaign, NOT cross-joined: an earlier version applied the
-- same three amounts to every campaign, which pushed Simba's ₹12,000 fund to
-- 153% funded. Each set below stays under its campaign's goal.
insert into donations (campaign_id, amount, status, gateway, gateway_ref, verified_at)
select c.id, v.amt, 'verified', 'demo_seed',
       'SEED-' || c.slug || '-' || v.amt, now()
from donation_campaigns c
join lateral (
  values
    ('90-days-of-campus-feeding', 5000), ('90-days-of-campus-feeding', 3400), ('90-days-of-campus-feeding', 10000),
    ('simbas-recovery-fund',      4000), ('simbas-recovery-fund',      3000), ('simbas-recovery-fund',      2200),
    ('vaccination-drive-2026',   10000), ('vaccination-drive-2026',    6500), ('vaccination-drive-2026',    5000),
    ('sterilization-support',    12000), ('sterilization-support',     8000), ('sterilization-support',     4800),
    ('emergency-medical-fund',   15000), ('emergency-medical-fund',   10000), ('emergency-medical-fund',    6000)
) as v(slug, amt) on v.slug = c.slug
where c.is_demo;

insert into campaign_expenses (campaign_id, spent_on, label, amount) values
  ('cafe0001-0000-4000-8000-000000000001','2026-06-28','Feeding supplies (rice, kibble, eggs)',7800),
  ('cafe0001-0000-4000-8000-000000000001','2026-06-12','Cooking fuel refill',1100),
  ('cafe0002-0000-4000-8000-000000000002','2026-05-02','Veterinary medicines',4200),
  ('cafe0002-0000-4000-8000-000000000002','2026-04-19','Wound dressing supplies',1350),
  ('cafe0003-0000-4000-8000-000000000003','2026-06-10','Vaccine procurement (phase 1)',12600),
  ('cafe0003-0000-4000-8000-000000000003','2026-06-10','Vet supervision, 2 camp days',3000),
  ('cafe0004-0000-4000-8000-000000000004','2026-05-18','Surgical camp (6 animals)',15000),
  ('cafe0005-0000-4000-8000-000000000005','2026-06-22','Emergency surgery — vehicle accident case',8500);

insert into campaign_updates (campaign_id, note) values
  ('cafe0001-0000-4000-8000-000000000001','June feeding complete — 30 days, zero missed rounds.'),
  ('cafe0002-0000-4000-8000-000000000002','Simba''s final follow-up: fully recovered.'),
  ('cafe0003-0000-4000-8000-000000000003','Phase 1 complete. Phase 2 begins August.');

-- ---------- rescue reports ----------
insert into rescue_reports
  (report_code, animal_type, problem, severity, zone_id, location_note, description, status, is_demo)
values
  ('PAWS-RESCUE-2026-00124','dog','injured','urgent','tech-market',
   'Behind the tea stalls, near the cycle stand',
   'Brown dog limping badly on the back leg, not putting weight on it.',
   'treatment_started', true),
  ('PAWS-RESCUE-2026-00121','cat','puppies_kittens_at_risk','moderate','vs-hall',
   'Storeroom near the mess, ground floor',
   'Three kittens in the storeroom, mother not seen since yesterday.',
   'resolved', true);

insert into report_updates (report_id, status, note)
select r.id, s.status::report_status, s.note
from rescue_reports r
join lateral (values
  ('reported','Report received. Thank you for helping.'),
  ('volunteer_assigned','Rescue volunteer assigned.')
) as s(status, note) on r.report_code = 'PAWS-RESCUE-2026-00124';

-- ---------- stories (metadata; long-form blocks live in the app demo data) ----------
insert into stories (slug, title, excerpt, category, animal_slug, read_minutes, hero_palette, status, featured, published_at, is_demo, blocks) values
  ('simba-waits-every-evening','He Used to Run From Us. Now Simba Waits Every Evening.',
   'For two years, Simba was a tan blur disappearing behind the Technology Market stalls. One injured paw changed everything.',
   'rescue','simba',5,'["#C97F45","#173F35"]','published',true,'2026-05-20', true,
   '[{"type":"p","text":"Every volunteer who works the Technology Market feeding round knew Simba — or rather, knew of him."}]'),
  ('mishti-both-eyes-open','Mishti Kept One Eye Closed for a Month. Both Are Open Now.',
   'The quietest cat in VS Hall arrived with the softest meow on campus and a badly infected eye.',
   'recovery','mishti',4,'["#C48A5A","#7A4A2B"]','published',true,'2026-06-28', true,
   '[{"type":"p","text":"The first three students who heard Mishti thought they were imagining it."}]'),
  ('the-dean-of-main-building','The Dean of Main Building Has Held Office for Six Years',
   'Shanti appears in more convocation photos than some faculty.',
   'campus-paw','shanti',3,'["#6E7570","#202421"]','published',true,'2026-04-12', true,
   '[{"type":"p","text":"Every campus has its institutions."}]');

-- ---------- impact metrics (admin-editable configuration) ----------
insert into impact_metrics
  (as_of, dogs_supported, cats_supported, vaccinated, sterilized, treated, adopted, note)
values
  ('2026-06-30', 300, 30, 210, 140, 85, 22,
   'Demo values for illustration — edit from the admin dashboard.');
