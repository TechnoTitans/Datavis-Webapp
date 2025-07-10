import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../supabaseClient'

function TeamData() {

  // useState() returns things: the team number and the function used to change it
  const [allTeams, setAllTeams] = useState([])
  const [teamNumber, setTeamNumber] = useState('')
  const [notes, setNotes] = useState('')
  const [matchRows, setMatchRows] = useState([])
  const [loading, setLoading] = useState(false)

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
      .eq('Team Number', Number(teamNumber))
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

  // summary data memoized to only recalc when matchRows changes
  const summary = useMemo(() => {
    if (!matchRows.length) return {}

    const columns = Object.keys(matchRows[0])
    const summaryResult = {}

    for (const col of columns) {
      // find first defined value
      const firstVal = matchRows.find(r => r[col] !== null && r[col] !== undefined)?.[col]

      if (firstVal === undefined) continue

      // check if number
      const isNumber = typeof firstVal === 'number' && !isNaN(firstVal)

      // uses average if row data type is number
      if (isNumber) {
        const nums = matchRows
          .map(r => r[col])
          .filter(v => typeof v === 'number' && !isNaN(v))
        const avg = nums.reduce((a, b) => a + b, 0) / nums.length
        summaryResult[col] = { type: 'number', value: avg.toFixed(2) }
      } else {
        // use mode and percentage if not a number
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
      }
    }

    return summaryResult
  }, [matchRows])

  // todo
  const handleSaveNotes = () => {
    console.log(`Save notes for team ${teamNumber}:`, notes)
  }

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
              {Object.entries(summary).map(([col, info]) => (
                <tr key={col}>
                  <td>{col}</td>
                  <td>
                    {info.type === 'number'
                      ? `Average: ${info.value}`
                      : `Mode: ${info.value} (${info.percent}%)`}
                  </td>
                </tr>
              ))}
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
                <th>Scouting ID</th>
                <th>L4 Count</th>
                <th>Comments</th>
              </tr>
            </thead>
            <tbody>
              {matchRows.map(row => (
                <tr key={row.id ?? `${row.team_number}-${row.match_number}`}>
                  <td>{row["Scouting ID"]}</td>
                  <td>{row["L4 Count"]}</td>
                  <td>{row.Notes}</td>
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