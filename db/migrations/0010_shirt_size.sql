-- Event Run-Down — per-guest shirt size, recorded at Workshop Registration (Day 2).
-- Shirt size is intrinsic to the guest (one size per person), so it lives on guests
-- and is edited from the session roster. Idempotent.

alter table guests add column if not exists shirt_size text;
