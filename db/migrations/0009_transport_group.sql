-- Optional private-pickup tag. Guests sharing a non-null transport_group ride together in
-- their own car/trip, split out from the general date+venue+time pool (e.g. a family that
-- requested an individual car). Null = goes in the shared pool as before.
alter table guests add column if not exists transport_group text;
