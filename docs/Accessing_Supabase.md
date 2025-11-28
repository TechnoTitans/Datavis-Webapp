# Accessing Supabase for this Project

This document explains how to access the Supabase instance used by this project, where credentials live, how the client is configured in the codebase, and how to view the database schema and data.

---

## 1) Where the credentials are

- The project uses Vite environment variables. See the `.env` file at the project root.
  - `VITE_SUPABASE_URL` — your Supabase project URL (example: `https://vyrwirioxoelcgrguxpq.supabase.co/`)
  - `VITE_SUPABASE_KEY` — the Supabase anon key used by the frontend

Path: `.env`

Example (already in your repo):
```
VITE_SUPABASE_URL=https://vyrwirioxoelcgrguxpq.supabase.co/
VITE_SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9....
```

Security note: Do NOT commit service_role keys or any secret keys to version control. The anon key is intended for client usage but still should be protected in public repos.

---

## 2) Where the Supabase client is configured in the code

Open `src/supabaseClient.js` — the application initializes the Supabase client there.

File: `src/supabaseClient.js`

```js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)
```

The rest of the app imports `supabase` from this file and uses the JS client to query tables such as `match_data` and `unconfirmed_data`.

---

## 3) Quick way to view data from the running app

1. Start the dev server:

```bash
npm install    # if you haven't already
npm run dev
```

2. Open the app in the browser (usually `http://localhost:5173`).
3. Visit pages that show Supabase data:
   - `Upload` page: shows `unconfirmed_data` and allows approving/rejecting.
   - `Settings` page: shows `match_data` entries and toggles the `Use Data` flag.
   - `TeamData`, `Rankings`, etc. import and display data from `match_data`.

These pages call the same `supabase` client and let you inspect real rows via the UI.

---

## 4) How to view the database schema and data in the Supabase dashboard (recommended)

Use the Supabase web UI for the easiest inspection:

1. Open your browser and go to `https://app.supabase.com`.
2. Sign in with the account that manages the project.
3. Select the project matching `VITE_SUPABASE_URL` (URL shown in the project list).
4. In the left menu, select **Database → Table Editor** to view tables and rows.
5. Select **Database → SQL Editor** to run SQL queries.

Useful SQL queries to inspect schema and tables:

- List all tables in `public` schema:
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

- List columns for a table (example: `match_data`):
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'match_data'
ORDER BY ordinal_position;
```

- View a sample of rows from `match_data`:
```sql
SELECT * FROM public.match_data LIMIT 20;
```

Notes:
- The dashboard provides a visual view and lets you edit rows, run SQL, and export data.
- If you need direct DB credentials (connection string) to use `psql` or GUI DB tools, go to **Project Settings → Database → Connection string** in the Supabase dashboard. Only share the service_role or DB credentials with trusted users.

---

## 5) Quick local test script (Node) to read a table

Create `scripts/testSupabase.mjs` in the repo root with this content:

```js
import { createClient } from '@supabase/supabase-js'

const url = process.env.VITE_SUPABASE_URL || 'https://vyrwirioxoelcgrguxpq.supabase.co/'
const key = process.env.VITE_SUPABASE_KEY || process.env.SUPABASE_KEY || ''

if (!key) {
  console.error('No Supabase key provided. Set VITE_SUPABASE_KEY in your environment or .env file.')
  process.exit(1)
}

const supabase = createClient(url, key)

async function run() {
  const { data, error } = await supabase.from('match_data').select('*').limit(5)
  if (error) {
    console.error('Supabase error:', error)
    process.exit(1)
  }
  console.log('Sample rows from match_data:')
  console.dir(data, { depth: 3 })
}

run()
```

Run it from your shell (loads env from shell, not `.env` automatically):

```bash
# macOS / zsh
export VITE_SUPABASE_URL=https://vyrwirioxoelcgrguxpq.supabase.co/
export VITE_SUPABASE_KEY="$(cat .env | grep VITE_SUPABASE_KEY | cut -d'=' -f2-)"
node --experimental-modules scripts/testSupabase.mjs
```

Or run by prefixing the variables inline (simpler):

```bash
VITE_SUPABASE_URL=https://vyrwirioxoelcgrguxpq.supabase.co/ VITE_SUPABASE_KEY=eyJ... node --experimental-modules scripts/testSupabase.mjs
```

If you need to use ESM-less Node or a different Node version, you can adapt the script to `.cjs` + `require`.

---

## 6) Inspecting schema using `psql` or local GUI

If you want to connect with `psql` or a GUI (TablePlus, DBeaver), get the full connection string from the Supabase dashboard (**Project Settings → Database → Connection string**). Use the `postgresql://` connection with a **service_role** key if you require full rights.

Example `psql` usage:

```bash
# Example (replace with actual connection string from the dashboard)
psql "postgresql://postgres:password@db.host:5432/postgres"
\dt   -- list tables
\d+ match_data   -- show columns & info for match_data
```

Caution: The `anon` key does not provide full DB connect permissions — use the service_role key only in safe environments.

---

## 7) Where this project uses tables and schema (quick pointers)

- `match_data` — main approved scouting data table (used across `TeamData`, `Rankings`, `Settings`) — see `src/hooks/useTeamData.js`, `src/pages/Settings.jsx`, `src/pages/TeamData.jsx`.
- `unconfirmed_data` — staging table for scanned uploads (used in `src/pages/Upload.jsx`).

Search the repo for `.from('match_data')` and `.from('unconfirmed_data')` to find all usage sites.

---

## 8) Next steps / recommendations

- Use the Supabase dashboard SQL Editor to inspect schema and run the example queries above.
- Run the local `scripts/testSupabase.mjs` to fetch a sample of rows.
- If you want, I can add the test script into the repo (I can create `scripts/testSupabase.mjs` for you) and/or implement a small admin page to show schema and sample rows inside the app.

---

If you want me to add the `scripts/testSupabase.mjs` file right now and run it here, tell me and I will create it and execute it (I will need the environment variables to be set appropriately).

## 9) Importing Data into Supabase (Step-by-step)

This section shows common ways to import data into your Supabase project: (A) CSV import using the dashboard, (B) programmatic import using a Node script with `@supabase/supabase-js`, and (C) bulk/large imports and idempotency tips.

A. CSV import (quick, manual)

1. Prepare a CSV file. Include headers that match your table column names (for example `Scouting ID,Scouter Name,Position,Use Data,...`).
2. Open the Supabase Dashboard → **Table Editor** → select the target table (e.g., `match_data`).
3. Click the vertical ellipsis (more) button and choose **Import CSV** (or look for "Import rows").
4. Upload your CSV file, map columns if prompted, and run the import. Verify rows in the table after import.

Notes: the dashboard CSV import is easy for small ad-hoc imports but not suited for repeated automated jobs.

B. Programmatic import (recommended for automation)

Below is a safe pattern to import JSON or CSV data programmatically using Node and the `@supabase/supabase-js` client already used in this project.

1. Create a script file in the repo (example: `scripts/importMatches.mjs`).

Example `scripts/importMatches.mjs` (reads a local JSON file and inserts rows):

```js
import fs from 'fs'
import { createClient } from '@supabase/supabase-js'

const url = process.env.VITE_SUPABASE_URL || 'https://vyrwirioxoelcgrguxpq.supabase.co/'
const key = process.env.VITE_SUPABASE_KEY || ''
if (!key) throw new Error('Set VITE_SUPABASE_KEY in environment')

const supabase = createClient(url, key)

async function run() {
  const raw = fs.readFileSync('data/matches.json', 'utf8')
  const rows = JSON.parse(raw)

  // Map or transform rows to match your DB schema if necessary
  const transformed = rows.map(r => ({
    'Scouting ID': r.scoutingId || `${r.event}_${r.team}_${r.match}` ,
    'Event': r.event,
    'Team': r.team,
    'Match': r.match,
    'Use Data': true,
    // add any other fields expected by match_data
  }))

  // Insert in batches to avoid very large single requests
  const batchSize = 200
  for (let i = 0; i < transformed.length; i += batchSize) {
    const batch = transformed.slice(i, i + batchSize)
    const { data, error } = await supabase.from('match_data').insert(batch)
    if (error) {
      console.error('Insert error on batch', i / batchSize, error)
      process.exit(1)
    }
    console.log(`Inserted batch ${i / batchSize}: ${data.length} rows`)
  }
  console.log('Import complete')
}

run().catch(err => { console.error(err); process.exit(1) })
```

Run the script with your env vars set (macOS / zsh):

```bash
VITE_SUPABASE_URL=https://vyrwirioxoelcgrguxpq.supabase.co/ \
VITE_SUPABASE_KEY=$(cat .env | grep VITE_SUPABASE_KEY | cut -d'=' -f2-) \
node --experimental-modules scripts/importMatches.mjs
```

Tips:
- Validate and transform the source data so field names and types match your table.
- Use batching (example above) to avoid very large payloads and transient failures.
- If you have unique constraints and want idempotent imports, use `.upsert()` instead of `.insert()` and provide the `onConflict` column(s):

```js
await supabase.from('match_data').upsert(batch, { onConflict: 'Scouting ID' })
```

C. Bulk imports and large datasets

- For very large datasets (millions of rows) consider one of these options:
  - Use the Supabase dashboard import for CSV in combination with the DB's `COPY` command via a direct DB connection (requires service_role credentials).
  - Import into a staging table first, run server-side SQL to transform and move records (faster and more controlled).

- When using `psql` and `COPY`, you will need a DB connection string from the Supabase dashboard (Project Settings → Database → Connection string) and permissions via the service_role key. Be careful — service_role keys grant wide permissions and should be kept secret.

D. Field mapping from TBA (example)

If you're importing match data from The Blue Alliance (TBA), typical fields to extract/insert into `match_data` might include:

- `event_key` → `Event`
- `match_number` → `Match`
- `key` → `Scouting ID` (or a derived `event_team_match` id)
- `alliances.blue.team_keys` / `alliances.red.team_keys` → per-team rows or joined representation
- `alliances.blue.score` / `alliances.red.score` → `TBA Score` fields
- `score_breakdown` → mapped into game-specific columns

E. Validation and post-import checks

- Run sample queries after import:
  ```sql
  SELECT COUNT(*) FROM public.match_data;
  SELECT * FROM public.match_data ORDER BY "Scouting ID" DESC LIMIT 10;
  ```
- Spot check several rows against the original source files or TBA to ensure correctness.

---

After adding this section I will mark the docs TODO complete. If you want, I can create `scripts/importMatches.mjs` directly in the repo and run it here (I will need the env variables available). If you'd prefer a CSV import example using your real CSV file, upload it or tell me the path and I'll show the exact import mapping to use.