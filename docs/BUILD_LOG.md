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

## 10. Input validation rules — commits `03e59e0` and `6bef326` (2026-07-31)

Tightened every field on the form, with each rule enforced twice: once in
the browser for fast feedback, once again inside `submitApplication()`
because a Server Action is a separately callable endpoint and client-side
checks can be bypassed.

- **Full Name** — letters and single spaces only. Non-letter characters are
  stripped live as the applicant types, rather than rejected on submit.
- **Mobile No.** — digits only, with a hyphen inserted automatically after
  the third digit (typing `0164028507` becomes `016-4028507`), validated
  against that exact shape.
- **Position** — the placeholder option was made non-selectable and the
  `<select>` marked `required`.
- **Category radios, University, Program** — marked `required`, and the one
  bundled "please fill in all fields" message was split into a specific
  message per field.

## 11. Simplify the form for working applicants — commit `1d62dc5` (2026-08-04)

Previously the University and Program fields were merely *relabelled* to
"Current Employer" and "Current Role" for already-working applicants. They
are now hidden outright — that group only supplies name, email, mobile,
position and a resume.

- Fields are cleared if an applicant fills them in and then switches
  category, so stale values can't be submitted.
- The server no longer requires `org` / `program` when category is
  `working`.
- The dashboard shows `—` in those two columns rather than empty cells.

## 12. Thank You page — commit `a0004e5` (2026-08-04)

The inline success banner was replaced with a dedicated `/thank-you` route:
confirms receipt, tells the applicant to watch their inbox (and spam
folder), and offers a link back to submit another application. On success
the form now navigates there via `router.push()` instead of resetting
itself in place.

## 13. Internship dates — commit `00e5f3e` (2026-08-06)

Two date pickers, shown only when "Studying — Intern" is selected:

- **Internship Start Date** and **Internship End Date**, both required,
  with end-after-start validated client- and server-side.
- Cleared automatically if the applicant switches away from Intern.
- Stored as `internship_start_date` / `internship_end_date` (nullable
  `date` columns, since they only apply to one category) —
  `supabase/migrations/004_add_internship_dates.sql`.
- Added to the dashboard table and the CSV export.

## 14. Date display format — commits `1f08fab` and `fc91d9b` (2026-08-06)

Dates were rendering in ISO form (`2026-09-01`). The first attempt used
`toLocaleDateString('en-US', …)`, which puts the month first — so the
output was still wrong. The fix builds the string explicitly from
`getUTCDate()` / month name / `getUTCFullYear()`, giving `1 September 2026`
regardless of the viewer's locale. Parsing pins to UTC so a date never
shifts by a day depending on the reviewer's timezone.

## 15. Dashboard overview gauges — commit `304807f` (2026-08-06)

A new `app/dashboard/StatsPanel.js` at the top of the dashboard:

- A **segmented donut ring** where each status occupies an arc proportional
  to its share, so the whole breakdown is legible at a glance. Built as
  four SVG circles sharing one radius, each with a `stroke-dasharray` sized
  to its slice and a `stroke-dashoffset` placing it where the previous arc
  ended.
- **"New" is drawn in the muted colour**, so the coloured portion of the
  ring *is* the reviewed portion — no arithmetic needed to read the
  backlog. The centre shows the reviewed count out of the total.
- A **legend** beside it: total applicants, then per-status count,
  proportional bar and percentage.
- It reads the same client state the table does, so changing a status in
  the table updates the gauges instantly without a reload.
- Deliberately reflects **all** applicants rather than the filtered set:
  the gauges sit above the filter controls, so a number silently changing
  in response to a control further down the page would be easy to miss.

## 16. Pre-application splash screen — commits `ed22b12`, `fd62e4c`, `9dfef3d` (2026-08-06)

Applicants now land on a preparation screen before the form, so nobody
starts filling it in only to discover mid-way that they don't have a
document to hand.

- Thanks the applicant, then lists what to have ready per category:
  interns and graduating applicants need a resume plus a transcript
  covering their program from commencement, with interns additionally
  needing their internship start and end dates; already-working applicants
  need only a resume.
- Closes with the PDF-only and one-file-per-upload constraints — the two
  most common causes of a stalled submission.
- Implemented as a gate on the existing `/` route rather than a new
  `/welcome` page, so the link already shared with applicants shows it. A
  separate route would have been skipped by anyone using the old link.
- The two student categories were merged into one block after review, since
  their document requirements are identical; the internship dates remain as
  an intern-only line item.

## 17. Next.js 14 -> 16 upgrade (branch `upgrade/nextjs-16`)

The setup script's `npm audit` step surfaced 2 high-severity advisories
against Next.js 14 and its bundled PostCSS — 20+ CVEs covering DoS, cache
poisoning, SSRF and XSS. The only fix was a major version bump, so it was
done on a branch rather than straight onto `main`.

**Versions:** `next` 14.2.35 -> 16.3.0, `react` / `react-dom` 18.3.1 -> 19.2.8.
Result: **0 vulnerabilities.**

**Breaking changes that actually affected this codebase — two:**

1. **`cookies()` became async** in Next 15. `lib/supabaseServer.js` was the
   only caller, so `supabaseServer()` itself became `async`, and its three
   call sites (`app/dashboard/page.js`, and twice in
   `app/dashboard/actions.js`) now `await` it.
2. **The `middleware` file convention was deprecated** in Next 16 in favour
   of `proxy`. `middleware.js` was renamed to `proxy.js` and its exported
   function from `middleware` to `proxy`. Behaviour is unchanged — same
   session refresh, same `/dashboard` gate, same matcher.

**Node floor raised** from 18.17 to 20.9 (Next 16's engine requirement),
updated in `scripts/setup.mjs`, `setup.sh`, `setup.ps1`, `docs/SETUP.md`,
and pinned via an `engines` field in `package.json`.

**Not changed, deliberately:** the `cache: 'no-store'` fetch override in
`lib/supabaseAdmin.js` (see §9). Next 15 flipped the default so fetches are
no longer cached, which makes the override redundant — but it is still
correct, costs nothing, and keeps the fix explicit rather than dependent on
a framework default that has already changed once.

**Verified:** production build clean with no warnings; `/thank-you` and
`/login` return 200; `/dashboard` correctly 307-redirects to `/login`,
which exercises the renamed proxy *and* the `@supabase/ssr` auth path
end-to-end; React 19 client hydration confirmed by toggling the theme and
seeing state, DOM and localStorage all update; server log clean.

Not verified without production credentials: a real form submission, file
upload to Storage, and an authenticated dashboard session. Those need a
smoke test against the live Supabase project before merging.

---

## Where things stand

- **Public link:** the deployed Vercel URL's root (`/`) — share this with
  applicants. They see the splash screen, then the form.
- **Admin dashboard:** the same domain plus `/dashboard`, gated by Supabase
  Auth login. Overview gauges at the top, then Manage Positions, then the
  applicants table.
- **To open/close a role or add a new one:** log into `/dashboard` and use
  the "Manage Positions" panel — no code changes or redeploys needed.
- **Migrations applied so far, in order** (all under `supabase/migrations/`,
  plus the consolidated `supabase/schema.sql` for fresh installs):
  1. `002_add_email_phone.sql`
  2. `003_add_positions.sql`
  3. `004_add_internship_dates.sql`

### What gets collected, by category

| | Intern | Graduating | Already Working |
|---|---|---|---|
| Name, email, mobile, position | ✓ | ✓ | ✓ |
| University + Program | ✓ | ✓ | — |
| Internship start / end dates | ✓ | — | — |
| Resume (PDF) | ✓ | ✓ | ✓ |
| Academic transcript (PDF) | ✓ | ✓ | — |

### Routes

| Route | Access | Purpose |
|---|---|---|
| `/` | public | Splash screen, then the application form |
| `/thank-you` | public | Post-submission confirmation |
| `/login` | public | Admin sign-in |
| `/dashboard` | admin only | Gauges, position management, applicant review |
