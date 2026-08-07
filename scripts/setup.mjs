#!/usr/bin/env node
/**
 * One-shot setup + health check for the CORTEX ROBOTICS recruitment app.
 *
 * Safe to run repeatedly — every step checks before it changes anything, so a
 * second run just reports "already done". Run it on a fresh machine to go from
 * a bare clone to a verified, buildable install.
 *
 *   node scripts/setup.mjs [flags]
 *
 * Flags:
 *   --non-interactive   Never prompt; fail on anything that needs an answer.
 *   --skip-build        Skip the production build step (faster re-checks).
 *   --skip-install      Assume node_modules is already good.
 *   --help
 */

import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const ENV_FILE = join(ROOT, '.env.local');
const MIN_NODE = [20, 9, 0];
const BUCKET = 'applications';

const argv = new Set(process.argv.slice(2));
const INTERACTIVE = !argv.has('--non-interactive') && process.stdin.isTTY;
const SKIP_BUILD = argv.has('--skip-build');
const SKIP_INSTALL = argv.has('--skip-install');

if (argv.has('--help') || argv.has('-h')) {
  // Print the header comment as the usage text, minus the shebang and the
  // comment syntax itself.
  const header = readFileSync(fileURLToPath(import.meta.url), 'utf8').split('*/')[0];
  console.log(
    header
      .split('\n')
      .filter((l) => !l.startsWith('#!') && l.trim() !== '/**')
      .map((l) => l.replace(/^\s*\* ?/, ''))
      .join('\n')
      .trim()
  );
  process.exit(0);
}

/* ---------- output helpers ---------- */

const useColor = process.stdout.isTTY && !process.env.NO_COLOR;
const c = (code, s) => (useColor ? `\x1b[${code}m${s}\x1b[0m` : s);
const bold = (s) => c('1', s);
const dim = (s) => c('2', s);
const red = (s) => c('31', s);
const green = (s) => c('32', s);
const yellow = (s) => c('33', s);
const cyan = (s) => c('36', s);

let stepNo = 0;
const results = [];

function step(title) {
  stepNo += 1;
  console.log(`\n${bold(`[${stepNo}] ${title}`)}`);
}
const ok = (m) => { console.log(`  ${green('OK')}      ${m}`); results.push(['ok', m]); };
const did = (m) => { console.log(`  ${cyan('CHANGED')} ${m}`); results.push(['changed', m]); };
const warn = (m) => { console.log(`  ${yellow('WARN')}    ${m}`); results.push(['warn', m]); };
const info = (m) => console.log(`  ${dim('-')}       ${dim(m)}`);

class SetupError extends Error {
  constructor(message, hint) {
    super(message);
    this.hint = hint;
  }
}

const IS_WIN = process.platform === 'win32';
const NPM = 'npm';

/**
 * On Windows, npm is a .cmd shim. Node refuses to spawn .cmd/.bat directly
 * (EINVAL, since the CVE-2024-27980 fix), so it has to go through a shell.
 * Passing one pre-joined command string instead of an args array is what
 * avoids the DEP0190 warning — every argument used here is a hardcoded
 * constant, never user input, so there is nothing to escape.
 */
function run(cmd, args, opts = {}) {
  if (IS_WIN && (cmd === 'npm' || cmd === 'npx')) {
    return spawnSync([cmd, ...args].join(' '), { shell: true, windowsHide: true, ...opts });
  }
  return spawnSync(cmd, args, { windowsHide: true, ...opts });
}

/* ---------- prompt helpers ---------- */

let rl;
function readline() {
  if (!rl) rl = createInterface({ input: process.stdin, output: process.stdout });
  return rl;
}

// Control codes, built by code point so no literal control characters appear
// in this source file.
const KEY_EOT = String.fromCharCode(4);
const KEY_ETX = String.fromCharCode(3);
const KEY_DEL = String.fromCharCode(127);

async function ask(question, { secret = false } = {}) {
  if (!INTERACTIVE) {
    throw new SetupError(
      `Need a value for "${question}" but running non-interactively.`,
      'Re-run without --non-interactive, or pre-fill .env.local.'
    );
  }
  if (!secret) return (await readline().question(`  ${question} `)).trim();

  // Masked input: echo asterisks instead of the characters typed, so secrets
  // never land in a shared terminal or a screen recording.
  process.stdout.write(`  ${question} `);
  const input = process.stdin;
  const wasRaw = input.isRaw;
  input.setRawMode(true);
  input.resume();
  let value = '';
  await new Promise((resolve) => {
    const onData = (buf) => {
      const ch = buf.toString('utf8');
      if (ch === '\r' || ch === '\n' || ch === KEY_EOT) {
        input.removeListener('data', onData);
        input.setRawMode(wasRaw);
        input.pause();
        process.stdout.write('\n');
        resolve();
      } else if (ch === KEY_ETX) {
        process.stdout.write('\n');
        process.exit(130);
      } else if (ch === KEY_DEL || ch === '\b') {
        if (value.length) {
          value = value.slice(0, -1);
          process.stdout.write('\b \b');
        }
      } else if (ch >= ' ') {
        value += ch;
        process.stdout.write('*');
      }
    };
    input.on('data', onData);
  });
  return value.trim();
}

async function confirm(question, fallback = false) {
  if (!INTERACTIVE) return fallback;
  const a = (await readline().question(`  ${question} [y/N] `)).trim().toLowerCase();
  return a === 'y' || a === 'yes';
}

/* ---------- env file handling ---------- */

function parseEnv(text) {
  const out = {};
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/i);
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    out[m[1]] = v;
  }
  return out;
}

function writeEnv(vars) {
  const body = [
    '# Generated by scripts/setup.mjs - safe to edit by hand.',
    '# Never commit this file. Never prefix the service role key with NEXT_PUBLIC_.',
    '',
    `NEXT_PUBLIC_SUPABASE_URL=${vars.NEXT_PUBLIC_SUPABASE_URL}`,
    `NEXT_PUBLIC_SUPABASE_ANON_KEY=${vars.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
    `SUPABASE_SERVICE_ROLE_KEY=${vars.SUPABASE_SERVICE_ROLE_KEY}`,
    '',
  ].join('\n');
  writeFileSync(ENV_FILE, body, { mode: 0o600 });
}

/* ---------- steps ---------- */

function checkNode() {
  step('Checking Node.js');
  const cur = process.versions.node.split('.').map(Number);
  const good =
    cur[0] > MIN_NODE[0] ||
    (cur[0] === MIN_NODE[0] &&
      (cur[1] > MIN_NODE[1] || (cur[1] === MIN_NODE[1] && cur[2] >= MIN_NODE[2])));
  if (!good) {
    throw new SetupError(
      `Node ${process.versions.node} is too old - Next.js 16 needs ${MIN_NODE.join('.')}+.`,
      'Install the current LTS from https://nodejs.org and re-run.'
    );
  }
  ok(`Node ${process.versions.node}`);
}

function checkTool(cmd, args, { required = true, label = cmd } = {}) {
  const bin = cmd === 'npm' ? NPM : cmd;
  const r = run(bin, args, { encoding: 'utf8' });
  if (r.status !== 0 || r.error) {
    if (required) {
      throw new SetupError(`${label} is not available on PATH.`, `Install ${label} and re-run.`);
    }
    warn(`${label} not found - optional, continuing.`);
    return null;
  }
  const version = (r.stdout || r.stderr).trim().split('\n')[0];
  ok(`${label} ${version}`);
  return version;
}

function checkTooling() {
  step('Checking required tooling');
  checkTool('npm', ['--version'], { label: 'npm' });
  checkTool('git', ['--version'], { required: false, label: 'git' });
}

function installDeps() {
  step('Installing dependencies');
  if (SKIP_INSTALL) {
    info('--skip-install given');
  } else {
    const hasLock = existsSync(join(ROOT, 'package-lock.json'));
    const args = hasLock ? ['ci'] : ['install'];
    info(`npm ${args.join(' ')}${hasLock ? '  (lockfile found - exact versions)' : ''}`);
    const r = run(NPM, args, { cwd: ROOT, stdio: 'inherit' });
    if (r.status !== 0) {
      throw new SetupError('npm install failed.', 'Scroll up for the npm error, then re-run.');
    }
    did('Dependencies installed');
  }

  // Verify the packages the app actually imports really resolved.
  const required = ['next', 'react', 'react-dom', '@supabase/supabase-js', '@supabase/ssr'];
  const missing = required.filter((p) => !existsSync(join(ROOT, 'node_modules', ...p.split('/'))));
  if (missing.length) {
    throw new SetupError(
      `Missing after install: ${missing.join(', ')}`,
      'Delete node_modules and package-lock.json, then re-run.'
    );
  }
  ok(`All ${required.length} runtime packages present`);
}

function auditDeps() {
  step('Auditing dependencies for known vulnerabilities');
  const r = run(NPM, ['audit', '--json'], { cwd: ROOT, encoding: 'utf8' });
  // npm audit exits non-zero when it finds anything, so status is not an error
  // signal here — only unparseable output is.
  let report;
  try {
    report = JSON.parse(r.stdout);
  } catch {
    warn('Could not run npm audit — skipping this check.');
    return;
  }

  const counts = report.metadata?.vulnerabilities ?? {};
  const serious = (counts.high ?? 0) + (counts.critical ?? 0);
  const total = counts.total ?? 0;

  if (total === 0) {
    ok('No known vulnerabilities');
    return;
  }

  const summary = Object.entries(counts)
    .filter(([k, v]) => v > 0 && k !== 'total')
    .map(([k, v]) => `${v} ${k}`)
    .join(', ');

  if (serious > 0) {
    warn(`${total} known vulnerabilities (${summary})`);
    for (const [name, v] of Object.entries(report.vulnerabilities ?? {})) {
      if (v.severity !== 'high' && v.severity !== 'critical') continue;
      const fix = v.fixAvailable;
      const fixText =
        fix === false
          ? 'no fix available'
          : typeof fix === 'object'
            ? `fix: ${fix.name}@${fix.version}${fix.isSemVerMajor ? ' (MAJOR upgrade)' : ''}`
            : 'fix available';
      info(`${name} (${v.severity}) — ${fixText}`);
    }
    info('Review with: npm audit');
  } else {
    ok(`${total} low/moderate advisories (${summary}) — nothing high or critical`);
  }
}

async function ensureEnv() {
  step('Configuring environment variables');
  const existing = existsSync(ENV_FILE) ? parseEnv(readFileSync(ENV_FILE, 'utf8')) : {};
  const keys = [
    ['NEXT_PUBLIC_SUPABASE_URL', 'Supabase Project URL (https://xxxx.supabase.co):', false],
    ['NEXT_PUBLIC_SUPABASE_ANON_KEY', 'Supabase anon / publishable key:', false],
    ['SUPABASE_SERVICE_ROLE_KEY', 'Supabase service_role secret key:', true],
  ];

  const vars = {};
  let changed = false;
  for (const [key, question, secret] of keys) {
    const fromFile = existing[key];
    const placeholder =
      !fromFile || fromFile.startsWith('your-') || fromFile.includes('YOUR-PROJECT');
    const value = placeholder ? process.env[key] : fromFile;

    if (value) {
      vars[key] = value;
      ok(`${key} set`);
      continue;
    }
    if (!INTERACTIVE) {
      throw new SetupError(
        `${key} is not set.`,
        'Find it in Supabase: Project Settings -> API. Put it in .env.local or export it.'
      );
    }
    info('Find these in Supabase: Project Settings -> API');
    vars[key] = await ask(question, { secret });
    if (!vars[key]) throw new SetupError(`${key} cannot be empty.`);
    changed = true;
  }

  if (!/^https:\/\/[a-z0-9-]+\.supabase\.(co|in)$/i.test(vars.NEXT_PUBLIC_SUPABASE_URL)) {
    warn(`URL "${vars.NEXT_PUBLIC_SUPABASE_URL}" does not look like a Supabase project URL.`);
  }
  if (vars.SUPABASE_SERVICE_ROLE_KEY === vars.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new SetupError(
      'The anon key and the service role key are identical.',
      'They are two different keys - re-copy both from Project Settings -> API.'
    );
  }

  if (changed || !existsSync(ENV_FILE)) {
    writeEnv(vars);
    did(`Wrote ${ENV_FILE}`);
  }
  for (const [k, v] of Object.entries(vars)) process.env[k] = v;
  return vars;
}

async function getAdminClient() {
  const { createClient } = await import('@supabase/supabase-js');
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function checkConnection(admin) {
  step('Connecting to Supabase');
  const { error } = await admin.from('positions').select('id').limit(1);
  if (error && /Invalid API key|JWT/i.test(error.message)) {
    throw new SetupError(
      `Supabase rejected the service role key: ${error.message}`,
      'Re-copy the service_role secret from Project Settings -> API.'
    );
  }
  if (error && !/does not exist|schema cache/i.test(error.message)) {
    throw new SetupError(
      `Could not reach Supabase: ${error.message}`,
      'Check the project URL, and that the project is not paused.'
    );
  }
  ok(`Reachable at ${process.env.NEXT_PUBLIC_SUPABASE_URL}`);
}

const SQL_FILES = [
  'supabase/schema.sql',
  'supabase/migrations/002_add_email_phone.sql',
  'supabase/migrations/003_add_positions.sql',
  'supabase/migrations/004_add_internship_dates.sql',
  'supabase/migrations/005_add_hired_status.sql',
  'supabase/migrations/006_add_interview_status.sql',
];

// Selecting every column the app relies on is a cheap way to prove both the
// schema AND all migrations landed - PostgREST names the first missing column.
const EXPECTED = {
  applicants:
    'id,name,email,phone,category,org,program_or_role,position,' +
    'internship_start_date,internship_end_date,resume_path,transcript_path,status,submitted_at',
  positions: 'id,title,is_active,created_at',
};

async function checkSchema(admin, allowApply = true) {
  step('Verifying database schema');
  const problems = [];
  for (const [table, cols] of Object.entries(EXPECTED)) {
    const { error } = await admin.from(table).select(cols).limit(1);
    if (error) problems.push(`${table}: ${error.message}`);
    else ok(`Table "${table}" has all ${cols.split(',').length} expected columns`);
  }
  if (!problems.length) return;

  for (const p of problems) warn(p);
  info('The schema and/or migrations have not been applied to this project.');

  const dbUrl = process.env.SUPABASE_DB_URL;
  if (
    allowApply &&
    dbUrl &&
    (await confirm('Apply schema.sql + all migrations now via SUPABASE_DB_URL?', false))
  ) {
    await applySqlViaPg(dbUrl);
    return checkSchema(admin, false);
  }

  throw new SetupError(
    'Database schema is incomplete.',
    [
      'Fix it either way:',
      '',
      '  A) Manual - open Supabase -> SQL Editor -> New Query and run each of',
      '     these in order, top to bottom:',
      ...SQL_FILES.map((f) => `       ${f}`),
      '',
      '  B) Automatic - set SUPABASE_DB_URL to your Postgres connection string',
      '     (Supabase -> Project Settings -> Database -> Connection string -> URI)',
      '     and re-run this script.',
    ].join('\n')
  );
}

async function applySqlViaPg(dbUrl) {
  let pg;
  try {
    pg = await import('pg');
  } catch {
    info('Installing the "pg" driver (not saved to package.json)...');
    const r = run(NPM, ['install', '--no-save', 'pg'], { cwd: ROOT, stdio: 'inherit' });
    if (r.status !== 0) throw new SetupError('Could not install the "pg" driver.');
    pg = await import('pg');
  }

  const client = new pg.default.Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  try {
    for (const rel of SQL_FILES) {
      const file = join(ROOT, rel);
      if (!existsSync(file)) {
        warn(`${rel} not found - skipped`);
        continue;
      }
      await client.query(readFileSync(file, 'utf8'));
      did(`Applied ${rel}`);
    }
  } finally {
    await client.end();
  }
}

async function ensureBucket(admin) {
  step('Checking storage bucket');
  const { data: buckets, error } = await admin.storage.listBuckets();
  if (error) throw new SetupError(`Could not list storage buckets: ${error.message}`);

  const found = buckets.find((b) => b.name === BUCKET);
  if (found) {
    if (found.public) {
      warn(`Bucket "${BUCKET}" is PUBLIC - resumes would be world-readable.`);
      info('Fix in Supabase: Storage -> applications -> Settings -> make private.');
    } else {
      ok(`Private bucket "${BUCKET}" exists`);
    }
    return;
  }

  const { error: createError } = await admin.storage.createBucket(BUCKET, { public: false });
  if (createError) {
    throw new SetupError(
      `Could not create bucket "${BUCKET}": ${createError.message}`,
      `Create it manually in Supabase -> Storage, named "${BUCKET}", NOT public.`
    );
  }
  did(`Created private bucket "${BUCKET}"`);
}

async function ensureAdminUser(admin) {
  step('Checking dashboard login');
  const { data, error } = await admin.auth.admin.listUsers();
  if (error) {
    warn(`Could not list auth users: ${error.message}`);
    return;
  }
  if (data.users.length) {
    ok(`${data.users.length} login(s) exist - e.g. ${data.users[0].email}`);
    return;
  }

  warn('No dashboard login exists yet - /dashboard would be unreachable.');
  if (!INTERACTIVE || !(await confirm('Create one now?', false))) {
    info('Create one later: Supabase -> Authentication -> Users -> Add user (Auto Confirm ON).');
    return;
  }

  const email = await ask('Admin email:');
  const password = await ask('Admin password (min 8 chars, input hidden):', { secret: true });
  if (!email || password.length < 8) {
    throw new SetupError('Email is required and the password must be at least 8 characters.');
  }
  const { error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (createError) throw new SetupError(`Could not create login: ${createError.message}`);
  did(`Created dashboard login for ${email}`);
}

function buildApp() {
  step('Building the app');
  if (SKIP_BUILD) {
    info('--skip-build given');
    return;
  }
  const r = run(NPM, ['run', 'build'], { cwd: ROOT, stdio: 'inherit' });
  if (r.status !== 0) {
    throw new SetupError('Production build failed.', 'Scroll up for the compiler error.');
  }
  ok('Production build succeeded');
}

/* ---------- main ---------- */

async function main() {
  console.log(bold('\nCORTEX ROBOTICS - Recruitment app setup'));
  console.log(dim(`Project: ${ROOT}`));

  checkNode();
  checkTooling();
  installDeps();
  auditDeps();
  await ensureEnv();

  const admin = await getAdminClient();
  await checkConnection(admin);
  await checkSchema(admin);
  await ensureBucket(admin);
  await ensureAdminUser(admin);
  buildApp();

  const changes = results.filter((r) => r[0] === 'changed').length;
  const warns = results.filter((r) => r[0] === 'warn');

  console.log(`\n${bold(green('Setup complete.'))}`);
  console.log(`  ${changes} change(s) made, ${warns.length} warning(s).`);
  if (warns.length) {
    console.log(`\n${yellow('Warnings to look at:')}`);
    for (const [, m] of warns) console.log(`  - ${m}`);
  }
  console.log(`\n${bold('Next steps')}`);
  console.log(`  Run locally   ${cyan('npm run dev')}  then open http://localhost:3000`);
  console.log('  Dashboard     http://localhost:3000/dashboard');
  console.log('  Deploy        push to GitHub, import into Vercel, and set the same three');
  console.log('                variables under Settings -> Environment Variables.');
  console.log();
}

main()
  .then(() => {
    rl?.close();
    process.exit(0);
  })
  .catch((err) => {
    rl?.close();
    console.error(`\n${red(bold('Setup failed.'))}`);
    console.error(`  ${err.message}`);
    if (err.hint) console.error(`\n${err.hint}`);
    console.error();
    process.exit(1);
  });
