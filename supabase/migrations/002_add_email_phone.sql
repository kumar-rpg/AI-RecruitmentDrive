-- Run this in Supabase SQL Editor if you already ran schema.sql before this
-- change landed (adds Email Address + Mobile No. to existing applicants).

alter table public.applicants
  add column if not exists email text not null default '',
  add column if not exists phone text not null default '';

alter table public.applicants alter column email drop default;
alter table public.applicants alter column phone drop default;
