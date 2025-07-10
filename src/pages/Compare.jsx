import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../supabaseClient'

function Compare() {

  // useState() returns things: the team number and the function used to change it
  const [allTeams, setAllTeams] = useState([])
  const [selectedTeams, setSelectedTeams] = useState([])
  const [matchRows, setMatchRows] = useState([])
  const [loading, setLoading] = useState(false)

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
    if (!selectedTeams || selectedTeams.length === 0) {
      setMatchRows([])
      return
    }

    setLoading(true)

    const { data, error } = await supabase
      .from('match_data')
      .select('*')
      .in('"Team Number"', selectedTeams.map(Number))
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

  // call useEffect() whenever selectedTeams changes
  useEffect(() => {
    fetchAllTeams()
    fetchMatches()
  }, [selectedTeams])

  // get usedRows per team
  const usedRowsByTeam = useMemo(() => {
    // Map: teamNumber -> usedRows[]
    const result = {}
    for (const team of selectedTeams) {
      result[team] = matchRows.filter(
        row => row['Use Data'] === true && String(row['Team Number']) === String(team)
      )
    }
    return result
  }, [matchRows, selectedTeams])

  // summary data per team
  const summaryByTeam = useMemo(() => {
    const summaries = {}
    for (const team of selectedTeams) {
      const usedRows = usedRowsByTeam[team] || []
      if (!usedRows.length) {
        summaries[team] = {}
        continue
      }
      const columns = Object.keys(usedRows[0])
      const summaryResult = {}
      for (const col of columns) {
        // find first defined value
        const firstVal = usedRows.find(r => r[col] !== null && r[col] !== undefined)?.[col]
        if (firstVal === undefined) continue
        // check if number
        const isNumber = typeof firstVal === 'number' && !isNaN(firstVal)
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
      summaries[team] = summaryResult
    }
    return summaries
  }, [usedRowsByTeam, selectedTeams])

  return (
    <div className="compare-container">
      <h1>Team Data</h1>

      <div className="team-dropdown-wrapper">
        <label htmlFor="team-dropdown">Select Teams:&nbsp;</label>
        {/* Custom Dropdown */}
        <TeamDropdown
          allTeams={allTeams}
          selectedTeams={selectedTeams}
          setSelectedTeams={setSelectedTeams}
        />
      </div>

      {/* Combined summary table for all teams */}
      <div className="summary-section">
        <h2>Summary</h2>
        {selectedTeams.length === 0 ? (
          <p>No teams selected.</p>
        ) : (
          (() => {
            // Collect all unique fields across all selected teams
            const allFieldsSet = new Set()
            selectedTeams.forEach(team => {
              Object.keys(summaryByTeam[team] || {}).forEach(field => allFieldsSet.add(field))
            })
            const allFields = Array.from(allFieldsSet)
            if (allFields.length === 0) {
              return <p>No data to summarize for the selected teams.</p>
            }
            return (
              <table className="summary-table" border="1" cellPadding="6">
                <thead>
                  <tr>
                    <th>Field</th>
                    {selectedTeams.map(team => (
                      <th key={team}>Team {team}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allFields.map(field => (
                    <tr key={field}>
                      <td>{field}</td>
                      {selectedTeams.map(team => {
                        const info = summaryByTeam[team]?.[field]
                        if (!info) {
                          return <td key={team} className="no-data">–</td>
                        }
                        return (
                          <td key={team}>
                            {info.type === 'number'
                              ? `Average: ${info.value}`
                              : `Mode: ${info.value} (${info.percent}%)`}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          })()
        )}
      </div>

    </div>
  )
}

export default Compare
// dropdown component for selecting multiple teams with checkboxes
function TeamDropdown({ allTeams, selectedTeams, setSelectedTeams }) {
  const [open, setOpen] = useState(false)
  // handle closing dropdown when clicking outside
  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (!e.target.closest('.team-dropdown-container')) setOpen(false)
    }
    window.addEventListener('mousedown', handler)
    return () => window.removeEventListener('mousedown', handler)
  }, [open])

  const toggleTeam = (team) => {
    setSelectedTeams(prev =>
      prev.includes(team)
        ? prev.filter(t => t !== team)
        : [...prev, team]
    )
  }

  return (
    <div className="team-dropdown-container">
      <div
        tabIndex={0}
        onClick={() => setOpen(o => !o)}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setOpen(o => !o) }}
        className="team-dropdown-header"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="team-dropdown-selected" >
          {selectedTeams.length === 0
            ? 'Select teams...'
            : selectedTeams.join(', ')}
        </span>
        <span className="team-dropdown-arrow">
          ▼
        </span>
      </div>
      {open && (
        <div className="team-dropdown-list">
          {allTeams.length === 0 ? (
            <div className="team-dropdown-no-teams">No teams</div>
          ) : (
            allTeams.map(team => (
              <label
                key={team}
                className={`team-dropdown-item${selectedTeams.includes(team) ? ' selected' : ''}`}
                tabIndex={0}
                onKeyDown={e => {
                  if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault()
                    toggleTeam(team)
                  }
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedTeams.includes(team)}
                  onChange={() => toggleTeam(team)}
                  tabIndex={-1}
                />
                {team}
              </label>
            ))
          )}
        </div>
      )}
    </div>
  )
}