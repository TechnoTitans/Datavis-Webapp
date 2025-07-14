import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../supabaseClient'
import { executeWithPermission } from '../utils/permissions'

function TeamData() {

  // useState() returns things: the team number and the function used to change it
  const [allTeams, setAllTeams] = useState([])
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

  // Fetch all teams by parsing team numbers from "Scouting ID"
  const fetchAllTeams = async () => {
    const { data, error } = await supabase
      .from('match_data')
      .select('"Scouting ID"')

    if (error) {
      console.error('Error fetching scouting IDs:', error)
      return
    }

    // parse team numbers from "Scouting ID"
    const teamNumbers = data
      .map(row => {
        const scoutingId = row["Scouting ID"]
        if (typeof scoutingId === "string") {
          const parts = scoutingId.split('_')
          if (parts.length > 1 && !isNaN(Number(parts[1]))) {
            return Number(parts[1])
          }
        }
        return null
      })
      .filter(num => num !== null)
    const uniqueTeams = [...new Set(teamNumbers)].sort((a, b) => a - b)
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

    if (error) {
      console.error('Error fetching match data:', error)
      alert('Failed to load match data.')
      setLoading(false)
      return
    }

    // filter rows where team number parsed from Scouting ID matches selected teamNumber
    let filteredRows = data.filter(row => {
      const scoutingId = row["Scouting ID"]
      if (typeof scoutingId === "string") {
        const parts = scoutingId.split('_')
        if (parts.length > 1 && !isNaN(Number(parts[1]))) {
          return String(parts[1]) === String(teamNumber)
        }
      }
      return false
    })
    // sort by match number
    filteredRows = filteredRows.slice().sort((a, b) => {
      const getMatchNum = scoutingId => {
        if (typeof scoutingId === "string") {
          const parts = scoutingId.split('_')
          if (parts.length > 2 && !isNaN(Number(parts[2]))) {
            return Number(parts[2])
          }
        }
        return 0
      }
      return getMatchNum(a["Scouting ID"]) - getMatchNum(b["Scouting ID"])
    })
    setMatchRows(filteredRows)
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

  // todo
  const handleSaveNotes = () => {
    console.log(`Save notes for team ${teamNumber}:`, notes)
  }

  const handleUseDataChange = async (scoutingId, checked) => {
    console.log('handleUseDataChange called:', { scoutingId, checked })
    try {
      await executeWithPermission(async () => {
        console.log('Permission granted, updating database...')
        const { error, data } = await supabase
          .from('match_data')
          .update({ 'Use Data': checked })
          .eq('"Scouting ID"', scoutingId)
          .select()

        console.log('Database update result:', { error, data })
        
        if (error) {
          console.error('Error updating Use Data:', error)
          alert('Failed to update Use Data field.')
        } else {
          console.log('Database updated successfully')
          setMatchRows(prevRows =>
            prevRows.map(row =>
              row["Scouting ID"] === scoutingId ? { ...row, 'Use Data': checked } : row
            )
          )
        }
      })
    } catch (error) {
      console.log('Permission denied or error:', error.message)
    }
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

      <div style={{ marginTop: '2rem' }}>
        <h2>Matches for Team {teamNumber}</h2>
        {loading ? (
          <p>Loading…</p>
        ) : matchRows.length === 0 ? (
          <p>No matches found.</p>
        ) : (
          <div className="team-data-table-container">
            <table>
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
                        const displayVal = String(val);
                        return (
                          <td 
                            key={col} 
                            title={displayVal.length > 15 ? displayVal : undefined}
                          >
                            {displayVal}
                          </td>
                        )
                      })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default TeamData