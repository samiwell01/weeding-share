-- Schema Wedding Share v2
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New query)
-- If upgrading from v1, run this migration first:
-- ALTER TABLE guests ADD COLUMN IF NOT EXISTS avatar_url text;
-- ALTER TABLE guests ADD COLUMN IF NOT EXISTS auth_user_id uuid;
-- ALTER TABLE events ADD COLUMN IF NOT EXISTS admin_id uuid;
-- ALTER TABLE events ADD COLUMN IF NOT EXISTS date date;
-- ALTER TABLE events ADD COLUMN IF NOT EXISTS time time;
-- ALTER TABLE events ADD COLUMN IF NOT EXISTS venue_name text;
-- ALTER TABLE events ADD COLUMN IF NOT EXISTS venue_address text;
-- ALTER TABLE events ADD COLUMN IF NOT EXISTS cover_url text;

create extension if not exists "pgcrypto";

-- ─── EVENTS ──────────────────────────────────────────────────────────────────
create table if not exists events (
  id            uuid primary key default gen_random_uuid(),
  admin_id      uuid not null,                          -- references auth.users(id)
  name          text not null,
  access_code   text not null unique,
  date          date,
  time          time,
  venue_name    text,
  venue_address text,
  cover_url     text,
  created_at    timestamptz not null default now()
);

-- ─── GUESTS ──────────────────────────────────────────────────────────────────
create table if not exists guests (
  id           uuid primary key default gen_random_uuid(),
  event_id     uuid not null references events(id) on delete cascade,
  auth_user_id uuid,                                    -- references auth.users(id) after Google login
  first_name   text not null,
  last_name    text not null,
  email        text,
  phone        text,
  relation     text,                                    -- ex: ami, famille, collègue
  avatar_url   text,                                    -- profile picture URL
  role         text not null default 'guest',
  is_admin     boolean not null default false,
  created_at   timestamptz not null default now()
);

-- ─── MEDIA ───────────────────────────────────────────────────────────────────
create table if not exists media (
  id         uuid primary key default gen_random_uuid(),
  guest_id   uuid not null references guests(id) on delete cascade,
  event_id   uuid not null references events(id) on delete cascade,
  type       text not null check (type in ('photo', 'video', 'audio')),
  file_name  text not null,
  file_url   text not null,
  created_at timestamptz not null default now()
);

-- ─── RLS (Row Level Security) ─────────────────────────────────────────────────
alter table events enable row level security;
alter table guests enable row level security;
alter table media  enable row level security;

-- Allow service role full access (used by backend with service role key)
create policy "service role full access events" on events using (true) with check (true);
create policy "service role full access guests" on guests using (true) with check (true);
create policy "service role full access media"  on media  using (true) with check (true);
