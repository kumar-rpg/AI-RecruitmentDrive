# Build Log — AI-RecruitmentDrive

A record of how this app was built, from the empty GitHub repo
([kumar-rpg/AI-RecruitmentDrive](https://github.com/kumar-rpg/AI-RecruitmentDrive))
to a live, working recruitment intake tool on Vercel + Supabase.

---

## 1. Starting point

The repo existed on GitHub but was completely empty (no commits, no files).
The brief: turn an existing single-file HTML prototype (built earlier as a
browser-only demo with data in `localStorage`) into a real, shareable,
multi-user web app — a link applicants could submit resumes/transcripts
through, and a private dashboard to review them.

## 2. Two decisions made before writing any code

Because applicants would be uploading resumes and transcripts, the review
dashboard would hold real personal data. Two things were confirmed upfront
rather than assumed:

- **Dashboard authentication:** real Supabase Auth login (email/password),
  restricted to one account, rather than a shared passcode or no protection
  at all.
- **Supabase project status:** starting from zero, so the plan included a
  full account/project setup walkthrough rather than assuming one already
  existed.

## 3. Architecture chosen

- **Next.js 14 (App Router)**, plain JavaScript — deploys natively on Vercel.
- **Supabase** for Postgres (applicant records), Storage (resume/transcript
  PDFs), and Auth (the one admin login).
- **File uploads bypass the server entirely.** The browser requests a
  short-lived *signed upload URL* from a Server Action, then uploads the PDF
  bytes directly to Supabase Storage. This avoids Vercel's serverless
  function payload limit (~4.5MB) entirely — large scanned transcripts don't
  risk failing partway through.
- **Two Supabase clients, split by privilege:**
  - `supabaseAdmin` — service role key, server-only, bypasses Row Level
    Security. Used for every real read/write (applicants, positions,
    storage).
  - `supabaseServer` / `supabaseClient` — anon key, used only for the admin
    login/logout flow and for the narrow signed-upload mechanism.
- **Security default: deny.** Row Level Security is enabled on every table
  with zero public policies. The anon key and any logged-in user get no
  direct database access at all — every operation goes through this app's
  server code using the service role key.
- **Dashboard is gated twice:** `middleware.js` blocks unauthenticated
  requests to `/dashboard` at the edge, and every Server Action under
  `app/dashboard/actions.js` independently re-checks the session, since
  Server Actions are separately callable endpoints.

## 4. Initial build — commit `56cd994` (2026-07-20)

Built and pushed in one pass:

- `lib/supabaseAdmin.js`, `lib/supabaseClient.js`, `lib/supabaseServer.js` —
  the three Supabase client helpers described above.
- `middleware.js` — session refresh + `/dashboard` route protection.
- `app/page.js` — the public application form: Full Name, category picker
  (Intern / Graduating-Grad / Already Working), university-or-employer and
  program-or-role fields that relabel based on category, Resume upload, and
  Transcript upload (hidden for "Already Working"). PDF-only enforced
  client-side.
- `app/actions.js` — `getUploadTargets()` (creates the signed upload URLs)
  and `submitApplication()` (validates and inserts the row after upload).
- `app/login/page.js` — email/password sign-in form.
- `app/dashboard/page.js` + `app/dashboard/DashboardClient.js` — fetches all
  applicants server-side, renders a searchable/filterable table: status
  (New/Reviewing/Shortlisted/Rejected), a ⚠ flag for missing documents,
  signed-URL document viewing, and CSV export.
- `app/dashboard/actions.js` — `updateStatus`, `deleteApplicant`,
  `getDocUrl` (signed URL, 5-minute expiry), `signOut` — each re-checking
  the admin session.
- `supabase/schema.sql` — the `applicants` table, RLS enabled, no policies.
- `README.md` — a from-zero deployment guide (create Supabase project, run
  the schema, create the private `applications` storage bucket, create the
  admin login, get the three API keys, deploy to Vercel with them as env
  vars).
- Verified with `npm run build` locally before ever touching a live
  Supabase project, to catch errors cheaply.
- `git init`, branch renamed to `main`, remote added, committed, pushed.

### Manual deployment (done by KR, walked through step-by-step)

1. Created the Supabase project ("Cortex Recruitment Drive", Tokyo region).
2. Ran `schema.sql` in the SQL Editor.
3. Created a **private** Storage bucket named `applications`.
4. Created the one admin login (`hr@cortexrobotics.my`) under
   Authentication → Users, with Auto Confirm on.
5. Copied the three API values (Project URL, anon key, service role key)
   from Settings → API.
6. Imported the repo into Vercel, added the three values as environment
   variables, deployed.
7. End-to-end test: submitted a real application on the live form, then
   confirmed it appeared in `/dashboard` after logging in.

## 5. Add email and phone fields — commit `1c32c31` (2026-07-23)

- Added **Email Address** and **Mobile No.** to the application form, with
  basic email-format validation client-side.
- `applicants` table gained `email` and `phone` columns (`supabase/migrations/002_add_email_phone.sql` — added as nullable-safe with a
  temporary default, then made `not null`, so it applied cleanly to a table
  that already had submitted rows).
- Dashboard: both fields added as table columns, included in search, and
  included in the CSV export.

## 6. Restrict uploads to a single PDF each — commit `37d72aa` (2026-07-23)

- The file inputs already capped selection to one file natively (no
  `multiple` attribute), but this made it explicit: selecting more than one
  file now shows a clear error ("Please select only 1 file for Resume — you
  selected 2") instead of silently keeping just the first file.
- Added a filename display under each upload field so applicants can
  confirm what they picked before submitting.

## 7. Dashboard layout tweaks — commits `eeba2e4` and `314401e` (2026-07-23)

- Moved the **Status** column to the front of the applicants table (was
  last, now first) for faster scanning.
- Widened the Status `<select>` (min-width + padding) after the dropdown
  arrow was clipping longer labels like "Shortlisted".

## 8. Available Positions — commit `809a4bf` (2026-07-24)

Added a dynamic "Position Applied For" dropdown, sourced from a new
Supabase table rather than hardcoded:

- `public.positions` table (`id`, `title` — unique, `is_active`,
  `created_at`), RLS enabled, no public policies — same pattern as
  `applicants`. Seeded with three starter roles.
- `app/page.js` was converted from a client component into an async
  **Server Component** that fetches active positions via `supabaseAdmin`
  and passes them to a new `app/ApplyForm.js` client component (the actual
  interactive form, unchanged otherwise). Marked
  `export const dynamic = 'force-dynamic'` so the position list is always
  fetched fresh, never cached as static HTML.
- Position is now a required field on the form; submission is disabled
  entirely if no positions are currently open, rather than allowing a
  broken submission.
- Server-side re-validation: `submitApplication()` now confirms the
  submitted position still exists and is active before inserting — defends
  against a stale form tab submitting a since-closed position.
- New **"Manage Positions"** panel at the top of `/dashboard`: add a
  position by title, click its pill to toggle Open/Closed, or delete it.
  Backed by three new admin-gated Server Actions (`createPosition`,
  `togglePositionActive`, `deletePosition`).
- Applicants table gained a **Position** column, plus a position filter
  dropdown, search inclusion, and CSV export inclusion.
- `supabase/migrations/003_add_positions.sql` for applying this to the
  already-live database (the base `schema.sql` was also updated for anyone
  setting the project up fresh from now on).

## 9. Fix: positions dropdown not refreshing — commit `802956e` (2026-07-24)

**Symptom:** updating a position in the dashboard's "Manage Positions"
panel didn't show up in the public form's dropdown, even after a refresh.

**Root cause:** Next.js patches the global `fetch` function to cache
requests by default (its "Data Cache"). Supabase's client library issues
its requests via plain `fetch` without ever setting a cache directive, so
those requests were eligible for Next.js's caching layer regardless of the
page-level `dynamic = 'force-dynamic'` setting.

**Fix:** `lib/supabaseAdmin.js` now injects a custom `fetch` into the
Supabase client that forces `cache: 'no-store'` on every request the admin
client makes, network-wide, closing off the caching layer at its source
instead of relying on route-level configuration alone.

---

## Where things stand

- **Public link:** the deployed Vercel URL's root (`/`) — share this with
  applicants.
- **Admin dashboard:** the same domain plus `/dashboard`, gated by Supabase
  Auth login.
- **To open/close a role or add a new one:** log into `/dashboard` and use
  the "Manage Positions" panel — no code changes or redeploys needed.
- **Migrations applied so far, in order** (all under `supabase/migrations/`,
  plus the consolidated `supabase/schema.sql` for fresh installs):
  1. `002_add_email_phone.sql`
  2. `003_add_positions.sql`
