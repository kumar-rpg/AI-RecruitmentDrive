-- Run this once in Supabase: Project -> SQL Editor -> New Query -> paste -> Run.

create extension if not exists "pgcrypto";

create table if not exists public.applicants (
  id uuid primary key,
  name text not null,
  email text not null,
  phone text not null,
  category text not null check (category in ('intern', 'grad', 'working')),
  org text not null,
  program_or_role text not null,
  resume_path text not null,
  transcript_path text,
  status text not null default 'New' check (status in ('New', 'Reviewing', 'Shortlisted', 'Rejected')),
  submitted_at timestamptz not null default now()
);

create index if not exists applicants_submitted_at_idx on public.applicants (submitted_at desc);
create index if not exists applicants_category_idx on public.applicants (category);
create index if not exists applicants_status_idx on public.applicants (status);

-- Row Level Security is enabled with NO policies added. This means the
-- public anon key and any logged-in user get zero direct access to this
-- table via the Supabase API — every read/write in this app goes through
-- Server Actions using the service role key, which bypasses RLS by design.
alter table public.applicants enable row level security;
