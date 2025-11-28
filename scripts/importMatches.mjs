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
    'Scouting ID': r.scoutingId || `${r .event}_${r.team}_${r.match}` ,
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
