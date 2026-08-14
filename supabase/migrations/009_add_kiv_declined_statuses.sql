-- Run this in Supabase SQL Editor on the existing project.
-- Adds "KIV" (Keep In View) and "Declined" to the allowed applicant statuses.

alter table public.applicants
  drop constraint if exists applicants_status_check;

alter table public.applicants
  add constraint applicants_status_check
  check (status in ('New', 'Reviewing', 'Shortlisted', 'Interview', 'Offered', 'Hired', 'Rejected', 'Declined', 'KIV'));
