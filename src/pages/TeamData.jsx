import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../supabaseClient'
import { executeWithPermission } from '../utils/permissions'

function TeamData() {

  // useState() returns things: the team number and the function used to change it
  const [allTeams, setAllTeams] = useState([])
  const [matchRows, setMatchRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [showTeamGrid, setShowTeamGrid] = useState(false)
  const [selectedTeams, setSelectedTeams] = useState(() => {
    try {
      const stored = localStorage.getItem('selectedTeamsData')
      if (stored) {
        return JSON.parse(stored)
      }
      const singleTeam = localStorage.getItem('selectedTeam')
      if (singleTeam) {
        return [singleTeam]
      }
    } catch (e) {}
    return []
  })

  useEffect(() => {
    if (selectedTeams && selectedTeams.length > 0) {
      localStorage.setItem('selectedTeamsData', JSON.stringify(selectedTeams))
    }
  }, [selectedTeams])

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
    if (!selectedTeams || selectedTeams.length === 0) {
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

    // filter rows where team number parsed from Scouting ID matches any selected team
    let filteredRows = []
    for (const row of data) {
      const scoutingId = row["Scouting ID"]
      if (typeof scoutingId === "string") {
        const parts = scoutingId.split('_')
        if (!isNaN(Number(parts[1]))) {
          const rowTeam = String(parts[1])
          if (selectedTeams.includes(rowTeam)) {
            filteredRows.push({ ...row, team: rowTeam })
          }
        }
      }
    }
    // sort first by team, then by match number
    filteredRows = filteredRows.slice().sort((a, b) => {
      if (a.team !== b.team) return Number(a.team) - Number(b.team);
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

  // call useEffect() whenever selectedTeams changes
  useEffect(() => {
    fetchAllTeams()
    fetchMatches()
  }, [selectedTeams])

  const handleTeamToggle = (teamNumber) => {
    const teamStr = String(teamNumber)
    setSelectedTeams(prev => {
      if (prev.includes(teamStr)) {
        return prev.filter(t => t !== teamStr)
      } else {
        return [...prev, teamStr]
      }
    })
  }

  const clearAllTeams = () => {
    setSelectedTeams([])
  }

  const filteredTeams = allTeams.filter(team => 
    String(team).toLowerCase().includes(searchTerm.toLowerCase())
  )

  // get usedRows by filtering matchRows
  const usedRows = useMemo(() => {
    return matchRows.filter(row => row['Use Data'] === true)
  }, [matchRows])

  // todo - remove this function if not needed
  const handleSaveNotes = () => {
    console.log('Save notes functionality - to be implemented')
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

      <div className="compare-team-selection">
        <div className={`team-selection-header ${!showTeamGrid ? 'team-selection-header-only' : ''}`}>
          <h2>Select Teams to View</h2>
          <button 
            onClick={() => setShowTeamGrid(!showTeamGrid)}
            className="toggle-grid-btn"
          >
            {showTeamGrid ? '▲ Hide Teams' : '▼ Show Teams'} ({selectedTeams.length} selected)
          </button>
        </div>

        {showTeamGrid && (
          <>
            <div className="team-selection-controls">
              <div className="search-container">
                <input
                  type="text"
                  placeholder="Search teams..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="team-search-input"
                />
              </div>
              
              <div className="selection-actions">
                <button onClick={clearAllTeams} className="action-btn clear-all">
                  Clear All
                </button>
                <span className="selected-count">
                  {selectedTeams.length} teams selected
                </span>
              </div>
            </div>

            <div className="teams-grid">
              {filteredTeams.length === 0 ? (
                <p className="no-teams">No teams found</p>
              ) : (
                filteredTeams.map(team => (
                  <label key={team} className={`team-checkbox ${selectedTeams.includes(String(team)) ? 'selected' : ''}`}>
                    <input
                      type="checkbox"
                      checked={selectedTeams.includes(String(team))}
                      onChange={() => handleTeamToggle(team)}
                    />
                    <span className="team-number">Team {team}</span>
                    <span className="checkmark">✓</span>
                  </label>
                ))
              )}
            </div>
          </>
        )}
      </div>

      <div style={{ marginTop: '2rem' }}>
        <h2>Matches for {selectedTeams.length === 0 ? 'No Teams' : selectedTeams.length === 1 ? `Team ${selectedTeams[0]}` : `${selectedTeams.length} Teams`}</h2>
        {loading ? (
          <p>Loading…</p>
        ) : matchRows.length === 0 ? (
          <p>No matches found.</p>
        ) : (
          <div className="team-data-container">
            {selectedTeams.map(team => {
              const teamRows = matchRows.filter(row => row.team === team)
              if (teamRows.length === 0) return null
              
              return (
                <div key={team} className="team-data-table-section">
                  <h3 className="team-header">Team {team}</h3>
                  <div className="team-data-table-container">
                    <div className="table-wrapper">
                      <table>
                        <thead>
                          <tr>
                            {/* Always render Use Data as the first column */}
                            <th className="sticky-column">Use Data</th>
                            {/* Always render Scouting ID as the second column */}
                            <th className="second-column">Scouting ID</th>
                            {/* Dynamically render all other columns from the first row, excluding "Use Data", "Scouting ID" and "team" */}
                            {Object.keys(teamRows[0])
                              .filter(col => col !== 'Use Data' && col !== 'team' && col !== 'Scouting ID')
                              .map(col => (
                                <th key={col}>{col}</th>
                              ))}
                          </tr>
                        </thead>
                        <tbody>
                          {teamRows.map((row, idx) => (
                            <tr key={row["Scouting ID"] ?? row.id ?? idx}>
                              {/* Use Data checkbox always first */}
                              <td className="sticky-column">
                                <input
                                  type="checkbox"
                                  checked={!!row['Use Data']}
                                  onChange={e => handleUseDataChange(row["Scouting ID"], e.target.checked)}
                                />
                              </td>
                              {/* Scouting ID always second */}
                              <td className="second-column">
                                {String(row['Scouting ID'] || '')}
                              </td>
                              {/* Render other columns dynamically, convert boolean/null to string */}
                              {Object.keys(teamRows[0])
                                .filter(col => col !== 'Use Data' && col !== 'team' && col !== 'Scouting ID')
                                .map(col => {
                                  let val = row[col];
                                  if (typeof val === 'boolean' || val === null) {
                                    val = String(val);
                                  }
                                  const displayVal = String(val);
                                  return (
                                    <td key={col}>
                                      {displayVal}
                                    </td>
                                  )
                                })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default TeamData