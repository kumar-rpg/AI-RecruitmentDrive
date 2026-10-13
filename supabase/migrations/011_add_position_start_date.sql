-- Run this in Supabase SQL Editor on the existing project.
-- Adds an Internship Start Date per position, set by HR in Manage Positions and
-- shown read-only beside "Position Applied For" on the public form (intern
-- positions only). Nullable: positions without a date simply show nothing.

alter table public.positions
  add column if not exists internship_start_date date;
