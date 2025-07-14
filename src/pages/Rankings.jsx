import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

function Rankings() {
  const [teamStats, setTeamStats] = useState([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState('avgCycles')
  const [sortOrder, setSortOrder] = useState('desc')
  const [error, setError] = useState('')
  const [useAttempts, setUseAttempts] = useState(false)

  useEffect(() => {
    fetchTeamStats()
  }, [useAttempts])

  const fetchTeamStats = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('match_data')
        .select('*')
        .eq('Use Data', true)

      if (error) {
        throw error
      }

      const teamStatsMap = new Map()

      data.forEach(match => {
        const teamNumber = match['Scouting ID']?.split('_')[1]
        if (!teamNumber) return

        if (!teamStatsMap.has(teamNumber)) {
          teamStatsMap.set(teamNumber, {
            teamNumber: parseInt(teamNumber),
            matchCount: 0,
            avgCycles: 0,
            avgCoralCycles: 0,
            avgAlgaeCycles: 0,
            avgL4: 0,
            avgL3: 0,
            avgL2: 0,
            avgL1: 0,
            avgProcessor: 0,
            avgNet: 0,
            avgDriverQuality: 0,
            avgDefenseAbility: 0,
            avgMechanicalReliability: 0,
            avgAlgaeDescorability: 0,
            totalMissed: 0,
            accuracy: 0,
            endgameAverage: 0,
            endgameStats: {
              hanging: 0,
              parking: 0,
              none: 0
            }
          })
        }

        const team = teamStatsMap.get(teamNumber)
        team.matchCount++

        const l4Count = useAttempts ? (match['L4 Count'] || 0) + (match['L4 Missed Count'] || 0) : (match['L4 Count'] || 0)
        const l3Count = useAttempts ? (match['L3 Count'] || 0) + (match['L3 Missed Count'] || 0) : (match['L3 Count'] || 0)
        const l2Count = useAttempts ? (match['L2 Count'] || 0) + (match['L2 Missed Count'] || 0) : (match['L2 Count'] || 0)
        const l1Count = useAttempts ? (match['L1 Count'] || 0) + (match['L1 Missed Count'] || 0) : (match['L1 Count'] || 0)
        const processorCount = useAttempts ? (match['Processor Count'] || 0) + (match['Processor Missed Count'] || 0) : (match['Processor Count'] || 0)
        const netCount = useAttempts ? (match['Net Count'] || 0) + (match['Net Missed Count'] || 0) : (match['Net Count'] || 0)

        const coralCycles = l4Count + l3Count + l2Count + l1Count
        const algaeCycles = processorCount + netCount
        const totalCycles = coralCycles + algaeCycles

        team.avgCycles += totalCycles
        team.avgCoralCycles += coralCycles
        team.avgAlgaeCycles += algaeCycles

        team.avgL4 += l4Count
        team.avgL3 += l3Count
        team.avgL2 += l2Count
        team.avgL1 += l1Count
        team.avgProcessor += processorCount
        team.avgNet += netCount

        team.avgDriverQuality += match['Driver Quality'] || 0
        team.avgDefenseAbility += match['Defense Ability'] || 0
        team.avgMechanicalReliability += match['Mechanical Reliability'] || 0
        team.avgAlgaeDescorability += match['Algae Descorability'] || 0

        const totalShots = (match['L4 Count'] || 0) + (match['L3 Count'] || 0) + 
                          (match['L2 Count'] || 0) + (match['L1 Count'] || 0) + 
                          (match['Processor Count'] || 0) + (match['Net Count'] || 0)
        const totalMissed = (match['L4 Missed Count'] || 0) + (match['L3 Missed Count'] || 0) + 
                           (match['L2 Missed Count'] || 0) + (match['L1 Missed Count'] || 0) + 
                           (match['Processor Missed Count'] || 0) + (match['Net Missed Count'] || 0)
        
        team.totalMissed += totalMissed

        const endgame = match['Endgame Position']?.toLowerCase()
        let endgamePoints = 0
        
        if (endgame?.includes('deep') && endgame?.includes('cage')) {
          endgamePoints = 12
          team.endgameStats.hanging++
        } else if (endgame?.includes('shallow') && endgame?.includes('cage')) {
          endgamePoints = 6
          team.endgameStats.hanging++
        } else if (endgame?.includes('park')) {
          endgamePoints = 2
          team.endgameStats.parking++
        } else {
          endgamePoints = 0
          team.endgameStats.none++
        }
        
        team.endgameAverage += endgamePoints
      })

      const teamStatsArray = Array.from(teamStatsMap.values()).map(team => {
        team.avgCycles = Math.round(team.avgCycles / team.matchCount * 10) / 10
        team.avgCoralCycles = Math.round(team.avgCoralCycles / team.matchCount * 10) / 10
        team.avgAlgaeCycles = Math.round(team.avgAlgaeCycles / team.matchCount * 10) / 10
        team.avgL4 = Math.round(team.avgL4 / team.matchCount * 10) / 10
        team.avgL3 = Math.round(team.avgL3 / team.matchCount * 10) / 10
        team.avgL2 = Math.round(team.avgL2 / team.matchCount * 10) / 10
        team.avgL1 = Math.round(team.avgL1 / team.matchCount * 10) / 10
        team.avgProcessor = Math.round(team.avgProcessor / team.matchCount * 10) / 10
        team.avgNet = Math.round(team.avgNet / team.matchCount * 10) / 10
        team.avgDriverQuality = Math.round(team.avgDriverQuality / team.matchCount * 10) / 10
        team.avgDefenseAbility = Math.round(team.avgDefenseAbility / team.matchCount * 10) / 10
        team.avgMechanicalReliability = Math.round(team.avgMechanicalReliability / team.matchCount * 10) / 10
        team.avgAlgaeDescorability = Math.round(team.avgAlgaeDescorability / team.matchCount * 10) / 10
        team.endgameAverage = Math.round(team.endgameAverage / team.matchCount * 10) / 10

        const totalAttempts = team.avgL4 * team.matchCount + team.avgL3 * team.matchCount + 
                             team.avgL2 * team.matchCount + team.avgL1 * team.matchCount + 
                             team.avgProcessor * team.matchCount + team.avgNet * team.matchCount + team.totalMissed
        team.accuracy = totalAttempts > 0 ? Math.round((totalAttempts - team.totalMissed) / totalAttempts * 1000) / 10 : 0

        return team
      })

      setTeamStats(teamStatsArray)
    } catch (error) {
      console.error('Error fetching team stats:', error)
      setError('Error loading team statistics: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSort = (stat) => {
    if (sortBy === stat) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')
    } else {
      setSortBy(stat)
      setSortOrder('desc')
    }
  }

  const sortedTeams = [...teamStats].sort((a, b) => {
    let aValue = a[sortBy]
    let bValue = b[sortBy]

    if (sortBy === 'teamNumber') {
      aValue = parseInt(a.teamNumber)
      bValue = parseInt(b.teamNumber)
    }

    if (sortOrder === 'desc') {
      return bValue > aValue ? 1 : bValue < aValue ? -1 : 0
    } else {
      return aValue > bValue ? 1 : aValue < bValue ? -1 : 0
    }
  })

  const getSortIcon = (stat) => {
    if (sortBy !== stat) return '↕️'
    return sortOrder === 'desc' ? '↓' : '↑'
  }

  const getRankColor = (rank) => {
    return 'transparent'
  }

  if (loading) {
    return (
      <div className="rankings-container">
        <h2>Rankings</h2>
        <p>Loading team statistics...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rankings-container">
        <h2>Rankings</h2>
        <div className="message error">{error}</div>
      </div>
    )
  }

  return (
    <div className="rankings-container">
      <h2>Team Rankings</h2>
      <div className="rankings-controls">
        <label className="toggle-container">
          <input
            type="checkbox"
            checked={useAttempts}
            onChange={(e) => setUseAttempts(e.target.checked)}
          />
          <span className="toggle-text">Show All Attempts (Made + Missed)</span>
        </label>
      </div>
      {teamStats.length === 0 ? (
        <p>No team data available. Upload some match data first!</p>
      ) : (
        <div className="rankings-table-container">
          <table className="rankings-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th onClick={() => handleSort('teamNumber')} className="sortable">
                  Team {getSortIcon('teamNumber')}
                </th>
                {sortBy !== 'teamNumber' && (
                  <th onClick={() => handleSort(sortBy)} className="sortable" style={{ backgroundColor: '#4a5568', fontWeight: 'bold' }}>
                    {sortBy === 'avgCycles' && `Avg Cycles ${getSortIcon('avgCycles')}`}
                    {sortBy === 'avgCoralCycles' && `Avg Coral Cycles ${getSortIcon('avgCoralCycles')}`}
                    {sortBy === 'avgAlgaeCycles' && `Avg Algae Cycles ${getSortIcon('avgAlgaeCycles')}`}
                    {sortBy === 'avgL4' && `Avg L4 ${getSortIcon('avgL4')}`}
                    {sortBy === 'avgL3' && `Avg L3 ${getSortIcon('avgL3')}`}
                    {sortBy === 'avgL2' && `Avg L2 ${getSortIcon('avgL2')}`}
                    {sortBy === 'avgL1' && `Avg L1 ${getSortIcon('avgL1')}`}
                    {sortBy === 'avgProcessor' && `Avg Processor ${getSortIcon('avgProcessor')}`}
                    {sortBy === 'avgNet' && `Avg Net ${getSortIcon('avgNet')}`}
                    {sortBy === 'accuracy' && `Accuracy % ${getSortIcon('accuracy')}`}
                    {sortBy === 'endgameAverage' && `Endgame Average ${getSortIcon('endgameAverage')}`}
                    {sortBy === 'avgDriverQuality' && `Driver ${getSortIcon('avgDriverQuality')}`}
                    {sortBy === 'avgDefenseAbility' && `Defense ${getSortIcon('avgDefenseAbility')}`}
                    {sortBy === 'avgMechanicalReliability' && `Reliability ${getSortIcon('avgMechanicalReliability')}`}
                  </th>
                )}
                {sortBy !== 'avgCycles' && (
                  <th onClick={() => handleSort('avgCycles')} className="sortable">
                    Avg Cycles {getSortIcon('avgCycles')}
                  </th>
                )}
                {sortBy !== 'avgCoralCycles' && (
                  <th onClick={() => handleSort('avgCoralCycles')} className="sortable">
                    Avg Coral Cycles {getSortIcon('avgCoralCycles')}
                  </th>
                )}
                {sortBy !== 'avgAlgaeCycles' && (
                  <th onClick={() => handleSort('avgAlgaeCycles')} className="sortable">
                    Avg Algae Cycles {getSortIcon('avgAlgaeCycles')}
                  </th>
                )}
                {sortBy !== 'avgL4' && (
                  <th onClick={() => handleSort('avgL4')} className="sortable">
                    Avg L4 {getSortIcon('avgL4')}
                  </th>
                )}
                {sortBy !== 'avgL3' && (
                  <th onClick={() => handleSort('avgL3')} className="sortable">
                    Avg L3 {getSortIcon('avgL3')}
                  </th>
                )}
                {sortBy !== 'avgL2' && (
                  <th onClick={() => handleSort('avgL2')} className="sortable">
                    Avg L2 {getSortIcon('avgL2')}
                  </th>
                )}
                {sortBy !== 'avgL1' && (
                  <th onClick={() => handleSort('avgL1')} className="sortable">
                    Avg L1 {getSortIcon('avgL1')}
                  </th>
                )}
                {sortBy !== 'avgProcessor' && (
                  <th onClick={() => handleSort('avgProcessor')} className="sortable">
                    Avg Processor {getSortIcon('avgProcessor')}
                  </th>
                )}
                {sortBy !== 'avgNet' && (
                  <th onClick={() => handleSort('avgNet')} className="sortable">
                    Avg Net {getSortIcon('avgNet')}
                  </th>
                )}
                {sortBy !== 'accuracy' && (
                  <th onClick={() => handleSort('accuracy')} className="sortable">
                    Accuracy % {getSortIcon('accuracy')}
                  </th>
                )}
                {sortBy !== 'endgameAverage' && (
                  <th onClick={() => handleSort('endgameAverage')} className="sortable">
                    Endgame Average {getSortIcon('endgameAverage')}
                  </th>
                )}
                {sortBy !== 'avgDriverQuality' && (
                  <th onClick={() => handleSort('avgDriverQuality')} className="sortable">
                    Driver {getSortIcon('avgDriverQuality')}
                  </th>
                )}
                {sortBy !== 'avgDefenseAbility' && (
                  <th onClick={() => handleSort('avgDefenseAbility')} className="sortable">
                    Defense {getSortIcon('avgDefenseAbility')}
                  </th>
                )}
                {sortBy !== 'avgMechanicalReliability' && (
                  <th onClick={() => handleSort('avgMechanicalReliability')} className="sortable">
                    Reliability {getSortIcon('avgMechanicalReliability')}
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {sortedTeams.map((team, index) => (
                <tr key={team.teamNumber} style={{ backgroundColor: getRankColor(index + 1) }}>
                  <td className="rank-cell">
                    <strong>#{index + 1}</strong>
                  </td>
                  <td className="team-cell">
                    <strong>{team.teamNumber}</strong>
                  </td>
                  {sortBy !== 'teamNumber' && (
                    <td style={{ backgroundColor: '#4a5568', fontWeight: 'bold' }}>
                      <strong>
                        {sortBy === 'avgCycles' && team.avgCycles}
                        {sortBy === 'avgCoralCycles' && team.avgCoralCycles}
                        {sortBy === 'avgAlgaeCycles' && team.avgAlgaeCycles}
                        {sortBy === 'avgL4' && team.avgL4}
                        {sortBy === 'avgL3' && team.avgL3}
                        {sortBy === 'avgL2' && team.avgL2}
                        {sortBy === 'avgL1' && team.avgL1}
                        {sortBy === 'avgProcessor' && team.avgProcessor}
                        {sortBy === 'avgNet' && team.avgNet}
                        {sortBy === 'accuracy' && `${team.accuracy}%`}
                        {sortBy === 'endgameAverage' && team.endgameAverage}
                        {sortBy === 'avgDriverQuality' && team.avgDriverQuality}
                        {sortBy === 'avgDefenseAbility' && team.avgDefenseAbility}
                        {sortBy === 'avgMechanicalReliability' && team.avgMechanicalReliability}
                      </strong>
                    </td>
                  )}
                  {sortBy !== 'avgCycles' && <td><strong>{team.avgCycles}</strong></td>}
                  {sortBy !== 'avgCoralCycles' && <td><strong>{team.avgCoralCycles}</strong></td>}
                  {sortBy !== 'avgAlgaeCycles' && <td><strong>{team.avgAlgaeCycles}</strong></td>}
                  {sortBy !== 'avgL4' && <td>{team.avgL4}</td>}
                  {sortBy !== 'avgL3' && <td>{team.avgL3}</td>}
                  {sortBy !== 'avgL2' && <td>{team.avgL2}</td>}
                  {sortBy !== 'avgL1' && <td>{team.avgL1}</td>}
                  {sortBy !== 'avgProcessor' && <td>{team.avgProcessor}</td>}
                  {sortBy !== 'avgNet' && <td>{team.avgNet}</td>}
                  {sortBy !== 'accuracy' && <td>{team.accuracy}%</td>}
                  {sortBy !== 'endgameAverage' && <td>{team.endgameAverage}</td>}
                  {sortBy !== 'avgDriverQuality' && <td>{team.avgDriverQuality}</td>}
                  {sortBy !== 'avgDefenseAbility' && <td>{team.avgDefenseAbility}</td>}
                  {sortBy !== 'avgMechanicalReliability' && <td>{team.avgMechanicalReliability}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default Rankings