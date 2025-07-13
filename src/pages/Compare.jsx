import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../supabaseClient'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

function Compare() {

  // useState() returns things: the team number and the function used to change it
  const [allTeams, setAllTeams] = useState([])
  const [matchRows, setMatchRows] = useState([])
  const [loading, setLoading] = useState(false)
  // selectedTeams is an array of team numbers (as strings)
  const [selectedTeams, setSelectedTeams] = useState(() => {
    try {
      const stored = localStorage.getItem('selectedTeams')
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (e) {}
    return []
  })

  useEffect(() => {
    if (selectedTeams && selectedTeams.length > 0) {
      localStorage.setItem('selectedTeams', JSON.stringify(selectedTeams))
    }
  }, [selectedTeams])

  // get all teams by parsing team numbers from "Scouting ID"
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
    .eq("Use Data", true);

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

  // call useEffect() whenever teamNumber changes
  useEffect(() => {
    fetchAllTeams()
    fetchMatches()
  }, [selectedTeams])

  // summary data memoized to only recalc when matchRows or matchRows changes
  const summary = useMemo(() => {
    if (!matchRows.length) return {}

    // group data by team first
    const dataByTeam = {}
    for (const row of matchRows) {
      const team = row.team ?? 'Unknown'
      if (!dataByTeam[team]) dataByTeam[team] = []
      dataByTeam[team].push(row)
    }

    const summaryByTeam = {}
    
    for (const [team, teamRows] of Object.entries(dataByTeam)) {
      if (!teamRows.length) continue
      
      const columns = Object.keys(teamRows[0])
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

      // missedCols is Set of missed columns
      const missedCols = new Set(scoringLevels.map(level => level.missed))

      // Compute Coral Cycles as total L4–L1 (made + missed), and Algae Cycles as Processor + Net (made + missed)
      let coralMade = 0, coralMissed = 0;
      let algaeMade = 0, algaeMissed = 0;
      for (const row of teamRows) {
        for (const level of [
          { made: 'L4 Count', missed: 'L4 Missed Count' },
          { made: 'L3 Count', missed: 'L3 Missed Count' },
          { made: 'L2 Count', missed: 'L2 Missed Count' },
          { made: 'L1 Count', missed: 'L1 Missed Count' },
        ]) {
          if (typeof row[level.made] === 'number' && !isNaN(row[level.made])) coralMade += row[level.made];
          if (typeof row[level.missed] === 'number' && !isNaN(row[level.missed])) coralMissed += row[level.missed];
        }
        for (const level of [
          { made: 'Processor Count', missed: 'Processor Missed Count' },
          { made: 'Net Count', missed: 'Net Missed Count' },
        ]) {
          if (typeof row[level.made] === 'number' && !isNaN(row[level.made])) algaeMade += row[level.made];
          if (typeof row[level.missed] === 'number' && !isNaN(row[level.missed])) algaeMissed += row[level.missed];
        }
      }
      const totalCoralCycles = coralMade + coralMissed;
      const totalAlgaeCycles = algaeMade + algaeMissed;

      if (totalCoralCycles > 0) {
        const numRows = teamRows.length
        const coralSuccess = totalCoralCycles === 0 ? 0 : (coralMade / totalCoralCycles) * 100
        summaryResult['Coral Cycles'] = {
          type: 'scoring',
          avgAttempts: numRows > 0 ? totalCoralCycles / numRows : 0,
          successRate: coralSuccess.toFixed(1),
          average: numRows > 0 ? (coralMade / numRows).toFixed(2) : '0.00',
          made: coralMade,
          missed: coralMissed,
        }
      } else {
        summaryResult['Coral Cycles'] = {
          type: 'scoring',
          avgAttempts: 0,
          successRate: '0.0',
          average: '0.00',
          made: 0,
          missed: 0,
        }
      }
      if (totalAlgaeCycles > 0) {
        const numRows = teamRows.length
        const algaeSuccess = totalAlgaeCycles === 0 ? 0 : (algaeMade / totalAlgaeCycles) * 100
        summaryResult['Algae Cycles'] = {
          type: 'scoring',
          avgAttempts: numRows > 0 ? totalAlgaeCycles / numRows : 0,
          successRate: algaeSuccess.toFixed(1),
          average: numRows > 0 ? (algaeMade / numRows).toFixed(2) : '0.00',
          made: algaeMade,
          missed: algaeMissed,
        }
      } else {
        summaryResult['Algae Cycles'] = {
          type: 'scoring',
          avgAttempts: 0,
          successRate: '0.0',
          average: '0.00',
          made: 0,
          missed: 0,
        }
      }

      // Total Cycles (combination of Coral + Algae)
      const totalCycles = totalCoralCycles + totalAlgaeCycles;
      const totalMade = coralMade + algaeMade;
      const totalMissed = coralMissed + algaeMissed;
      
      if (totalCycles > 0) {
        const numRows = teamRows.length
        const totalSuccess = totalCycles === 0 ? 0 : (totalMade / totalCycles) * 100
        summaryResult['Total Cycles'] = {
          type: 'scoring',
          avgAttempts: numRows > 0 ? totalCycles / numRows : 0,
          successRate: totalSuccess.toFixed(1),
          average: numRows > 0 ? (totalMade / numRows).toFixed(2) : '0.00',
          made: totalMade,
          missed: totalMissed,
        }
      } else {
        summaryResult['Total Cycles'] = {
          type: 'scoring',
          avgAttempts: 0,
          successRate: '0.0',
          average: '0.00',
          made: 0,
          missed: 0,
        }
      }

      for (const col of columns) {
        if (missedCols.has(col)) {
          continue
        }

        // set scoringLevel to the right scoring level
        const scoringLevel = scoringLevels.find(level => level.made === col)
        if (scoringLevel) {
          // calculate total attempts and success rate for this scoring level
          const madeVals = teamRows
            .map(r => r[scoringLevel.made])
            .filter(v => typeof v === 'number' && !isNaN(v))
          const missedVals = teamRows
            .map(r => r[scoringLevel.missed])
            .filter(v => typeof v === 'number' && !isNaN(v))

          const totalMade = madeVals.reduce((a, b) => a + b, 0)
          const totalMissed = missedVals.reduce((a, b) => a + b, 0)
          const totalAttempts = totalMade + totalMissed
          const numRows = teamRows.length
          // find average made per row
          const avgMade = numRows > 0 ? totalMade / numRows : 0
          // calculate average attempts per row
          const avgAttempts = numRows > 0 ? totalAttempts / numRows : 0

          if (totalAttempts === 0) {
            continue
          }

          const successRate = (totalMade / totalAttempts) * 100
          summaryResult[col] = {
            type: 'scoring',
            avgAttempts: avgAttempts,
            successRate: successRate.toFixed(1),
            average: avgMade.toFixed(2),
            made: totalMade,
          }
          continue
        }

        if (col === 'Use Data') {
          const teamMatchRows = matchRows.filter(row => row.team === team)
          const total = teamMatchRows.length
          const used = teamMatchRows.filter(row => row['Use Data'] === true).length
          const percent = total > 0 ? ((used / total) * 100).toFixed(1) : '0.0'
          summaryResult[col] = { type: 'number', value: percent }
          continue
        }
        
        // find first defined value
        const firstVal = teamRows.find(r => r[col] !== null && r[col] !== undefined)?.[col]

        if (firstVal === undefined) continue

        // check if number
        const isNumber = typeof firstVal === 'number' && !isNaN(firstVal)

        // uses average if row data type is number
        if (isNumber) {
          const nums = teamRows
            .map(r => r[col])
            .filter(v => typeof v === 'number' && !isNaN(v))
          const avg = nums.reduce((a, b) => a + b, 0) / nums.length
          summaryResult[col] = { type: 'number', value: avg.toFixed(2) }
        } else {
          // use mode and percentage if not a number
          const freqMap = {}
          for (const row of teamRows) {
            const val = row[col]
            if (val === null || val === undefined) continue
            freqMap[val] = (freqMap[val] || 0) + 1
          }
          const entries = Object.entries(freqMap)
          if (!entries.length) continue

          entries.sort((a, b) => b[1] - a[1]) // sort descending by count. take first for mode
          const [modeVal, count] = entries[0]
          const percent = ((count / teamRows.length) * 100).toFixed(1)

          summaryResult[col] = { type: 'string', value: modeVal, percent }
        }
      }

      summaryByTeam[team] = summaryResult
    }
    
    return summaryByTeam
  }, [matchRows, matchRows])

  const fieldsToShow = [
    'Total Cycles',
    'Coral Cycles',
    'Algae Cycles',
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

  // selected stat for chart
  const [selectedStat, setSelectedStat] = useState('')


  const buildStatChartData = (data, field) => {
    const scoringLevels = [
      { made: 'L4 Count', missed: 'L4 Missed Count' },
      { made: 'L3 Count', missed: 'L3 Missed Count' },
      { made: 'L2 Count', missed: 'L2 Missed Count' },
      { made: 'L1 Count', missed: 'L1 Missed Count' },
      { made: 'Processor Count', missed: 'Processor Missed Count' },
      { made: 'Net Count', missed: 'Net Missed Count' },
    ];
    let madeCol = null, missedCol = null, multiCols = null;
    if (field === 'Total Cycles') {
      multiCols = [
        { made: 'L4 Count', missed: 'L4 Missed Count' },
        { made: 'L3 Count', missed: 'L3 Missed Count' },
        { made: 'L2 Count', missed: 'L2 Missed Count' },
        { made: 'L1 Count', missed: 'L1 Missed Count' },
        { made: 'Processor Count', missed: 'Processor Missed Count' },
        { made: 'Net Count', missed: 'Net Missed Count' },
      ];
    } else if (field === 'Coral Cycles') {
      multiCols = [
        { made: 'L4 Count', missed: 'L4 Missed Count' },
        { made: 'L3 Count', missed: 'L3 Missed Count' },
        { made: 'L2 Count', missed: 'L2 Missed Count' },
        { made: 'L1 Count', missed: 'L1 Missed Count' },
      ];
    } else if (field === 'Algae Cycles') {
      multiCols = [
        { made: 'Processor Count', missed: 'Processor Missed Count' },
        { made: 'Net Count', missed: 'Net Missed Count' },
      ];
    } else {
      const found = scoringLevels.find(level => level.made === field);
      if (found) {
        madeCol = found.made;
        missedCol = found.missed;
      }
    }
    const grouped = {}
    for (const row of data) {
      const team = row.team ?? ''
      if (!grouped[team]) grouped[team] = []
      grouped[team].push(row)
    }
    const result = {}
    for (const team in grouped) {
      result[team] = grouped[team].map((row, idx) => {
        let made = 0, missed = 0, hasData = false;
        if (multiCols) {
          for (const level of multiCols) {
            const vMade = row[level.made];
            const vMissed = row[level.missed];
            if (typeof vMade === 'number' && !isNaN(vMade)) {
              made += vMade;
              hasData = true;
            }
            if (typeof vMissed === 'number' && !isNaN(vMissed)) {
              missed += vMissed;
              hasData = true;
            }
          }
        } else if (madeCol && missedCol) {
          const vMade = row[madeCol];
          const vMissed = row[missedCol];
          if (typeof vMade === 'number' && !isNaN(vMade)) {
            made = vMade;
            hasData = true;
          }
          if (typeof vMissed === 'number' && !isNaN(vMissed)) {
            missed = vMissed;
            hasData = true;
          }
        }
        const attempts = made + missed;
        return {
          match: idx + 1,
          attempts: hasData ? attempts : null,
          successRate: hasData && attempts > 0 ? (made / attempts) * 100 : null,
          made: hasData ? made : null,
          team,
        };
      });
    }
    return result;
  };

  // color palette for teams
  const TEAM_COLORS = [
    "#3366cc", "#e53935", "#43a047", "#fbc02d", "#8e24aa", "#00838f", "#f57c00", "#6d4c41", "#3949ab", "#c62828"
  ];
  function getColorForTeam(team, idx) {
    return TEAM_COLORS[idx % TEAM_COLORS.length]
  }


  const AttemptsChart = ({ chartDataByTeam, selectedTeams }) => {
    const hasData = selectedTeams.some(team => (chartDataByTeam[team] || []).some(row => row.attempts !== null))
    if (!hasData) return <p>No data for this field.</p>;
    let max = 1, min = 0
    for (const team of selectedTeams) {
      const arr = chartDataByTeam[team] || []
      arr.forEach(row => {
        if (row.attempts != null) {
          if (row.attempts > max) max = row.attempts
          if (row.attempts < min) min = row.attempts
        }
      })
    }
    return (
      <div style={{ marginBottom: '2rem' }}>
        <h3>Attempts</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="match" label={{ value: "Match", position: "insideBottom", offset: -5 }} />
            <YAxis
              label={{ value: "Attempts", angle: -90, position: "insideLeft" }}
              allowDecimals={true}
              domain={[Math.min(0, min), Math.max(1, max)]}
            />
            <Tooltip />
            <Legend />
            {selectedTeams.map((team, i) => (
              <Line
                key={team}
                type="monotone"
                dataKey="attempts"
                name={`Team ${team}`}
                data={chartDataByTeam[team]}
                stroke={getColorForTeam(team, i)}
                dot
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const SuccessRateChart = ({ chartDataByTeam, selectedTeams }) => {
    const hasData = selectedTeams.some(team => (chartDataByTeam[team] || []).some(row => row.successRate !== null))
    if (!hasData) return <p>No Success % data for this field.</p>;
    return (
      <div style={{ marginBottom: '2rem' }}>
        <h3>Success %</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="match" label={{ value: "Match", position: "insideBottom", offset: -5 }} />
            <YAxis
              label={{ value: "Success %", angle: -90, position: "insideLeft" }}
              allowDecimals={true}
              domain={[0, 100]}
            />
            <Tooltip />
            <Legend />
            {selectedTeams.map((team, i) => (
              <Line
                key={team}
                type="monotone"
                dataKey="successRate"
                name={`Team ${team}`}
                data={chartDataByTeam[team]}
                stroke={getColorForTeam(team, i)}
                dot
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const MadeChart = ({ chartDataByTeam, selectedTeams }) => {
    const hasData = selectedTeams.some(team => (chartDataByTeam[team] || []).some(row => row.made !== null))
    if (!hasData) return <p>No Made data for this field.</p>;
    // Find max/min for Y axis across all teams
    let max = 1, min = 0
    for (const team of selectedTeams) {
      const arr = chartDataByTeam[team] || []
      arr.forEach(row => {
        if (row.made != null) {
          if (row.made > max) max = row.made
          if (row.made < min) min = row.made
        }
      })
    }
    return (
      <div style={{ marginBottom: '2rem' }}>
        <h3>Made</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="match" label={{ value: "Match", position: "insideBottom", offset: -5 }} />
            <YAxis
              label={{ value: "Made", angle: -90, position: "insideLeft" }}
              allowDecimals={true}
              domain={[Math.min(0, min), Math.max(1, max)]}
            />
            <Tooltip />
            <Legend />
            {selectedTeams.map((team, i) => (
              <Line
                key={team}
                type="monotone"
                dataKey="made"
                name={`Team ${team}`}
                data={chartDataByTeam[team]}
                stroke={getColorForTeam(team, i)}
                dot
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Team Data</h1>

      <div style={{ marginBottom: '1rem' }}>
        <label>Select Teams:&nbsp;</label>
        <select
          multiple
          size={Math.min(allTeams.length, 8)}
          value={selectedTeams}
          onChange={e => {
            const options = Array.from(e.target.selectedOptions).map(opt => opt.value)
            setSelectedTeams(options)
          }}
          style={{ minWidth: 120 }}
        >
          {allTeams.map(team => (
            <option key={team} value={String(team)}>{team}</option>
          ))}
        </select>
        <span style={{ marginLeft: '0.5rem', fontSize: '0.9em', color: '#666' }}>
          (Hold Ctrl/Cmd to multi-select)
        </span>
      </div>

      {/* Summary table */}
      <div style={{ marginTop: '2rem' }}>
        <h2>Summary</h2>
        {Object.keys(summary).length === 0 ? (
          <p>No data to summarize.</p>
        ) : (
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
            {selectedTeams.map(team => (
              summary[team] ? (
                <div key={team}>
                  <h3>Team {team}</h3>
                  <table border="1" cellPadding="6" style={{ borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th>Field</th>
                        <th>Avg Attempts</th>
                        <th>Success %</th>
                        <th>Avg Made</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fieldsToShow.map(field =>
                        summary[team][field] ? (
                          <tr key={field}>
                            <td>{field}</td>
                            {summary[team][field].type === 'scoring' ? (
                              <>
                                <td>{summary[team][field].avgAttempts?.toFixed(2)}</td>
                                <td>{summary[team][field].successRate}%</td>
                                <td>{summary[team][field].average}</td>
                              </>
                            ) : (
                              <td colSpan={3}>
                                {summary[team][field].type === 'number'
                                  ? `Average: ${summary[team][field].value}`
                                  : `Mode: ${summary[team][field].value} (${summary[team][field].percent}%)`}
                              </td>
                            )}
                          </tr>
                        ) : null
                      )}
                    </tbody>
                  </table>
                </div>
              ) : null
            ))}
          </div>
        )}
      </div>

      <div style={{ marginTop: '2rem' }}>
        <label htmlFor="stat-select">Select Stat:&nbsp;</label>
        <select
          id="stat-select"
          value={selectedStat}
          onChange={e => setSelectedStat(e.target.value)}
        >
          <option value="">Select a stat...</option>
          {fieldsToShow.map(field => (
            <option key={field} value={field}>{field}</option>
          ))}
        </select>
      </div>
      <div style={{ marginTop: '1rem' }}>
        <h2>Charts for {selectedStat}</h2>
        {(() => {
          if (!matchRows || matchRows.length === 0) return <p>No data for chart.</p>;
          if (!selectedStat) return <p>Select a stat to view charts.</p>;
          
          const firstTeamSummary = Object.values(summary)[0];
          const selectedSummary = firstTeamSummary && firstTeamSummary[selectedStat];
          
          if (!selectedSummary || selectedSummary.type !== 'scoring') {
            return <p>Charts only available for scoring-type fields.</p>;
          }
          
          const chartDataByTeam = buildStatChartData(matchRows, selectedStat);
          const hasAny = selectedTeams.some(team =>
            (chartDataByTeam[team] || []).some(row => row.attempts !== null || row.successRate !== null || row.made !== null)
          );
          if (!hasAny) return <p>No numeric data for field "{selectedStat}".</p>;
          return (
            <>
              <AttemptsChart chartDataByTeam={chartDataByTeam} selectedTeams={selectedTeams} />
              <SuccessRateChart chartDataByTeam={chartDataByTeam} selectedTeams={selectedTeams} />
              <MadeChart chartDataByTeam={chartDataByTeam} selectedTeams={selectedTeams} />
            </>
          );
        })()}
      </div>
    </div>
  )
}

export default Compare