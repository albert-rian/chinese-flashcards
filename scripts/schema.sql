-- Chinese Flashcards schema
-- Run this once in the Supabase SQL Editor for a brand-new project
-- (e.g. the public demo project) before running scripts/seed.mjs.

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

-- Row Level Security: disabled, matching the production project.
-- (This app only ever uses the public anon key — there is no per-user data.)
alter table lessons disable row level security;
alter table characters disable row level security;
