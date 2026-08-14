-- Run this in Supabase SQL Editor on the existing project.
-- Adds salary_slip_path column for working applicants.

alter table public.applicants
  add column salary_slip_path text;
