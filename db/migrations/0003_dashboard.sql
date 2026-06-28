-- Dashboard tables: event run-down schedule + committee task tracker.
-- Idempotent: create table if not exists; seeds only when each table is empty.

create table if not exists rundown_items (
  id          uuid primary key default gen_random_uuid(),
  day         date not null,
  start_time  text,            -- 'HH:MM'
  end_time    text,            -- 'HH:MM'
  title       text not null,
  location    text,
  pic         text,
  notes       text,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists rundown_day_idx on rundown_items (day, start_time);

create table if not exists committee_tasks (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  category    text,
  pic         text,
  due_date    date,
  status      text not null default 'Todo',   -- Todo | In Progress | Blocked | Done
  notes       text,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists tasks_status_idx on committee_tasks (status, due_date);

-- ===== Starter run-of-show (editable skeleton) =====
insert into rundown_items (day, start_time, end_time, title, location, pic)
select * from (values
  (date '2026-06-30','14:00','15:00','Ketibaan & sambutan peserta','Kuah Jetty','Urusetia'),
  (date '2026-06-30','15:00','16:30','Pendaftaran & check-in hotel','Bayview Hotel','Urusetia'),
  (date '2026-06-30','16:30','17:30','Taklimat program','Dewan Seminar','Pengerusi'),
  (date '2026-06-30','20:00','22:00','Makan malam & ramah mesra','Restoran Hotel','Jamuan'),
  (date '2026-07-01','08:00','09:00','Sarapan pagi','Restoran Hotel',null),
  (date '2026-07-01','09:00','12:30','Sesi utama program','Dewan Seminar','Pengerusi'),
  (date '2026-07-01','13:00','14:00','Makan tengah hari','Restoran Hotel',null),
  (date '2026-07-01','14:30','15:30','Sesi penutup & bergambar','Dewan Seminar','Urusetia'),
  (date '2026-07-01','15:30',null,'Bertolak pulang / transport ke jetty','Lobi Hotel','Transport')
) as v(day, start_time, end_time, title, location, pic)
where not exists (select 1 from rundown_items);

-- ===== Starter committee tasks (editable) =====
insert into committee_tasks (title, category, pic, due_date, status)
select * from (values
  ('Sahkan senarai bilik & rooming list hotel','Logistik','Ira',date '2026-06-28','In Progress'),
  ('Atur pengangkutan van dari jetty ke hotel','Transport',null,date '2026-06-29','Todo'),
  ('Muktamadkan atur cara program (run-down)','Program',null,date '2026-06-28','Todo'),
  ('Sediakan name tag & welcome kit peserta','Urusetia',null,date '2026-06-29','Todo'),
  ('Sahkan katering & keperluan diet khas','Katering',null,date '2026-06-29','Todo'),
  ('Sediakan bahan taklimat & slaid pembentangan','Program',null,date '2026-06-29','Todo')
) as v(title, category, pic, due_date, status)
where not exists (select 1 from committee_tasks);
