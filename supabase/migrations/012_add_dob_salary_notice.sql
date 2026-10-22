-- Run this in Supabase SQL Editor on the existing project.
-- Adds Date of Birth (everyone) and Expected Monthly Salary / Notice Period in
-- months (Already Working applicants only) to the public application. All
-- nullable: rows filed before these fields existed simply have no value.

alter table public.applicants
  add column if not exists date_of_birth date,
  add column if not exists expected_salary numeric,
  add column if not exists notice_period_months integer;
