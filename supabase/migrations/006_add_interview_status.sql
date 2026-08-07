-- Run this in Supabase SQL Editor on the existing project.
-- Adds "Interview" to the allowed applicant statuses, between Shortlisted
-- and Hired.
--
-- As with 005, the status column carries a CHECK constraint, so the new value
-- has to be allowed at the database before the dashboard can save it.

alter table public.applicants
  drop constraint if exists applicants_status_check;

alter table public.applicants
  add constraint applicants_status_check
  check (status in ('New', 'Reviewing', 'Shortlisted', 'Interview', 'Hired', 'Rejected'));
