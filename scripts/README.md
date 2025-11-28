scripts/README.md

This folder contains scripts to help with data imports and quick Supabase tests.

- `importMatches.mjs` — reads `data/matches.json` or `data/my_test_data.csv` and upserts rows into `match_data` in batches.

Usage examples:

```bash
# Inline env (macOS / zsh)
VITE_SUPABASE_URL=https://your.supabase.url/ VITE_SUPABASE_KEY=eyJ... node --experimental-modules scripts/importMatches.mjs

# Or use dotenv by adding 'import "dotenv/config"' at the top of the script.
```

### Export TBA data (bash)

`export_tba_matches.sh` — fetches matches for an event from The Blue Alliance API and writes a CSV.

Usage:

```bash
# make executable once
chmod +x scripts/export_tba_matches.sh

# export using env TBA_KEY or VITE_OPENAI_API_KEY
TBA_KEY=yX979sIiDrv6f5b... ./scripts/export_tba_matches.sh 2025gagr data/tba_matches_2025gagr.csv
```

The script writes columns: `key,event_key,comp_level,match_number,blue_teams,blue_score,red_teams,red_score,time,winning_alliance`.
