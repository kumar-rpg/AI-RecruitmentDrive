-- Run this in Supabase SQL Editor on the existing project.
-- Adds Internship Start Date / End Date, collected only when an applicant
-- selects the "Intern" category.

alter table public.applicants
  add column if not exists internship_start_date date,
  add column if not exists internship_end_date date;
