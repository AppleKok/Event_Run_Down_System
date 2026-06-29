# Enhancement Plan — Attendance & Room Assignment

A living, phased roadmap. Tick a box as each milestone lands; iterate one phase per pass.

## Locked decisions
- **Attendance is event-level:** one check-in (arrival) + one check-out (departure) per guest.
- **Manual toggle by committee** (admin/editor) — no QR / self-service.
- **Rooms stay free-text**, assigned manually on `/guests`. No rooms-inventory table — just faster assignment + an occupancy view.
- **Order:** attendance first, then rooms.

---

## Phase 1 — Attendance (check-in / check-out)  ← MVP ✅ DONE
- [x] Migration `db/migrations/0004_attendance.sql` — `checked_in_at`, `checked_out_at`, `checked_in_by`, `checked_out_by` on `guests`
- [x] Wire migration into `scripts/migrate.mjs`
- [x] Server actions `src/lib/actions/attendance.ts` — `getAttendance`, `checkIn`, `checkOut`, `undoCheckIn`, `undoCheckOut`
- [x] Page `/attendance` — live counts, search, status filter, per-row check-in/out + undo
- [x] `StatusBadge` states: Not arrived · On site · Checked out
- [x] `IconAttendance` + nav entry
- [x] Dashboard "On site now" KPI (`dashboard.ts` + Overview)

Status derivation (computed, never stored): `checked_out_at` → **Checked out**; else `checked_in_at` → **On site**; else **Not arrived**.

## Phase 2 — Room assignment (faster manual assignment + occupancy) ✅ DONE
- [x] `assignRoom(id, roomNo)` action in `src/lib/actions/guests.ts`
- [x] Inline click-to-edit Room No. cell on `/guests`
- [x] `/rooms` occupancy view — group by room, unassigned bucket, over-capacity warning
- [x] `IconRooms` + nav entry

## Phase 3 — Polish ✅ DONE
- [x] Print-optimized attendance + rooming sheets (Print button; sidebar/buttons hidden via `@media print`)
- [x] CSV export (attendance / rooming) — `src/lib/csv.ts`, Export buttons on both pages
- [x] Dashboard "Unassigned rooms" count (Overview Rooms-assigned stat)

## Future / parked (explicitly out of scope now)
- QR-code / self check-in (token generation, scanner page)
- Full rooms-inventory table (capacities, gender rules, auto-pairing)

---

_Plan source: `~/.claude/plans/calm-puzzling-ritchie.md`._
