# Running this app on another machine

Everything in [BUILD_LOG.md](BUILD_LOG.md) that *can* be automated is, in
`scripts/setup.mjs`. This page is the operator's guide to it.

---

## TL;DR

```bash
git clone https://github.com/kumar-rpg/AI-RecruitmentDrive.git
cd AI-RecruitmentDrive
./setup.sh          # macOS / Linux / WSL / Git Bash
```

```powershell
git clone https://github.com/kumar-rpg/AI-RecruitmentDrive.git
cd AI-RecruitmentDrive
.\setup.ps1         # Windows PowerShell
```

Have your three Supabase API values to hand — the script will ask for any it
can't find. It is **safe to re-run**: every step checks before it changes
anything, so a second run just reports what's already in place.

---

## What it does, in order

| # | Step | Fails the run? | Fixes it for you? |
|---|---|---|---|
| 1 | Node.js is installed and >= 20.9 | yes | no — tells you where to get it |
| 2 | `npm` present, `git` present | yes / warn only | no |
| 3 | `npm ci` (or `npm install`), then verifies all 5 runtime packages resolved | yes | yes |
| 4 | `npm audit` for known vulnerabilities | no — warns | no |
| 5 | Reads/creates `.env.local` with the three Supabase values | yes | yes — prompts, service key input is masked |
| 6 | Supabase project is reachable and the service key is accepted | yes | no |
| 7 | `applicants` + `positions` tables have every expected column | yes | optional — see below |
| 8 | Private `applications` storage bucket exists | yes | yes — creates it |
| 9 | At least one dashboard login exists | no — warns | optional — offers to create one |
| 10 | `npm run build` succeeds | yes | no |

## Prerequisites you must supply

The script cannot invent these — get them from
**Supabase → Project Settings → API**:

| Value | Variable | Notes |
|---|---|---|
| Project URL | `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxx.supabase.co` |
| anon / publishable key | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | safe in the browser |
| service_role secret | `SUPABASE_SERVICE_ROLE_KEY` | **server-only**, bypasses RLS |

They're written to `.env.local` (mode `600`, and gitignored). If you'd rather
not be prompted, export them first or create `.env.local` by hand from
`.env.example`.

## Applying the database schema

Step 7 verifies the schema by selecting every column the app depends on — which
proves both `schema.sql` *and* all migrations landed. If something's missing you
have two options.

**A. Manual** (no extra setup). In Supabase → SQL Editor → New Query, run these
in order, top to bottom:

```
supabase/schema.sql
supabase/migrations/002_add_email_phone.sql
supabase/migrations/003_add_positions.sql
supabase/migrations/004_add_internship_dates.sql
```

**B. Automatic.** Set `SUPABASE_DB_URL` to your Postgres connection string
(Supabase → Project Settings → Database → Connection string → URI) and re-run.
The script will offer to apply all four files for you, pulling in the `pg`
driver on demand without adding it to `package.json`.

```bash
export SUPABASE_DB_URL='postgresql://postgres:...@db.xxxx.supabase.co:5432/postgres'
./setup.sh
```

Every file is idempotent (`create table if not exists`, `add column if not
exists`), so applying them to a database that already has them is a no-op.

## Flags

| Flag | Effect |
|---|---|
| `--skip-build` | Skip step 10. Useful for a quick re-check. |
| `--skip-install` | Assume `node_modules` is already good. |
| `--non-interactive` | Never prompt — fail instead. For CI. |
| `--help` | Usage. |

PowerShell uses `-SkipBuild`, `-SkipInstall`, `-NonInteractive`.

### Running it in CI

```bash
NEXT_PUBLIC_SUPABASE_URL=... \
NEXT_PUBLIC_SUPABASE_ANON_KEY=... \
SUPABASE_SERVICE_ROLE_KEY=... \
node scripts/setup.mjs --non-interactive
```

Exit code is `0` only if every fail-the-run step passed.

## What is deliberately *not* automated

- **Creating the Supabase project.** Do it at
  [supabase.com/dashboard](https://supabase.com/dashboard) — pick a region near
  your applicants.
- **Deploying to Vercel.** Import the GitHub repo at
  [vercel.com/new](https://vercel.com/new), then add the same three variables
  under Settings → Environment Variables. Deploys are automatic on push after
  that.
- **Rotating keys.** If the service role key ever leaks, rotate it in Supabase
  and update both `.env.local` and Vercel.

## Troubleshooting

| Symptom | Cause |
|---|---|
| `Node ... is too old` | Next.js 16 needs 20.9+. Install the current LTS. |
| `Supabase rejected the service role key` | The anon key and service key got swapped, or the key was truncated on copy. |
| `Could not reach Supabase: fetch failed` | Wrong project URL, no network, or the project is paused (free projects pause after inactivity). |
| `Database schema is incomplete` | Migrations not applied — see above. |
| `Bucket "applications" is PUBLIC` | Resumes would be world-readable. Fix in Storage → applications → make private. |
| `No dashboard login exists` | `/dashboard` is unreachable until you add a user. Let the script create one, or Supabase → Authentication → Users → Add user with Auto Confirm ON. |
| PowerShell refuses to run `setup.ps1` | `powershell -ExecutionPolicy Bypass -File .\setup.ps1` |
