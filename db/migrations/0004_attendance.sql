-- Event Run-Down — attendance (event-level check-in / check-out).
-- Idempotent: add column if not exists. Run after 0001_init.sql.

-- One check-in (arrival) and one check-out (departure) per guest.
-- Status is DERIVED, never stored:
--   checked_out_at set  -> 'Checked out'
--   checked_in_at  set  -> 'On site'
--   neither             -> 'Not arrived'
alter table guests add column if not exists checked_in_at  timestamptz;
alter table guests add column if not exists checked_out_at timestamptz;
-- checked_in_by / checked_out_by store the committee member (name/email) — light audit.
alter table guests add column if not exists checked_in_by  text;
alter table guests add column if not exists checked_out_by text;
