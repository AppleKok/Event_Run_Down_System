-- Public session-feedback survey (scanned via QR by workshop participants).
-- Answers are stored as jsonb keyed by question id (q1..q10); free-text "Lain-lain"
-- values live under "<qid>_other". Idempotent.

create table if not exists survey_responses (
  id           uuid primary key default gen_random_uuid(),
  nama         text,
  emel         text,
  organisasi   text,
  jawatan      text,
  answers      jsonb not null default '{}'::jsonb,
  submitted_at timestamptz not null default now()
);

create index if not exists survey_responses_submitted_idx on survey_responses (submitted_at desc);
