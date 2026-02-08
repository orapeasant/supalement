# Supplement Scheduler

A Next.js (App Router) + Supabase + Tailwind app to upload supplement label images, OCR and parse nutrients, and generate a simple daily schedule vs intake standards.

## Tech
- Next.js + TypeScript
- TailwindCSS
- shadcn-style UI components (local)
- Supabase (Auth + Postgres + Storage)
- Vercel deployment

## Setup
1. Create `.env.local` from `.env.example` and fill Supabase keys.
2. Create Supabase project, enable Google Auth, set redirect URLs.
3. Create Storage bucket `supplement-images`.
4. Apply SQL in `supabase/migrations/0001_init.sql` and storage policies.

## Scripts
```bash
npm install
npm run dev
```

Local dev: http://localhost:3000
"# supalement" 
