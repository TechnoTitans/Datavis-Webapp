import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TeamSelector from '../components/TeamSelector'
import Loading from '../components/Loading'
import { useTeamData } from '../hooks/useTeamData'
import { useSelectedTeams } from '../hooks/useLocalStorage'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { parseAutoPath, getAutoStatistics } from '../utils/autoPathParser'
import '../index.css'

function AutoPaths() {
  const navigate = useNavigate()

  // State management with custom hooks
  const [selectedTeams, setSelectedTeams] = useSelectedTeams('selectedTeamsAutoPaths', [])

  // Ensure selectedTeams is always an array
  const safeSelectedTeams = Array.isArray(selectedTeams) ? selectedTeams : []

  // Use team data hook
  const { allTeams, matchRows, loading } = useTeamData(safeSelectedTeams, true) // useDataOnly = true

  // Process auto path data for charts
  const chartData = {}
  if (matchRows) {
    matchRows.forEach((match, index) => {
      const scoutingIdParts = match["Scouting ID"]?.split('_') || []
      const teamNum = scoutingIdParts[1] || 'Unknown'
      const matchNum = scoutingIdParts[2] || (index + 1)
      
      if (!chartData[teamNum]) {
        chartData[teamNum] = []
      }
      
      // Parse auto path data
      const autoPath = match['Auto Path'] || ''
      const parsedAutoData = parseAutoPath(autoPath)
      
      chartData[teamNum].push({
        match: `Match ${matchNum}`,
        team: teamNum,
        matchNumber: parseInt(matchNum) || (index + 1),
        autoPath: autoPath,
        L4: parsedAutoData.L4 || 0,
        L3: parsedAutoData.L3 || 0,
        L2: parsedAutoData.L2 || 0,
        L1: parsedAutoData.L1 || 0,
        Processor: parsedAutoData.Processor || 0,
        Net: parsedAutoData.Net || 0,
        'L4 Miss': parsedAutoData.L4_missed || 0,
        'L3 Miss': parsedAutoData.L3_missed || 0,
        'L2 Miss': parsedAutoData.L2_missed || 0,
        'L1 Miss': parsedAutoData.L1_missed || 0,
        'Processor Miss': parsedAutoData.Processor_missed || 0,
        'Net Miss': parsedAutoData.Net_missed || 0,
        opponentLeft: parsedAutoData.opponentLeft,
        coralStations: parsedAutoData.coralStations
      })
    })

    // Sort each team's matches by match number
    Object.keys(chartData).forEach(teamNum => {
      chartData[teamNum].sort((a, b) => a.matchNumber - b.matchNumber)
    })
  }

  // Event handlers
  const handleTeamToggle = (teamNumber) => {
    const teamStr = String(teamNumber)
    setSelectedTeams(prev => {
      // Ensure prev is an array
      const prevArray = Array.isArray(prev) ? prev : []
      if (prevArray.includes(teamStr)) {
        return prevArray.filter(t => t !== teamStr)
      } else {
        return [...prevArray, teamStr]
      }
    })
  }

  const clearAllTeams = () => {
    setSelectedTeams([])
  }

  const handleTeamClick = (teamNumber) => {
    localStorage.setItem('selectedTeamsAnalysis', JSON.stringify([String(teamNumber)]))
    navigate('/team-analysis')
  }

  return (
    <div className="auto-paths-container">
      <h1>Auto Paths</h1>

      <TeamSelector
        allTeams={allTeams || []}
        selectedTeams={safeSelectedTeams}
        onTeamToggle={handleTeamToggle}
        onClearAll={clearAllTeams}
        title="Select Teams for Auto Path Analysis"
      />

      {loading ? (
        <Loading message="Loading team data..." />
      ) : (
        <div style={{ marginTop: '2rem' }}>
          {safeSelectedTeams.length === 0 ? (
            <p>Select teams to view auto path analysis.</p>
          ) : Object.keys(chartData).length === 0 ? (
            <p>No auto path data found for selected teams.</p>
          ) : (
            <div className="charts-container">
              {Object.entries(chartData).map(([teamNum, teamMatches]) => (
                <div key={teamNum} className="chart-container">
                  <h3 style={{ color: '#2563eb', textAlign: 'center', marginBottom: '1rem' }}>
                    Team {teamNum} - Auto Path Performance
                  </h3>
                  <ResponsiveContainer width="100%" height={500}>
                    <BarChart
                      data={teamMatches}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 80
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#4a4a4a" />
                      <XAxis 
                        dataKey="match"
                        stroke="#e0e0e0"
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis stroke="#e0e0e0" />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: '#3a3a3a',
                          border: '1px solid #4a4a4a',
                          borderRadius: '8px',
                          color: '#e0e0e0',
                          zIndex: 9999
                        }}
                        wrapperStyle={{
                          zIndex: 9999
                        }}
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            
                            // Custom order for tooltip display
                            const orderedStats = [
                              { key: 'Processor', color: '#FF6B35' },
                              { key: 'Net', color: '#00D2FF' },
                              { key: 'L1', color: '#4CAF50' },
                              { key: 'L2', color: '#FFC107' },
                              { key: 'L3', color: '#FF9800' },
                              { key: 'L4', color: '#E91E63' },
                              { key: 'Processor Miss', color: '#FFD4C4' },
                              { key: 'Net Miss', color: '#B3F4FF' },
                              { key: 'L1 Miss', color: '#C8E6C9' },
                              { key: 'L2 Miss', color: '#FFF3C4' },
                              { key: 'L3 Miss', color: '#FFE0B2' },
                              { key: 'L4 Miss', color: '#F8BBD9' }
                            ];
                            
                            return (
                              <div style={{
                                backgroundColor: '#3a3a3a',
                                border: '1px solid #4a4a4a',
                                borderRadius: '8px',
                                color: '#e0e0e0',
                                padding: '10px',
                                zIndex: 9999
                              }}>
                                <p style={{ margin: '0 0 8px 0', fontWeight: 'bold' }}>
                                  {label}
                                </p>
                                <p style={{ margin: '0 0 8px 0', fontSize: '12px', fontStyle: 'italic' }}>
                                  Auto Path: {data.autoPath || 'No data'}
                                </p>
                                {data.opponentLeft && (
                                  <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#ff6b6b' }}>
                                    ⚠️ Opponent Left
                                  </p>
                                )}
                                {data.coralStations && data.coralStations.length > 0 && (
                                  <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#4ecdc4' }}>
                                    🪸 Coral Stations: {data.coralStations.join(', ')}
                                  </p>
                                )}
                                {orderedStats.map(stat => {
                                  const value = data[stat.key];
                                  if (value > 0) {
                                    return (
                                      <div key={stat.key} style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        marginBottom: '4px' 
                                      }}>
                                        <span style={{
                                          display: 'inline-block',
                                          width: '12px',
                                          height: '12px',
                                          backgroundColor: stat.color,
                                          marginRight: '8px'
                                        }}></span>
                                        <span>{stat.key}: {value}</span>
                                      </div>
                                    );
                                  }
                                  return null;
                                })}
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend 
                        wrapperStyle={{ paddingTop: '20px' }}
                        content={(props) => {
                          const madeItems = [
                            { value: 'Processor', color: '#FF6B35' },
                            { value: 'Net', color: '#00D2FF' },
                            { value: 'L1', color: '#4CAF50' },
                            { value: 'L2', color: '#FFC107' },
                            { value: 'L3', color: '#FF9800' },
                            { value: 'L4', color: '#E91E63' }
                          ];
                          const missedItems = [
                            { value: 'Processor Miss', color: '#FFD4C4' },
                            { value: 'Net Miss', color: '#B3F4FF' },
                            { value: 'L1 Miss', color: '#C8E6C9' },
                            { value: 'L2 Miss', color: '#FFF3C4' },
                            { value: 'L3 Miss', color: '#FFE0B2' },
                            { value: 'L4 Miss', color: '#F8BBD9' }
                          ];
                          
                          return (
                            <div style={{ 
                              margin: '20px 0 0 0',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: '10px'
                            }}>
                              {/* Made row */}
                              <ul style={{ 
                                listStyle: 'none', 
                                padding: 0, 
                                margin: 0,
                                display: 'flex',
                                flexWrap: 'wrap',
                                justifyContent: 'center',
                                gap: '10px'
                              }}>
                                {madeItems.map((item, index) => (
                                  <li key={index} style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    fontSize: '12px',
                                    color: '#e0e0e0'
                                  }}>
                                    <span style={{
                                      display: 'inline-block',
                                      width: '12px',
                                      height: '12px',
                                      backgroundColor: item.color,
                                      marginRight: '5px'
                                    }}></span>
                                    {item.value}
                                  </li>
                                ))}
                              </ul>
                              
                              {/* Missed row */}
                              <ul style={{ 
                                listStyle: 'none', 
                                padding: 0, 
                                margin: 0,
                                display: 'flex',
                                flexWrap: 'wrap',
                                justifyContent: 'center',
                                gap: '10px'
                              }}>
                                {missedItems.map((item, index) => (
                                  <li key={index} style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    fontSize: '12px',
                                    color: '#e0e0e0'
                                  }}>
                                    <span style={{
                                      display: 'inline-block',
                                      width: '12px',
                                      height: '12px',
                                      backgroundColor: item.color,
                                      marginRight: '5px'
                                    }}></span>
                                    {item.value}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          );
                        }}
                      />
                      
                      {/* Stack order: bottom to top */}
                      <Bar dataKey="Processor" stackId="scoring" fill="#FF6B35" name="Processor" />
                      <Bar dataKey="Net" stackId="scoring" fill="#00D2FF" name="Net" />
                      <Bar dataKey="L1" stackId="scoring" fill="#4CAF50" name="L1" />
                      <Bar dataKey="L2" stackId="scoring" fill="#FFC107" name="L2" />
                      <Bar dataKey="L3" stackId="scoring" fill="#FF9800" name="L3" />
                      <Bar dataKey="L4" stackId="scoring" fill="#E91E63" name="L4" />
                      
                      {/* Missed counterparts - dotted borders */}
                      <Bar 
                        dataKey="Processor Miss" 
                        stackId="scoring" 
                        fill="#FFD4C4" 
                        name="Processor Miss"
                        stroke="#000000"
                        strokeWidth={2}
                        strokeDasharray="6 6"
                      />
                      <Bar 
                        dataKey="Net Miss" 
                        stackId="scoring" 
                        fill="#B3F4FF" 
                        name="Net Miss"
                        stroke="#000000"
                        strokeWidth={2}
                        strokeDasharray="6 6"
                      />
                      <Bar 
                        dataKey="L1 Miss" 
                        stackId="scoring" 
                        fill="#C8E6C9" 
                        name="L1 Miss"
                        stroke="#000000"
                        strokeWidth={2}
                        strokeDasharray="6 6"
                      />
                      <Bar 
                        dataKey="L2 Miss" 
                        stackId="scoring" 
                        fill="#FFF3C4" 
                        name="L2 Miss"
                        stroke="#000000"
                        strokeWidth={2}
                        strokeDasharray="6 6"
                      />
                      <Bar 
                        dataKey="L3 Miss" 
                        stackId="scoring" 
                        fill="#FFE0B2" 
                        name="L3 Miss"
                        stroke="#000000"
                        strokeWidth={2}
                        strokeDasharray="6 6"
                      />
                      <Bar 
                        dataKey="L4 Miss" 
                        stackId="scoring" 
                        fill="#F8BBD9" 
                        name="L4 Miss"
                        stroke="#000000"
                        strokeWidth={2}
                        strokeDasharray="6 6"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                  
                  {/* Auto path statistics summary */}
                  <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#2a2a2a', borderRadius: '8px' }}>
                    <h4 style={{ margin: '0 0 1rem 0', color: '#e0e0e0' }}>Team {teamNum} Auto Path Statistics</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                      {(() => {
                        // Calculate aggregated statistics for this team
                        const allAutoPaths = teamMatches.map(match => match.autoPath).filter(path => path)
                        const aggregatedData = allAutoPaths.reduce((acc, path) => {
                          const parsed = parseAutoPath(path)
                          acc.L1 += parsed.L1
                          acc.L2 += parsed.L2
                          acc.L3 += parsed.L3
                          acc.L4 += parsed.L4
                          acc.Processor += parsed.Processor
                          acc.Net += parsed.Net
                          acc.L1_missed += parsed.L1_missed
                          acc.L2_missed += parsed.L2_missed
                          acc.L3_missed += parsed.L3_missed
                          acc.L4_missed += parsed.L4_missed
                          acc.Processor_missed += parsed.Processor_missed
                          acc.Net_missed += parsed.Net_missed
                          if (parsed.opponentLeft) acc.opponentLeft++
                          return acc
                        }, { L1: 0, L2: 0, L3: 0, L4: 0, Processor: 0, Net: 0, L1_missed: 0, L2_missed: 0, L3_missed: 0, L4_missed: 0, Processor_missed: 0, Net_missed: 0, opponentLeft: 0 })
                        
                        const stats = getAutoStatistics(aggregatedData)
                        const totalMatches = teamMatches.length
                        
                        return Object.entries(stats).map(([level, data]) => (
                          <div key={level} style={{ backgroundColor: '#3a3a3a', padding: '0.5rem', borderRadius: '4px' }}>
                            <strong style={{ color: '#e0e0e0' }}>{level}:</strong>
                            <br />
                            <span style={{ fontSize: '0.9em', color: '#b0b0b0' }}>
                              {data.scored} scored, {data.missed} missed
                              <br />
                              Success Rate: {data.successRate}%
                            </span>
                          </div>
                        ))
                      })()}
                      
                      <div style={{ backgroundColor: '#3a3a3a', padding: '0.5rem', borderRadius: '4px' }}>
                        <strong style={{ color: '#e0e0e0' }}>Other:</strong>
                        <br />
                        <span style={{ fontSize: '0.9em', color: '#b0b0b0' }}>
                          Total Matches: {teamMatches.length}
                          <br />
                          Opponent Left: {teamMatches.filter(m => m.opponentLeft).length} times
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default AutoPaths
