-- Per-trip completion flag for the Transport page. Trips are computed live (not persisted),
-- so we key on a deterministic trip key: "date|venue|arrivalTime|chunk".
create table if not exists trip_status (
  trip_key     text primary key,
  completed_at timestamptz,
  completed_by text,
  updated_at   timestamptz not null default now()
);
