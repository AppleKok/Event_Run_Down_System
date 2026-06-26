-- Invite allowlist: only emails listed here may sign in (and they get the role set here).
-- A separate table (not `users`) so the Auth.js adapter can never auto-add someone to the allowlist.
create table if not exists allowed_emails (
  email text primary key,
  role  varchar(20) not null default 'viewer'   -- admin | editor | viewer
);

insert into allowed_emails (email, role) values ('apple.kok@dls.global', 'admin')
  on conflict (email) do update set role = excluded.role;
