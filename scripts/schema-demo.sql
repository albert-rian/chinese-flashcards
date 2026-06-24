-- Chinese Flashcards schema — DEMO project variant
-- Run this in the SQL Editor of the NEW (public demo) Supabase project,
-- instead of schema.sql. It locks the tables to read-only for the public
-- anon key at the database level, so the demo can't be vandalized even if
-- someone bypasses the in-app "demo mode" warning by calling Supabase
-- directly (the anon key is necessarily public in any client-side app).

create table if not exists lessons (
  id         uuid primary key default gen_random_uuid(),
  name       text unique not null,
  created_at timestamptz not null default now()
);

create table if not exists characters (
  id         uuid primary key default gen_random_uuid(),
  hanzi      text not null,
  pinyin     text not null,
  english    text not null,
  indonesian text not null,
  lesson_id  uuid not null references lessons(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (hanzi, lesson_id)
);

-- Enable RLS and allow read-only access to everyone.
-- No insert/update/delete policy exists, so those operations are denied
-- by default for the anon key — regardless of what the UI does.
alter table lessons enable row level security;
alter table characters enable row level security;

create policy "Public read access" on lessons
  for select using (true);

create policy "Public read access" on characters
  for select using (true);

-- Re-seed any time with: node scripts/seed.mjs
-- (run with SUPABASE_URL / SUPABASE_KEY env vars pointing at this project —
-- use the project's `service_role` key for seeding only, never ship it to
-- the client; the app itself keeps using the public anon key.)
