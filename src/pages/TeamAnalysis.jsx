import { useState } from 'react'
import TeamSelector from '../components/TeamSelector'
import Loading from '../components/Loading'
import { useTeamData } from '../hooks/useTeamData'
import { useSelectedTeams } from '../hooks/useLocalStorage'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

function TeamAnalysis() {
  // Use shared hooks
  const [selectedTeams, setSelectedTeams] = useSelectedTeams('selectedTeamsAnalysis', [])
  
  // Ensure selectedTeams is always an array
  const safeSelectedTeams = Array.isArray(selectedTeams) ? selectedTeams : []
  
  const { allTeams, matchRows, loading } = useTeamData(safeSelectedTeams)

  // Process match data for charts
  const chartData = {}
  if (matchRows) {
    matchRows.forEach((match, index) => {
      const scoutingIdParts = match["Scouting ID"]?.split('_') || []
      const teamNum = scoutingIdParts[1] || 'Unknown'
      const matchNum = scoutingIdParts[2] || (index + 1)
      
      if (!chartData[teamNum]) {
        chartData[teamNum] = []
      }
      
      chartData[teamNum].push({
        match: `Match ${matchNum}`,
        team: teamNum,
        matchNumber: parseInt(matchNum) || (index + 1),
        endgame: match['Endgame Position']?.toLowerCase() || 'none',
        L4: match['L4 Count'] || 0,
        L3: match['L3 Count'] || 0,
        L2: match['L2 Count'] || 0,
        L1: match['L1 Count'] || 0,
        Processor: match['Processor Count'] || 0,
        Net: match['Net Count'] || 0,
        'L4 Miss': match['L4 Missed Count'] || 0,
        'L3 Miss': match['L3 Missed Count'] || 0,
        'L2 Miss': match['L2 Missed Count'] || 0,
        'L1 Miss': match['L1 Missed Count'] || 0,
        'Processor Miss': match['Processor Missed Count'] || 0,
        'Net Miss': match['Net Missed Count'] || 0
      })
    })

    // Sort each team's matches by match number
    Object.keys(chartData).forEach(teamNum => {
      chartData[teamNum].sort((a, b) => a.matchNumber - b.matchNumber)
    })
  }

  const getEndgameLabel = (endgame) => {
    if (endgame?.includes('deep') && endgame?.includes('cage')) return 'Deep'
    if (endgame?.includes('shallow') && endgame?.includes('cage')) return 'Deep'
    if (endgame?.includes('park')) return 'Park'
    return 'None'
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

  return (
    <div className="team-analysis-container">
      <h1>Team Analysis</h1>
      
      <TeamSelector
        allTeams={allTeams || []}
        selectedTeams={safeSelectedTeams}
        onTeamToggle={handleTeamToggle}
        onClearAll={clearAllTeams}
        title="Select Teams to Analyze"
      />

      {loading && <Loading />}

      {safeSelectedTeams.length === 0 ? (
        <p>Select teams to view analysis.</p>
      ) : Object.keys(chartData).length === 0 ? (
        <p>No team data found for selected teams.</p>
      ) : (
        <div className="charts-container">
          {Object.entries(chartData).map(([teamNum, teamMatches]) => (
            <div key={teamNum} className="chart-container">
              <h3 style={{ color: '#2563eb', textAlign: 'center', marginBottom: '1rem' }}>
                Team {teamNum}
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
                    formatter={(value, name, props) => {
                      if (value === 0) return null; // Don't show zero values
                      return [value, name];
                    }}
                    labelFormatter={(label, payload) => {
                      if (payload && payload.length > 0) {
                        const endgame = getEndgameLabel(payload[0].payload.endgame)
                        return `${label} (${endgame})`
                      }
                      return label
                    }}
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        const endgame = getEndgameLabel(data.endgame);
                        
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
                              {label} ({endgame})
                            </p>
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
                    payload={[
                      // Made group
                      { value: 'Processor', type: 'rect', color: '#FF6B35', id: 'Processor' },
                      { value: 'Net', type: 'rect', color: '#00D2FF', id: 'Net' },
                      { value: 'L1', type: 'rect', color: '#4CAF50', id: 'L1' },
                      { value: 'L2', type: 'rect', color: '#FFC107', id: 'L2' },
                      { value: 'L3', type: 'rect', color: '#FF9800', id: 'L3' },
                      { value: 'L4', type: 'rect', color: '#E91E63', id: 'L4' },
                      // Missed group
                      { value: 'Processor Miss', type: 'rect', color: '#FFD4C4', id: 'Processor Miss' },
                      { value: 'Net Miss', type: 'rect', color: '#B3F4FF', id: 'Net Miss' },
                      { value: 'L1 Miss', type: 'rect', color: '#C8E6C9', id: 'L1 Miss' },
                      { value: 'L2 Miss', type: 'rect', color: '#FFF3C4', id: 'L2 Miss' },
                      { value: 'L3 Miss', type: 'rect', color: '#FFE0B2', id: 'L3 Miss' },
                      { value: 'L4 Miss', type: 'rect', color: '#F8BBD9', id: 'L4 Miss' }
                    ]}
                    content={(props) => {
                      const { payload } = props;
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
                  
                  {/* Stack order: bottom to top as specified */}
                  {/* Processor (bottom) */}
                  <Bar dataKey="Processor" stackId="scoring" fill="#FF6B35" name="Processor" />
                  <Bar dataKey="Net" stackId="scoring" fill="#00D2FF" name="Net" />
                  <Bar dataKey="L1" stackId="scoring" fill="#4CAF50" name="L1" />
                  <Bar dataKey="L2" stackId="scoring" fill="#FFC107" name="L2" />
                  <Bar dataKey="L3" stackId="scoring" fill="#FF9800" name="L3" />
                  <Bar dataKey="L4" stackId="scoring" fill="#E91E63" name="L4" />
                  
                  {/* Missed counterparts (top) - more desaturated versions with black dotted borders */}
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
      )}
    </div>
  )
}

export default TeamAnalysis
