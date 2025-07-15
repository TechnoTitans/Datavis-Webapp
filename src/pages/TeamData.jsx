import { useState, useMemo } from 'react'
import { executeWithPermission } from '../utils/permissions'
import { useTeamData } from '../hooks/useTeamData'
import { useSelectedTeams } from '../hooks/useLocalStorage'
import TeamSelector from '../components/TeamSelector'
import Loading from '../components/Loading'
import { supabase } from '../supabaseClient'

function TeamData() {
  const [selectedTeams, setSelectedTeams] = useSelectedTeams('selectedTeamsData', [])
  const { allTeams, matchRows, loading, setMatchRows } = useTeamData(selectedTeams, false)

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

  // get usedRows by filtering matchRows
  const usedRows = useMemo(() => {
    return matchRows.filter(row => row['Use Data'] === true)
  }, [matchRows])

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

  const getTeamDisplayText = () => {
    if (selectedTeams.length === 0) return 'No Teams'
    if (selectedTeams.length === 1) return `Team ${selectedTeams[0]}`
    return `${selectedTeams.length} Teams`
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Team Data</h1>

      <TeamSelector
        allTeams={allTeams}
        selectedTeams={selectedTeams}
        onTeamToggle={handleTeamToggle}
        onClearAll={clearAllTeams}
        title="Select Teams to View"
      />

      <div style={{ marginTop: '2rem' }}>
        <h2>Matches for {getTeamDisplayText()}</h2>
        {loading ? (
          <Loading message="Loading matches..." />
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
                            <th className="sticky-column">Use Data</th>
                            <th className="second-column">Scouting ID</th>
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
                              <td className="sticky-column">
                                <input
                                  type="checkbox"
                                  checked={!!row['Use Data']}
                                  onChange={e => handleUseDataChange(row["Scouting ID"], e.target.checked)}
                                />
                              </td>
                              <td className="second-column">
                                {String(row['Scouting ID'] || '')}
                              </td>
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