-- Run this in Supabase SQL Editor on the existing project.
-- Adds "Offered" to the allowed applicant statuses, between Interview and Hired.

alter table public.applicants
  drop constraint if exists applicants_status_check;

alter table public.applicants
  add constraint applicants_status_check
  check (status in ('New', 'Reviewing', 'Shortlisted', 'Interview', 'Offered', 'Hired', 'Rejected'));
