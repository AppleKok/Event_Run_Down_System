-- Shirt size already exists as guests.tshirt_size (since 0001_init) and is shown in
-- the Guest list / Committee / Guest form. The Workshop Registration (Day 2) attendance
-- selector edits that same column, so drop the redundant shirt_size column added in an
-- earlier iteration. Idempotent.
alter table guests drop column if exists shirt_size;
