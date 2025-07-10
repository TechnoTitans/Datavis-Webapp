import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../supabaseClient'

function TeamData() {

  // useState() returns things: the team number and the function used to change it
  const [allTeams, setAllTeams] = useState([])
  const [notes, setNotes] = useState('')
  const [matchRows, setMatchRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [teamNumber, setTeamNumber] = useState(() => {
    return localStorage.getItem('selectedTeam') || ''
  })

  useEffect(() => {
    // Save to localStorage whenever teamNumber changes
    if (teamNumber) {
      localStorage.setItem('selectedTeam', teamNumber)
    }
  }, [teamNumber])

  // to change to just parse from scouting id
  const fetchAllTeams = async () => {
    const { data, error } = await supabase
      .from('match_data')
      .select('"Team Number"')

    if (error) {
      console.error('Error fetching team numbers:', error)
      return
    }

    const uniqueTeams = [...new Set(data.map(row => row["Team Number"]))].sort((a, b) => a - b)
    setAllTeams(uniqueTeams)
  }

  const fetchMatches = async () => {
    if (!teamNumber) {
      setMatchRows([])
      return
    }

    setLoading(true)

    const { data, error } = await supabase
      .from('match_data')
      .select('*')
      .eq('"Team Number"', Number(teamNumber))
      .order('Scouting ID', { ascending: false })

    if (error) {
      console.error('Error fetching match data:', error)
      alert('Failed to load match data.')
    } else {
      setMatchRows(data)
    }

    setLoading(false)
  }

  const onReload = async () => {
    await fetchAllTeams()
    await fetchMatches()
  }

  // call useEffect() whenever teamNumber changes
  useEffect(() => {
    fetchAllTeams()
    fetchMatches()
  }, [teamNumber])

  // get usedRows by filtering matchRows
  const usedRows = useMemo(() => {
    return matchRows.filter(row => row['Use Data'] === true)
  }, [matchRows])

  // summary data memoized to only recalc when usedRows or matchRows changes
  const summary = useMemo(() => {
    if (!usedRows.length) return {}

    const columns = Object.keys(usedRows[0])
    const summaryResult = {}

    // Define scoring levels and their made/missed column names
    const scoringLevels = [
      { made: 'L4 Count', missed: 'L4 Missed Count' },
      { made: 'L3 Count', missed: 'L3 Missed Count' },
      { made: 'L2 Count', missed: 'L2 Missed Count' },
      { made: 'L1 Count', missed: 'L1 Missed Count' },
      { made: 'Processor Count', missed: 'Processor Missed Count' },
      { made: 'Net Count', missed: 'Net Missed Count' },
    ]

    // Helper to check if a column is a missed column
    const missedCols = new Set(scoringLevels.map(level => level.missed))

    for (const col of columns) {
      if (missedCols.has(col)) {
        // skip missed columns from direct output
        continue
      }

      // Check if col is one of the made columns for scoring levels
      const scoringLevel = scoringLevels.find(level => level.made === col)
      if (scoringLevel) {
        // Calculate total attempts and success rate for this scoring level
        const madeVals = usedRows
          .map(r => r[scoringLevel.made])
          .filter(v => typeof v === 'number' && !isNaN(v))
        const missedVals = usedRows
          .map(r => r[scoringLevel.missed])
          .filter(v => typeof v === 'number' && !isNaN(v))

        const totalMade = madeVals.reduce((a, b) => a + b, 0)
        const totalMissed = missedVals.reduce((a, b) => a + b, 0)
        const totalAttempts = totalMade + totalMissed
        const numRows = usedRows.length
        // Compute average attempts per row
        const avgAttempts = numRows > 0 ? totalAttempts / numRows : 0

        if (totalAttempts === 0) {
          // no attempts, skip output
          continue
        }

        const successRate = (totalMade / totalAttempts) * 100
        summaryResult[col] = {
          type: 'scoring',
          attempts: avgAttempts.toFixed(1), // now average attempts
          successRate: successRate.toFixed(1),
        }
        continue
      }

      if (col === 'Use Data') {
        // calculate mode and percentage based on all matchRows
        const freqMap = {}
        for (const row of matchRows) {
          const val = row[col]
          if (val === null || val === undefined) continue
          freqMap[val] = (freqMap[val] || 0) + 1
        }
        const entries = Object.entries(freqMap)
        if (!entries.length) continue

        entries.sort((a, b) => b[1] - a[1]) // sort descending by count. take first for mode
        const [modeVal, count] = entries[0]
        const percent = ((count / matchRows.length) * 100).toFixed(1)

        summaryResult[col] = { type: 'string', value: modeVal, percent }
        continue
      }

      // find first defined value
      const firstVal = usedRows.find(r => r[col] !== null && r[col] !== undefined)?.[col]

      if (firstVal === undefined) continue

      // check if number
      const isNumber = typeof firstVal === 'number' && !isNaN(firstVal)

      // uses average if row data type is number
      if (isNumber) {
        const nums = usedRows
          .map(r => r[col])
          .filter(v => typeof v === 'number' && !isNaN(v))
        const avg = nums.reduce((a, b) => a + b, 0) / nums.length
        summaryResult[col] = { type: 'number', value: avg.toFixed(2) }
      } else {
        // use mode and percentage if not a number
        const freqMap = {}
        for (const row of usedRows) {
          const val = row[col]
          if (val === null || val === undefined) continue
          freqMap[val] = (freqMap[val] || 0) + 1
        }
        const entries = Object.entries(freqMap)
        if (!entries.length) continue

        entries.sort((a, b) => b[1] - a[1]) // sort descending by count. take first for mode
        const [modeVal, count] = entries[0]
        const percent = ((count / usedRows.length) * 100).toFixed(1)

        summaryResult[col] = { type: 'string', value: modeVal, percent }
      }
    }

    return summaryResult
  }, [usedRows, matchRows])

  // todo
  const handleSaveNotes = () => {
    console.log(`Save notes for team ${teamNumber}:`, notes)
  }

  const handleUseDataChange = async (scoutingId, checked) => {
    const { error } = await supabase
      .from('match_data')
      .update({ 'Use Data': checked })
      .eq('"Scouting ID"', scoutingId)

    if (error) {
      console.error('Error updating Use Data:', error)
      alert('Failed to update Use Data field.')
    } else {
      setMatchRows(prevRows =>
        prevRows.map(row =>
          row["Scouting ID"] === scoutingId ? { ...row, 'Use Data': checked } : row
        )
      )
    }
  }

  const fieldsToShow = [
  'L4 Count',
  'L3 Count',
  'L2 Count',
  'L1 Count',
  'Processor Count',
  'Net Count',
  'Use Data',
  'Auton Leave',
  'Auton Piece',
  'Drive Speed',
  'Defense',
  'Mechanical Reliability',
]

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Team Data</h1>

      <div style={{ marginBottom: '1rem' }}>
        <label>Select Team:&nbsp;</label>
        <select
          value={teamNumber}
          onChange={e => setTeamNumber(e.target.value)}
        >
          <option value="" disabled>
            None
          </option>
          {allTeams.map(team => (
            <option key={team} value={team}>{team}</option>
          ))}
        </select>
      </div>

      {/* Summary table */}
      <div style={{ marginTop: '2rem' }}>
        <h2>Summary</h2>
        {Object.keys(summary).length === 0 ? (
          <p>No data to summarize.</p>
        ) : (
          <table border="1" cellPadding="6" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th>Field</th>
                <th>Summary</th>
              </tr>
            </thead>
            <tbody>
              {fieldsToShow.map(field =>
                summary[field] ? (
                  <tr key={field}>
                    <td>{field}</td>
                    <td>
                      {summary[field].type === 'number'
                        ? `Average: ${summary[field].value}`
                        : summary[field].type === 'scoring'
                          ? `${summary[field].attempts} attempts, ${summary[field].successRate}% made`
                          : `Mode: ${summary[field].value} (${summary[field].percent}%)`}
                    </td>
                  </tr>
                ) : null
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* make new table with rows by team number. add saved stuff to it*/}
      <div style={{ marginBottom: '1rem' }}>
        <label>Notes:</label><br />
        <textarea
          rows="4"
          cols="60"
          value={notes}
          onChange={e => setNotes(e.target.value)}
        />
      </div>

      <button onClick={handleSaveNotes}>Save Notes</button>

      <div style={{ marginTop: '2rem' }}>
        <h2>Matches for Team {teamNumber}</h2>
        {loading ? (
          <p>Loading…</p>
        ) : matchRows.length === 0 ? (
          <p>No matches found.</p>
        ) : (
          <table border="1" cellPadding="6" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {/* Always render Use Data as the first column */}
                <th>Use Data</th>
                {/* Dynamically render all other columns from the first row, excluding "Use Data" to avoid duplication */}
                {Object.keys(matchRows[0])
                  .filter(col => col !== 'Use Data')
                  .map(col => (
                    <th key={col}>{col}</th>
                  ))}
              </tr>
            </thead>
            <tbody>
              {matchRows.map((row, idx) => (
                <tr key={row["Scouting ID"] ?? row.id ?? idx}>
                  {/* Use Data checkbox always first */}
                  <td>
                    <input
                      type="checkbox"
                      checked={!!row['Use Data']}
                      onChange={e => handleUseDataChange(row["Scouting ID"], e.target.checked)}
                    />
                  </td>
                  {/* Render other columns dynamically, convert boolean/null to string */}
                  {Object.keys(matchRows[0])
                    .filter(col => col !== 'Use Data')
                    .map(col => {
                      let val = row[col];
                      if (typeof val === 'boolean' || val === null) {
                        val = String(val);
                      }
                      return <td key={col}>{val}</td>
                    })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default TeamData