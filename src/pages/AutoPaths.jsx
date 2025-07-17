import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TeamSelector from '../components/TeamSelector'
import Loading from '../components/Loading'
import FieldVisualization from '../components/FieldVisualization'
import { useTeamData } from '../hooks/useTeamData'
import { useSelectedTeams } from '../hooks/useLocalStorage'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { parseAutoPath, getAutoStatistics } from '../utils/autoPathParser'
import '../index.css'

function AutoPaths() {
  const navigate = useNavigate()
  const [viewMode, setViewMode] = useState('stats') // 'stats' or 'visualization'
  const [currentPathIndex, setCurrentPathIndex] = useState({}) // Track current path index per team

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
        coralStations: parsedAutoData.coralStations,
        parsedData: parsedAutoData
      })
    })

    // Sort each team's matches by match number
    Object.keys(chartData).forEach(teamNum => {
      chartData[teamNum].sort((a, b) => a.matchNumber - b.matchNumber)
      // Initialize current path index for this team
      if (!(teamNum in currentPathIndex)) {
        setCurrentPathIndex(prev => ({ ...prev, [teamNum]: 0 }))
      }
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
    setCurrentPathIndex({})
  }

  const handleTeamClick = (teamNumber) => {
    localStorage.setItem('selectedTeamsAnalysis', JSON.stringify([String(teamNumber)]))
    navigate('/team-analysis')
  }

  const handleNextPath = (teamNum) => {
    setCurrentPathIndex(prev => {
      const teamPaths = chartData[teamNum] || []
      const currentIndex = prev[teamNum] || 0
      const nextIndex = currentIndex + 1 < teamPaths.length ? currentIndex + 1 : 0
      return { ...prev, [teamNum]: nextIndex }
    })
  }

  const handlePrevPath = (teamNum) => {
    setCurrentPathIndex(prev => {
      const teamPaths = chartData[teamNum] || []
      const currentIndex = prev[teamNum] || 0
      const prevIndex = currentIndex > 0 ? currentIndex - 1 : teamPaths.length - 1
      return { ...prev, [teamNum]: prevIndex }
    })
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

      {/* View Mode Toggle */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        gap: '1rem', 
        margin: '1rem 0',
        padding: '1rem',
        backgroundColor: '#2a2a2a',
        borderRadius: '8px',
        border: '1px solid #4a4a4a'
      }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#e0e0e0' }}>
          <input
            type="radio"
            name="viewMode"
            value="stats"
            checked={viewMode === 'stats'}
            onChange={(e) => setViewMode(e.target.value)}
          />
          <span style={{ fontWeight: 'bold' }}>📊 Stats Mode</span>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#e0e0e0' }}>
          <input
            type="radio"
            name="viewMode"
            value="visualization"
            checked={viewMode === 'visualization'}
            onChange={(e) => setViewMode(e.target.value)}
          />
          <span style={{ fontWeight: 'bold' }}>🗺️ Visualization Mode</span>
        </label>
      </div>

      {loading ? (
        <Loading message="Loading team data..." />
      ) : (
        <div style={{ marginTop: '2rem' }}>
          {safeSelectedTeams.length === 0 ? (
            <p style={{ textAlign: 'center', fontSize: '1.2rem', color: '#666' }}>
              Select teams to view auto path {viewMode === 'stats' ? 'statistics' : 'visualizations'}.
            </p>
          ) : Object.keys(chartData).length === 0 ? (
            <p style={{ textAlign: 'center', fontSize: '1.2rem', color: '#666' }}>
              No auto path data found for selected teams.
            </p>
          ) : viewMode === 'stats' ? (
            // Stats Mode - Bar Charts
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
                      <YAxis 
                        stroke="#e0e0e0" 
                        allowDecimals={false}
                      />
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
                                  Path: {data.autoPath || 'No data'}
                                </p>
                                {data.opponentLeft && (
                                  <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#ffa500' }}>
                                    Leave
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
                </div>
              ))}
            </div>
          ) : (
            // Visualization Mode - Field Visualizations
            <div className="visualizations-container">
              {Object.entries(chartData).map(([teamNum, teamPaths]) => {
                const currentIndex = currentPathIndex[teamNum] || 0
                const currentPath = teamPaths[currentIndex]
                
                if (!currentPath) return null

                return (
                  <div key={teamNum} style={{ 
                    marginBottom: '3rem',
                    padding: '1rem',
                    border: '2px solid #4a4a4a',
                    borderRadius: '12px',
                    backgroundColor: '#2a2a2a'
                  }}>
                    {/* Team header with navigation */}
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      marginBottom: '1rem',
                      padding: '1rem',
                      backgroundColor: '#1a1a1a',
                      borderRadius: '8px',
                      border: '1px solid #4a4a4a'
                    }}>
                      <h2 
                        style={{ 
                          color: '#2563eb', 
                          margin: 0,
                          cursor: 'pointer',
                          textDecoration: 'underline'
                        }}
                        onClick={() => handleTeamClick(teamNum)}
                      >
                        Team {teamNum}
                      </h2>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <button
                          onClick={() => handlePrevPath(teamNum)}
                          disabled={teamPaths.length <= 1}
                          style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: teamPaths.length <= 1 ? '#555' : '#4CAF50',
                            color: '#e0e0e0',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: teamPaths.length <= 1 ? 'not-allowed' : 'pointer',
                            fontSize: '14px'
                          }}
                        >
                          ← Previous
                        </button>
                        
                        <span style={{ 
                          fontWeight: 'bold',
                          minWidth: '120px',
                          textAlign: 'center',
                          color: '#e0e0e0'
                        }}>
                          {currentPath.match} ({currentIndex + 1} of {teamPaths.length})
                        </span>
                        
                        <button
                          onClick={() => handleNextPath(teamNum)}
                          disabled={teamPaths.length <= 1}
                          style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: teamPaths.length <= 1 ? '#555' : '#4CAF50',
                            color: '#e0e0e0',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: teamPaths.length <= 1 ? 'not-allowed' : 'pointer',
                            fontSize: '14px'
                          }}
                        >
                          Next →
                        </button>
                      </div>
                    </div>

                    {/* Field visualization */}
                    <FieldVisualization
                      autoPath={currentPath.autoPath}
                      position={currentPath.position || 'B1'}
                    />
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default AutoPaths
