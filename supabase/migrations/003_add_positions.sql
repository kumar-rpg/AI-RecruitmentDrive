-- Run this in Supabase SQL Editor on an existing project (adds Available
-- Positions, managed from the dashboard, feeding the dropdown on the public
-- application form).

create table if not exists public.positions (
  id uuid primary key default gen_random_uuid(),
  title text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Same pattern as applicants: RLS on, no public policies. Only this app's
-- server code (service role) ever reads or writes this table.
alter table public.positions enable row level security;

-- A few starter rows so the form isn't empty on day one — rename, deactivate,
-- or delete these from the dashboard's "Manage Positions" panel.
insert into public.positions (title) values
  ('Software Engineer Intern'),
  ('Robotics Engineer'),
  ('General Application')
on conflict do nothing;

alter table public.applicants
  add column if not exists position text not null default '';

alter table public.applicants alter column position drop default;
