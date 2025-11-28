#!/usr/bin/env bash
# Export TBA matches for an event to CSV
# Usage: ./scripts/export_tba_matches.sh 2025gagr data/tba_matches_2025gagr.csv

set -euo pipefail

EVENT_KEY=${1:-}
OUT_FILE=${2:-}

if [ -z "$EVENT_KEY" ] || [ -z "$OUT_FILE" ]; then
  echo "Usage: $0 <event_key> <out_csv_path>"
  echo "Example: $0 2025gagr data/tba_matches_2025gagr.csv"
  exit 1
fi

# TBA key environment variable: TBA_KEY or VITE_OPENAI_API_KEY
TBA_KEY=${TBA_KEY:-${VITE_OPENAI_API_KEY:-}}
if [ -z "$TBA_KEY" ]; then
  echo "Error: TBA API key not set. Export TBA_KEY or VITE_OPENAI_API_KEY in your environment." >&2
  exit 1
fi

# Ensure dependencies
if ! command -v curl >/dev/null 2>&1; then
  echo "Error: curl not installed." >&2
  exit 1
fi
if ! command -v jq >/dev/null 2>&1; then
  echo "Error: jq not installed. Install with 'brew install jq' (macOS) or your package manager." >&2
  exit 1
fi

API_URL="https://www.thebluealliance.com/api/v3/event/${EVENT_KEY}/matches"

# Fetch and convert to CSV. Adjust fields below as needed.
# Output columns: key,event_key,comp_level,match_number,blue_teams,blue_score,red_teams,red_score,time,winning_alliance

mkdir -p "$(dirname "$OUT_FILE")"

curl -s -H "X-TBA-Auth-Key: $TBA_KEY" -H "accept: application/json" "$API_URL" \
  | jq -r '
    # normalize arrays of scalars into joined strings, convert nested objects recursively
    def normalize:
      if type == "object" then with_entries(.value |= normalize)
      elif type == "array" then
        if (map(type) | all(. == "string" or . == "number" or . == "boolean" or . == "null")) then
          join(";")
        else
          map(normalize)
        end
      else . end;

    # convert an array of values into an object with numeric keys (for flattening)
    def arr_to_obj:
      reduce range(0; length) as $i ({}; . + { ($i|tostring): (.[ $i ] | normalize) });

    # flatten scalar paths into dot-separated keys; handle objects and arrays safely
    def flatten_obj:
      (. | normalize) as $n
      | if ($n | type) == "object" then
          reduce ($n | paths(scalars)[]) as $p ({}; . + { ($p | map(tostring) | join(".")): ($n | getpath($p)) })
        elif ($n | type) == "array" then
          ($n | arr_to_obj) as $ao
          | reduce ($ao | paths(scalars)[]) as $p ({}; . + { ($p | map(tostring) | join(".")): ($ao | getpath($p)) })
        else
          {} end;

    # ensure input is an array (some responses may be a single object)
    (if type == "array" then . else [.] end) as $items

    # build rows and header dynamically from items
    ($items | map(flatten_obj)) as $rows
    | ($rows | map(keys) | add | unique) as $keys
    | ($keys | @csv),
      ($rows[] | [ . as $r | $keys[] | ( ($r[.] // "") | tostring ) ] | @csv)
  ' > "$OUT_FILE"

echo "Wrote $OUT_FILE"
