-- Minimal seed for nutrients_reference and intake_standards

insert into nutrients_reference (canonical_name, default_unit, aliases)
values
  ('vitamin c','mg','["ascorbic acid","vit c"]'),
  ('vitamin d','mcg','["cholecalciferol","vit d"]'),
  ('calcium','mg','["ca"]'),
  ('iron','mg','["fe"]')
on conflict (canonical_name) do nothing;

-- Example standards (not medical advice)
-- Adult defaults
insert into intake_standards (nutrient_id, age_min, age_max, sex, min_value, max_value, unit, source)
select id, 19, 120, 'unknown', 75, 2000, default_unit, 'sample' from nutrients_reference where canonical_name = 'vitamin c'
on conflict do nothing;

insert into intake_standards (nutrient_id, age_min, age_max, sex, min_value, max_value, unit, source)
select id, 19, 120, 'unknown', 15, 100, default_unit, 'sample' from nutrients_reference where canonical_name = 'vitamin d'
on conflict do nothing;

insert into intake_standards (nutrient_id, age_min, age_max, sex, min_value, max_value, unit, source)
select id, 19, 120, 'unknown', 1000, 2500, default_unit, 'sample' from nutrients_reference where canonical_name = 'calcium'
on conflict do nothing;

insert into intake_standards (nutrient_id, age_min, age_max, sex, min_value, max_value, unit, source)
select id, 19, 120, 'unknown', 8, 45, default_unit, 'sample' from nutrients_reference where canonical_name = 'iron'
on conflict do nothing;
