-- One-time backfill, not a schema migration — run once in Supabase SQL Editor
-- to populate internship_duration_months on rows submitted before it existed
-- (anything before commit b8c45df). New submissions already compute and
-- store this at insert/edit time; this only touches historical rows.
--
-- Uses Postgres's age(), which breaks a date range into calendar months +
-- remainder days the same way lib/validation.js's monthsBetween() does —
-- e.g. 2026-03-15 to 2026-09-10 is "5 mons 26 days" in both, not a
-- day-count / 30.44 approximation. Safe to run more than once.

-- 1) Preview what would change — run this first and eyeball it.
select
  id,
  name,
  internship_start_date,
  internship_end_date,
  internship_duration_months as current_value,
  extract(year from age(internship_end_date, internship_start_date))::int * 12
    + extract(month from age(internship_end_date, internship_start_date))::int
    as calculated_value
from public.applicants
where internship_start_date is not null
  and internship_end_date is not null
  and internship_end_date > internship_start_date
order by submitted_at desc;

-- 2) Apply it. Only touches rows with both dates present and End > Start —
-- category, status, and every other column are untouched.
update public.applicants
set internship_duration_months =
  extract(year from age(internship_end_date, internship_start_date))::int * 12
  + extract(month from age(internship_end_date, internship_start_date))::int
where internship_start_date is not null
  and internship_end_date is not null
  and internship_end_date > internship_start_date;

-- 3) Verify: should return zero rows once the update above has run.
select id, name, internship_start_date, internship_end_date
from public.applicants
where internship_start_date is not null
  and internship_end_date is not null
  and internship_end_date > internship_start_date
  and internship_duration_months is null;
