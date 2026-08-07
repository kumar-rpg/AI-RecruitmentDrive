-- Run this in Supabase SQL Editor on the existing project.
-- Adds "Hired" to the allowed applicant statuses.
--
-- The status column carries a CHECK constraint, so the new value has to be
-- allowed at the database before the dashboard can save it — without this,
-- picking "Hired" fails with a constraint violation.

alter table public.applicants
  drop constraint if exists applicants_status_check;

alter table public.applicants
  add constraint applicants_status_check
  check (status in ('New', 'Reviewing', 'Shortlisted', 'Hired', 'Rejected'));
