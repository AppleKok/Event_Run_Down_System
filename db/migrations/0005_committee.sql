-- Event Run-Down — committee vs participant classification.
-- Idempotent. Run after 0001_init.sql.

-- category: 'participant' (default, the PBT guests) or 'committee' (DLS organising team).
-- Committee members keep all guest fields (room_no, arrival, IC, etc.) but are shown
-- on the Committee page instead of the participant Guests list.
alter table guests add column if not exists category text not null default 'participant';

-- DLS is the organising committee.
update guests set category = 'committee' where agency = 'DLS';
