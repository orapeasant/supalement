-- 0001_init.sql

create extension if not exists pgcrypto;

-- enums
do $$ begin
  create type profile_type as enum ('adult','child');
exception when duplicate_object then null; end $$;

do $$ begin
  create type sex_type as enum ('male','female','other','unknown');
exception when duplicate_object then null; end $$;

do $$ begin
  create type supplement_status as enum ('draft','parsed','verified');
exception when duplicate_object then null; end $$;

do $$ begin
  create type image_type as enum ('front','facts','ingredients');
exception when duplicate_object then null; end $$;

-- profiles
create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type profile_type not null,
  age_years int not null check (age_years >= 0 and age_years <= 120),
  sex sex_type not null default 'unknown',
  created_at timestamptz not null default now()
);

create index if not exists profiles_user_id_idx on profiles(user_id);

-- supplements
create table if not exists supplements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  brand text,
  form text,
  serving_size_text text,
  status supplement_status not null default 'draft',
  created_at timestamptz not null default now()
);

create index if not exists supplements_user_id_idx on supplements(user_id);
create index if not exists supplements_profile_id_idx on supplements(profile_id);

-- supplement images
create table if not exists supplement_images (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  supplement_id uuid not null references supplements(id) on delete cascade,
  storage_path text not null,
  type image_type not null,
  created_at timestamptz not null default now()
);

create index if not exists supplement_images_supplement_id_idx on supplement_images(supplement_id);

-- OCR runs
create table if not exists ocr_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  supplement_id uuid not null references supplements(id) on delete cascade,
  provider text not null,
  raw_text text not null,
  confidence numeric,
  created_at timestamptz not null default now()
);

create index if not exists ocr_runs_supplement_id_idx on ocr_runs(supplement_id);

-- Nutrients reference (global)
create table if not exists nutrients_reference (
  id uuid primary key default gen_random_uuid(),
  canonical_name text not null unique,
  default_unit text,
  aliases jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

-- Supplement nutrients
create table if not exists supplement_nutrients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  supplement_id uuid not null references supplements(id) on delete cascade,
  nutrient_id uuid not null references nutrients_reference(id) on delete restrict,
  amount_per_serving numeric not null,
  unit text not null,
  percent_dv numeric,
  source_line text,
  created_at timestamptz not null default now(),
  unique (supplement_id, nutrient_id)
);

create index if not exists supplement_nutrients_supplement_id_idx on supplement_nutrients(supplement_id);

-- Intake standards (global, read-only to users)
create table if not exists intake_standards (
  id uuid primary key default gen_random_uuid(),
  nutrient_id uuid not null references nutrients_reference(id) on delete restrict,
  age_min int not null,
  age_max int not null,
  sex sex_type not null default 'unknown',
  min_value numeric,
  max_value numeric,
  unit text not null,
  source text,
  created_at timestamptz not null default now()
);

create index if not exists intake_standards_lookup_idx on intake_standards(nutrient_id, age_min, age_max, sex);

-- Schedule
create table if not exists schedule_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists schedule_slots (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references schedule_plans(id) on delete cascade,
  slot_name text not null,
  time_hint time,
  with_food boolean not null default false
);

create table if not exists schedule_items (
  id uuid primary key default gen_random_uuid(),
  slot_id uuid not null references schedule_slots(id) on delete cascade,
  supplement_id uuid not null references supplements(id) on delete cascade,
  servings numeric not null default 1,
  notes text
);

create index if not exists schedule_items_slot_id_idx on schedule_items(slot_id);

-- -----------------------------
-- RLS
-- -----------------------------

alter table profiles enable row level security;
alter table supplements enable row level security;
alter table supplement_images enable row level security;
alter table ocr_runs enable row level security;
alter table supplement_nutrients enable row level security;
alter table schedule_plans enable row level security;

-- Global reference tables: enable RLS but allow read-only
alter table nutrients_reference enable row level security;
alter table intake_standards enable row level security;

-- profiles policies
create policy "profiles_select_own" on profiles
  for select using (user_id = auth.uid());
create policy "profiles_insert_own" on profiles
  for insert with check (user_id = auth.uid());
create policy "profiles_update_own" on profiles
  for update using (user_id = auth.uid());
create policy "profiles_delete_own" on profiles
  for delete using (user_id = auth.uid());

-- supplements policies
create policy "supplements_select_own" on supplements
  for select using (user_id = auth.uid());
create policy "supplements_insert_own" on supplements
  for insert with check (user_id = auth.uid());
create policy "supplements_update_own" on supplements
  for update using (user_id = auth.uid());
create policy "supplements_delete_own" on supplements
  for delete using (user_id = auth.uid());

-- supplement_images policies
create policy "supplement_images_select_own" on supplement_images
  for select using (user_id = auth.uid());
create policy "supplement_images_insert_own" on supplement_images
  for insert with check (user_id = auth.uid());
create policy "supplement_images_update_own" on supplement_images
  for update using (user_id = auth.uid());
create policy "supplement_images_delete_own" on supplement_images
  for delete using (user_id = auth.uid());

-- ocr_runs policies
create policy "ocr_runs_select_own" on ocr_runs
  for select using (user_id = auth.uid());
create policy "ocr_runs_insert_own" on ocr_runs
  for insert with check (user_id = auth.uid());
create policy "ocr_runs_delete_own" on ocr_runs
  for delete using (user_id = auth.uid());

-- supplement_nutrients policies
create policy "supplement_nutrients_select_own" on supplement_nutrients
  for select using (user_id = auth.uid());
create policy "supplement_nutrients_insert_own" on supplement_nutrients
  for insert with check (user_id = auth.uid());
create policy "supplement_nutrients_update_own" on supplement_nutrients
  for update using (user_id = auth.uid());
create policy "supplement_nutrients_delete_own" on supplement_nutrients
  for delete using (user_id = auth.uid());

-- schedule_plans policies
create policy "schedule_plans_select_own" on schedule_plans
  for select using (user_id = auth.uid());
create policy "schedule_plans_insert_own" on schedule_plans
  for insert with check (user_id = auth.uid());
create policy "schedule_plans_update_own" on schedule_plans
  for update using (user_id = auth.uid());
create policy "schedule_plans_delete_own" on schedule_plans
  for delete using (user_id = auth.uid());

-- nutrients_reference: allow read to authenticated, deny writes (writes only via service role)
create policy "nutrients_reference_read" on nutrients_reference
  for select to authenticated using (true);

-- intake_standards: allow read to authenticated, deny writes
create policy "intake_standards_read" on intake_standards
  for select to authenticated using (true);
