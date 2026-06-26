-- Event Run-Down — Neon (plain Postgres) schema.
-- Idempotent: create table if not exists. No RLS / triggers / Supabase constructs.

-- ===== Auth.js v5 adapter tables (@auth/neon-adapter) =====
-- Quoted camelCase identifiers are REQUIRED by the adapter's queries.

create table if not exists verification_token (
  identifier text not null,
  expires    timestamptz not null,
  token      text not null,
  primary key (identifier, token)
);

create table if not exists accounts (
  id                  serial primary key,
  "userId"            integer not null,
  type                varchar(255) not null,
  provider            varchar(255) not null,
  "providerAccountId" varchar(255) not null,
  refresh_token       text,
  access_token        text,
  expires_at          bigint,
  id_token            text,
  scope               text,
  session_state       text,
  token_type          text
);

create table if not exists sessions (
  id             serial primary key,
  "userId"       integer not null,
  expires        timestamptz not null,
  "sessionToken" varchar(255) not null
);

create table if not exists users (
  id              serial primary key,
  name            varchar(255),
  email           varchar(255),
  "emailVerified" timestamptz,
  image           text,
  role            varchar(20) not null default 'viewer'   -- admin | editor | viewer (adapter never writes this)
);

create unique index if not exists users_email_idx    on users (email);
create        index if not exists accounts_user_idx   on accounts ("userId");
create        index if not exists sessions_user_idx    on sessions ("userId");
create unique index if not exists sessions_token_idx   on sessions ("sessionToken");

-- ===== App tables =====

create table if not exists guests (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  ic_no          text,
  gender         text,
  agency         text,
  food_allergy   text,
  tshirt_size    text,
  room_type      text,
  bed_type       text,
  room_no        text,
  roommate       text,
  arrival_mode   text,
  arrival_date   date,
  arrival_time   text,            -- 'HH:MM' (time at jetty)
  departure_date date,
  departure_time text,
  transport_status text not null default 'Pending',
  pic            text,
  notes          text,
  updated_at     timestamptz not null default now()
);

create table if not exists vehicles (
  id          uuid primary key default gen_random_uuid(),
  label       text not null,
  capacity    int not null default 10,
  driver_name text,
  plate_no    text,
  contact_no  text,
  active      boolean not null default true
);

create table if not exists transport_trips (
  id              uuid primary key default gen_random_uuid(),
  direction       text not null default 'arrival',
  date            date,
  pickup_time     text,
  route_from      text,
  route_to        text,
  vehicle_id      uuid references vehicles(id),
  guest_ids       uuid[] not null default '{}',
  status          text not null default 'Pending',
  manual_override boolean not null default false,
  notes           text
);

create table if not exists event_config (
  id                 int primary key default 1,
  event_name         text not null default 'Langkawi Event 2026',
  venue              text not null default 'Bayview Hotel',
  jetty_to_hotel_min int not null default 10,
  return_min         int not null default 10,
  buffer_min         int not null default 15,
  van_capacity       int not null default 10,
  constraint event_config_single_row check (id = 1)
);

insert into event_config (id) values (1) on conflict (id) do nothing;
