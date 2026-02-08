# Supalement Web App — Copilot Build Spec (Next.js + shadcn/ui + Tailwind + Supabase + Vercel)

> **Purpose:** This document is a **single source of truth** you can paste into **VS Code GitHub Copilot Chat** (or use as a repo README) to generate the initial project scaffold and core features.
>
> **App summary:** Users sign in with **Google (Supabase Auth)**, create a profile (adult/child, age, sex), upload/capture multiple photos of supplement labels, OCR + parse the “Supplement Facts” into structured nutrients, then compute daily totals vs recommended min/max and generate a simple daily supplement schedule.

---

## 0) Non-goals (for MVP)

- No multi-tenant support.
- No medical diagnosis or drug–supplement interaction database.
- No IU conversion rules unless explicitly implemented (keep units as-is in MVP).
- No payments/subscriptions.

---

## 1) Tech stack & deployment

- **Next.js** (latest) with **App Router**
- **TypeScript**
- **TailwindCSS**
- **shadcn/ui** components
- **Supabase**
  - Auth: Google OAuth
  - Postgres DB
  - Storage for images
  - RLS policies
- **Vercel** deployment

---

## 2) Functional requirements (MVP)

### 2.1 Authentication

- Sign in/out with Google using Supabase Auth.
- Protect all `/app/*` routes.
- Store user session using `@supabase/ssr`.

### 2.2 Profile

- Each user has at least one profile.
- Profile fields: `type (adult|child)`, `age_years`, `sex (male|female|other|unknown)`.
- Optionally support multiple profiles later (e.g., family), but MVP can allow multiple without extra UX complexity.

### 2.3 Supplements

- User can create a supplement (draft) with basic fields: name, brand, form.
- User can upload multiple images per supplement:
  - `front`, `facts`, `ingredients`.
- Store image files in Supabase Storage under the path:
  - `supplement-images/{user_id}/{supplement_id}/{image_id}.jpg`

### 2.4 OCR + Parse (MVP)

- Provide an API route that triggers OCR for a supplement (stubbed if keys are not configured).
- Store OCR output text in `ocr_runs`.
- Parse supplement facts into `supplement_nutrients`.
- Provide a review screen where user can edit nutrients and mark a supplement as `verified`.

> **OCR provider:** MVP can include a provider-agnostic interface + placeholder. Implement actual Google Vision later.

### 2.5 Calculation + Schedule

- User can generate a schedule plan for a profile.
- Simple schedule slots: `Morning`, `Midday`, `Evening`.
- Simple generator algorithm:
  1. Start with selected supplements (default `servings=1` each).
  2. Compute daily totals by summing `amount_per_serving * servings` across schedule items.
  3. Compare to `intake_standards` for the profile age+sex.
  4. If any nutrient exceeds max, reduce servings of the biggest contributor (greedy) until safe or minimum serving reached.
  5. Distribute supplements across slots (split if servings > 1).

- Show warnings:
  - `exceeds_max`, `near_max (>80%)`, `below_min` (optional)

---

## 3) Information architecture (routes)

### Public
- `/login`
- `/auth/callback`

### Protected (requires session)
- `/app/dashboard`
- `/app/profile`
- `/app/supplements`
- `/app/supplements/new`
- `/app/supplements/[id]`
- `/app/schedule`
- `/app/schedule/generate`

---

## 4) Repository structure (proposed)

```
.
├─ app/
│  ├─ (public)/
│  │  ├─ login/page.tsx
│  │  └─ auth/callback/route.ts
│  ├─ (protected)/
│  │  ├─ app/layout.tsx
│  │  ├─ app/dashboard/page.tsx
│  │  ├─ app/profile/page.tsx
│  │  ├─ app/supplements/page.tsx
│  │  ├─ app/supplements/new/page.tsx
│  │  ├─ app/supplements/[id]/page.tsx
│  │  ├─ app/schedule/page.tsx
│  │  └─ app/schedule/generate/page.tsx
│  └─ api/
│     ├─ supplements/
│     │  ├─ route.ts
│     │  └─ [id]/
│     │     ├─ ocr/route.ts
│     │     ├─ parse/route.ts
│     │     └─ images/route.ts
│     └─ schedule/generate/route.ts
├─ components/
│  ├─ auth/
│  ├─ supplements/
│  ├─ schedule/
│  └─ ui/   (shadcn)
├─ lib/
│  ├─ supabase/
│  │  ├─ client.ts
│  │  ├─ server.ts
│  │  └─ middleware.ts
│  ├─ ocr/
│  │  ├─ provider.ts
│  │  └─ stub.ts
│  ├─ parsing/
│  │  ├─ supplementFacts.ts
│  │  └─ normalize.ts
│  └─ scheduling/
│     ├─ computeTotals.ts
│     ├─ generatePlan.ts
│     └─ rules.ts
├─ supabase/
│  ├─ migrations/
│  │  └─ 0001_init.sql
│  └─ seed/
│     └─ intake_standards_seed.sql
├─ middleware.ts
├─ .env.example
└─ README.md
```

---

## 5) Environment variables

Create `.env.local` (do not commit) and `.env.example` (commit).

Required:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Server-only (optional for some flows)
SUPABASE_SERVICE_ROLE_KEY=

# OCR provider keys (optional, can be empty for stub)
GOOGLE_CLOUD_PROJECT_ID=
GOOGLE_OCR_API_KEY=
```

---

## 6) Supabase setup steps

1. Create a Supabase project.
2. Enable **Google provider** in Authentication.
3. Set redirect URLs:
   - Local: `http://localhost:3000/auth/callback`
   - Prod: `https://<your-vercel-domain>/auth/callback`
4. Create a Storage bucket named: `supplement-images`

---

## 7) Database schema (SQL migration)

> Copilot: create `supabase/migrations/0001_init.sql` with the following.

```sql
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

-- IMPORTANT: You may need to grant privileges depending on your Supabase setup.
```

---

## 8) Supabase Storage policies (bucket: `supplement-images`)

> Copilot: create storage RLS policies so users can only access their own files.

Assuming file paths follow: `user_id/supplement_id/image_id.jpg`

In Supabase SQL editor:

```sql
-- Storage policies for bucket supplement-images

-- Allow authenticated users to read their own files
create policy "read_own_supplement_images" on storage.objects
for select to authenticated
using (
  bucket_id = 'supplement-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to upload into their own folder
create policy "insert_own_supplement_images" on storage.objects
for insert to authenticated
with check (
  bucket_id = 'supplement-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own files
create policy "delete_own_supplement_images" on storage.objects
for delete to authenticated
using (
  bucket_id = 'supplement-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);
```

---

## 9) Frontend UX requirements (shadcn/ui)

Use shadcn/ui components:
- `Button`, `Card`, `Input`, `Select`, `Tabs`, `Badge`, `Dialog`/`Drawer`, `Toast`, `Progress`, `Table`

### 9.1 Login page
- Centered card with “Continue with Google” button.

### 9.2 Supplements list
- Cards show: name, brand, status badge, last updated.
- Actions: “Add supplement”, “Review”, “Generate schedule”.

### 9.3 Add supplement wizard
- Steps:
  1) Basic info (name/brand/form)
  2) Capture/upload `front`
  3) Capture/upload `facts`
  4) Optional `ingredients`
- Each step shows preview + retake.

### 9.4 Review & Edit facts
- Table of extracted nutrients (editable rows via dialog)
- Image viewer (facts image)
- “Mark Verified” button.

### 9.5 Schedule views
- Generate: choose profile, choose supplements, choose slots.
- Today: display slot cards with items.

---

## 10) Next.js + Supabase auth integration requirements

- Use `@supabase/ssr` and create:
  - `lib/supabase/server.ts` to build a server-side client
  - `lib/supabase/client.ts` for client-side calls
- Add `middleware.ts` to protect `/app` routes.

### Middleware rules
- If no session, redirect to `/login`.
- Allow `/auth/callback`.

---

## 11) API routes (server)

Implement Next.js Route Handlers:

### 11.1 `POST /api/supplements`
- Create a draft supplement for the current user and profile.

### 11.2 `POST /api/supplements/[id]/images`
- Create a DB row in `supplement_images`.
- Return a signed upload URL or instruct client to upload via Supabase Storage SDK.

### 11.3 `POST /api/supplements/[id]/ocr`
- Fetch facts image(s), run OCR (stub ok), store in `ocr_runs`.

### 11.4 `POST /api/supplements/[id]/parse`
- Parse latest OCR run into `supplement_nutrients`.
- Update supplement status to `parsed`.

### 11.5 `POST /api/schedule/generate`
- Generate plan + slots + items.
- Return warnings and totals.

---

## 12) OCR provider interface (stub-first)

Create a provider interface:

- `lib/ocr/provider.ts` exports `runOcr(imageUrl) => { text, confidence }`
- Default implementation uses `lib/ocr/stub.ts` that returns canned text.

Later, implement Google Vision.

---

## 13) Parsing requirements (MVP)

Implement `lib/parsing/supplementFacts.ts`:

- Input: raw OCR text
- Output:
  - serving size string
  - list of nutrient lines: `{ name, amount, unit, percentDV? }`

Normalization rules:
- Trim whitespace
- Collapse multiple spaces
- Recognize patterns:
  - `Serving Size` line
  - Nutrient lines with `mg`, `mcg`, `g`, `IU` and optional `%`
- Map nutrient names to canonical ids:
  - create `nutrients_reference` seed with common vitamins/minerals

> IMPORTANT: Provide UI so user can correct parsed results.

---

## 14) Scheduling + computation requirements (MVP)

### `computeTotals`
- Summation per nutrient across schedule items.

### `lookupStandards`
- Select `intake_standards` rows where:
  - `nutrient_id = X`
  - `age_years between age_min and age_max`
  - `sex matches OR sex='unknown'` fallback

### `generatePlan`
- Greedy reduction to avoid max limit.
- Distribute into slots.

Return:
- `planId`
- `totals[]`: { nutrient, total, unit, min, max, status }
- `warnings[]`

---

## 15) Seed data (minimal)

Create `supabase/seed/intake_standards_seed.sql` with a few nutrients for testing:

- Vitamin C
- Vitamin D
- Calcium
- Iron

Also seed `nutrients_reference` accordingly.

> Note: Full dietary reference values should be loaded later from a trusted dataset.

---

## 16) Commands (Copilot should generate scripts)

### Create project

```bash
npx create-next-app@latest supalement \
  --ts --tailwind --eslint --app --src-dir --import-alias "@/*"
cd supalement
```

### Add shadcn/ui

```bash
npx shadcn@latest init
```

Add components:

```bash
npx shadcn@latest add button card input select tabs badge dialog drawer toast progress table
```

### Add Supabase packages

```bash
npm i @supabase/supabase-js @supabase/ssr
npm i zod react-hook-form @hookform/resolvers
```

---

## 17) Acceptance criteria (definition of done)

MVP is complete when:

1. User can sign in with Google.
2. User can create a profile.
3. User can create a supplement and upload at least one `facts` image.
4. User can run OCR (stub ok) and see parsed nutrients.
5. User can edit nutrients and mark supplement as verified.
6. User can generate a daily schedule with Morning/Midday/Evening.
7. App shows nutrient totals and flags if any exceed max (if standards exist).
8. RLS prevents users from accessing other users’ rows and storage objects.

---

## 18) Copilot instructions: implement in this order

1. **Scaffold Next.js app** with Tailwind + TS.
2. Add **shadcn/ui** and generate UI primitives.
3. Add **Supabase client/server helpers** + route protection middleware.
4. Implement **login** and **auth callback**.
5. Implement **profile** creation + retrieval.
6. Implement **supplements CRUD** and basic list/detail pages.
7. Implement **image upload** to Supabase Storage + DB records.
8. Implement **OCR stub route** + store `ocr_runs`.
9. Implement **parser** + store `supplement_nutrients`.
10. Implement **review/edit nutrients UI**.
11. Implement **schedule generation** route + UI.

---

## 19) UI copy & safety disclaimer

Add a disclaimer in settings and schedule screens:

> “This app provides informational estimates based on supplement labels and may be inaccurate. It is not medical advice. Consult a healthcare professional for medical decisions.”

---

## 20) Stretch goals (optional)

- Family profiles
- Barcode scanning
- Improved OCR preprocessing (crop/rotate)
- Web push reminders
- Smarter optimization for meeting min targets

---

# END OF SPEC
