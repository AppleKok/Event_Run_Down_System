-- Event Run-Down — arrival venue (where the guest entered Langkawi).
-- Idempotent: add column if not exists. Run after 0004_attendance.sql.

-- 'Jetty' (Kuah ferry) or 'Airport'. Defaults to 'Jetty' for every guest.
alter table guests add column if not exists arrival_venue text not null default 'Jetty';
update guests set arrival_venue = 'Jetty' where arrival_venue is null or btrim(arrival_venue) = '';
