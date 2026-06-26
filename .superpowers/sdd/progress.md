# Phase 1 — Subagent-Driven Progress Ledger

Plan: `../../docs/superpowers/plans/2026-06-26-event-rundown-phase1.md`
Repo remote: git@github.com:AppleKok/Event_Run_Down_System.git

## Completed
- Task 1 (scaffold + Vitest): complete (commit b7cf5b9, on top of scaffold 4d4e405)
- Task 2 (time helpers): complete (commit 9fab0a9)
- Task 3 (transport types): complete (commit 6c30cf6)
- Task 4 (transport engine): complete (commit 6e7b402)
- Task 9 (status badge): complete (commit ba07640)
- Foundation review (Tasks 1-4,9): CLEAN — spec ✅, quality approved. 13/13 tests passing.

## Minor findings deferred to final whole-branch review
1. engine.ts ~line 44: `addMinutes('00:00', pickupMin)` could be the clearer `toHHMM(pickupMin)`. Cosmetic.
2. engine.ts: midnight-wrap edge case — a guest arriving ~23:50+ could spuriously flag a same-date conflict after wrap. Won't fire for this event's data; add a guard/comment when generalizing.

## Database + config (controller-authored)
- Task 5: `supabase/migrations/0001_init.sql` written (refined RLS `to authenticated`, realtime publication). User runs it in Supabase SQL Editor.
- Task 11: `supabase/seed.sql` written (38 participants). User runs after schema.
- Task 6 env: `.env.local` written with real Supabase URL + publishable key (Seoul project gzbhgryhizzkirmfnknp). Gitignored.

## App code wave (Tasks 6,7,8,10,12) — COMPLETE
- Commits 9d6af85..e1bf09b. Build passes (`next build`, Turbopack, offline), 13/13 tests.
- Review: proxy.ts correct for Next 16 (verified vs bundled docs); auth/supabase/realtime correct.
- CRITICAL (route collision on /) FIXED in e1bf09b: deleted src/app/page.tsx; layout cleanup (Geist removed, title set); auth-callback + guest-form error handling; build reverted to standard `next build`. Verified: page.tsx gone, (app)/page.tsx serves /.

## Minor findings deferred to final review / Phase 2
- guests "Add" button visible to viewers (RLS blocks the write) — add canWrite() gate.
- Lint (3, non-blocking; `next build` passes with them present): transport/page.tsx:14 `any` cast; react-hooks/set-state-in-effect on the data-load useEffect in guests/page.tsx:20 and transport/page.tsx:22.

## Remaining
- Task 13 (deploy to Vercel) — needs user to import repo on Vercel + push.
- LIVE verification (first magic-link login, admin grant, realtime check) — needs user's SQL applied + email click.

## Next.js 16 adaptations (accepted)
- middleware.ts -> proxy.ts (Next 16 rename; verified correct).
- create-next-app added AGENTS.md/CLAUDE.md warning of breaking changes; docs bundled in node_modules/next/dist/docs.

## PIVOT (2026-06-26): Supabase → Neon (user request)
Plan: ~/.claude/plans/postgresql-neondb-owner-...-tranquil-orbit.md (approved).
Stack now: Neon Postgres + Auth.js v5 (magic link via **SMTP/Nodemailer**, NOT Resend) + server actions + SWR polling. Vercel deploy.
- **Wave 1 DONE** (controller): deps swapped (added next-auth@beta, @auth/neon-adapter, @neondatabase/serverless, swr, server-only, nodemailer; removed @supabase/*). `db/migrations/0001_init.sql` (adapter tables + app tables) + `db/seed.sql` + `scripts/migrate.mjs`. **Migration RAN against Neon**: 8 tables, 38 guests. `.env.local` set (DATABASE_URL, AUTH_SECRET, SMTP_* placeholders, EMAIL_FROM, AUTH_TRUST_HOST; gitignored). tsconfig already had @/* alias.
- **Wave 2 DONE**: commit f6cadc5 (auth.ts/route/types/db/actions, rewired login+layout+guests+transport+guest-form to SWR+server actions, deleted Supabase files) + commit 8124852 (swap Resend→Nodemailer SMTP provider). Build exits 0 (Proxy active), 13/13 tests. Neon adapter WebSocket Pool verified working in Node (POOL OK, users:0 guests:38). channel_binding stripped for both drivers.
- **BLOCKED on user**: SMTP host/port/user/pass to fill .env.local placeholders → then local magic-link login test → promote admin via SQL (`update users set role='admin' where email='ira@geopeta.com'`).
- **Pending**: Wave 3 review of the migration diff; Wave 4 deploy to Vercel (push + import + env + AUTH_TRUST_HOST + add Vercel URL).
- Old Supabase project unused — user can delete it.

## DEPLOYED (2026-06-26) ✅ Phase 1 LIVE
- Vercel project: event-rundown (team dls-123, prj_uwucRvhoDFbrtpdo97gMrufelznd). Deployed via CLI (GitHub auto-connect failed; deploys are manual `vercel deploy --prod` for now).
- **Live URL: https://event-rundown-seven.vercel.app** (alias). All 8 env vars set in Vercel prod. Build 30s, routing + auth + providers verified live.
- Same Neon DB for local + prod (38 guests, allowlist apple.kok@dls.global=admin).
- Fixes during local testing (all committed): login provider id resend→nodemailer; globals.css dark-mode removed; Postgres dates cast to text in actions; SMTP (Nodemailer M365) verified sending; allowlist (allowed_emails) gating send + signin.
- TODO later: connect GitHub repo to Vercel for auto-deploy; add more committee emails to allowed_emails; Phase 2/3 modules (dashboard, rooming, meals, program). Final whole-branch review still pending. User should revoke the Vercel deploy token + delete stray project-deldf.

## Post-deploy fixes (2026-06-26)
- Cross-region latency: pinned functions to **sin1** via vercel.json (signin 9.8s→2.4s); +login "Sending…" state; auth route maxDuration 30. Commit 67b9eb7.
- **GOTCHA — env vars empty on Vercel:** `printf '%s' val | vercel env add NAME production` stored EMPTY values (npx/stdin pipe not consumed) → empty AUTH_SECRET → Auth.js `Configuration` error on every signin (routing worked since it doesn't need the secret). Diagnosed via `vercel env pull` ([0 chars]) + `vercel logs` ([auth][error]). FIX: re-set all 8 via REST API `POST /v10/projects/{id}/env?upsert=true` (HTTP 201) then redeploy. For future env sets, use the API or interactive add, NOT piped stdin.
- **BLOCKER — M365 SMTP blocked from cloud:** magic-link sends from Vercel got `535 5.7.139 Authentication unsuccessful` (M365 Security Defaults / risk blocks basic-auth SMTP from datacenter IPs; works from the Mac, intermittently from Vercel). Surfaced as `Configuration`. Diagnosed via `vercel logs --json` (full error). **DECISION: switched auth to email+password** (Credentials provider + JWT sessions, bcryptjs, no adapter/SMTP). Commit a122fad. Verified on prod: wrong pw→no session, correct pw→session cookie set. `users` table gained `password_hash`; account = the allowlist (only seeded users can log in). allowed_emails + nodemailer now unused. Admin: apple.kok@dls.global / temp pw DLSevent#2026. To add members: insert into users(email, role, password_hash=bcrypt(pw)). No change-password UI yet (Phase 2).

## Version deviation (accepted)
create-next-app@latest installed Next.js 16 + React 19 + Tailwind v4 (plan said Next 14). Accepted; noted in plan's version note. Tailwind v4 = no tailwind.config.ts (CSS-based config).
