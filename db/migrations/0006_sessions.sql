-- Event Run-Down — per-session attendance + item collection (goody bag, certificate).
-- Idempotent. Run after 0001_init.sql.

create table if not exists event_sessions (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  session_date date,
  sort_order   int not null default 0,
  audience     text not null default 'participants',  -- participants | committee | all
  items        text[] not null default '{}',          -- collectables; empty = plain attendance
  created_at   timestamptz not null default now()
);

create table if not exists session_attendance (
  session_id uuid not null references event_sessions(id) on delete cascade,
  guest_id   uuid not null references guests(id) on delete cascade,
  present    boolean not null default false,
  present_at timestamptz,
  marked_by  text,
  collected  text[] not null default '{}',             -- subset of the session's items
  primary key (session_id, guest_id)
);

create unique index if not exists event_sessions_name_idx on event_sessions (name);

insert into event_sessions (name, session_date, sort_order, audience, items) values
  ('Private Dinner','2026-06-30',1,'participants','{}'),
  ('Workshop Registration (Day 2)','2026-07-01',2,'participants','{Woven Bag,Notebook,Shirt,Itinerary}'),
  ('Lunch','2026-07-01',3,'participants','{}'),
  ('Workshop Registration (Day 3)','2026-07-02',4,'participants','{}'),
  ('Certificate Collection','2026-07-02',5,'participants','{Certificate}')
on conflict (name) do update set session_date=excluded.session_date, sort_order=excluded.sort_order, audience=excluded.audience, items=excluded.items;
