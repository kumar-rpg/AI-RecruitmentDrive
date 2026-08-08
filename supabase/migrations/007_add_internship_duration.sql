-- Run this in Supabase SQL Editor on the existing project.
-- Adds Internship Duration (Months), calculated from Internship Start/End
-- Date and captured at submission time so the dashboard can show and export
-- it without recomputing on every request.

alter table public.applicants
  add column if not exists internship_duration_months integer;
