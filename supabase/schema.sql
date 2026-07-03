-- Schema simplifié pour Wedding Share

create extension if not exists "pgcrypto";

create table events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  access_code text not null unique,
  created_at timestamptz not null default now()
);

create table guests (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  role text not null default 'guest',
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create table media (
  id uuid primary key default gen_random_uuid(),
  guest_id uuid not null references guests(id) on delete cascade,
  event_id uuid not null references events(id) on delete cascade,
  type text not null check (type in ('photo', 'video', 'audio')),
  file_name text not null,
  file_url text not null,
  created_at timestamptz not null default now()
);

insert into events (name, access_code) values ('Wedding 2026', 'MARIAGE2026');

insert into guests (event_id, first_name, last_name, role, is_admin)
select id, 'Jean', 'Rakoto', 'guest', false from events where access_code = 'MARIAGE2026';

insert into guests (event_id, first_name, last_name, role, is_admin)
select id, 'Marie', 'Randria', 'admin', true from events where access_code = 'MARIAGE2026';
