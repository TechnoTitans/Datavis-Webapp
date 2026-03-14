import { useState } from 'react'
import TeamSelector from '../components/TeamSelector'
import Loading from '../components/Loading'
import { useTeamData } from '../hooks/useTeamData'
import { useSelectedTeams } from '../hooks/useLocalStorage'
import MultiSelect from '../components/MultiSelect'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

function TeamAnalysis() {
  const [selectedTeams, setSelectedTeams] = useSelectedTeams('selectedTeamsAnalysis', [])
  const safeSelectedTeams = Array.isArray(selectedTeams) ? selectedTeams : []
  
  // Pass dummy team value to ensure data fetches, then filter
  const dummyTeams = safeSelectedTeams.length > 0 ? safeSelectedTeams : ['0']
  const { allTeams, matchRows: allMatchRows, loading } = useTeamData(dummyTeams, true)
  
  const matchRows = safeSelectedTeams.length > 0 
    ? allMatchRows.filter(row => safeSelectedTeams.includes(String(row['Team Number'])))
    : allMatchRows

  const handleTeamToggle = (team) => {
    if (safeSelectedTeams.includes(team)) {
      setSelectedTeams([])
    } else {
      setSelectedTeams([team])
    }
  }

  const clearAllTeams = () => {
    setSelectedTeams([])
  }

  const renderHeatMap = () => {
    if (!safeSelectedTeams.length) {
      return null
    }

    const frequencyMap = {}
    matchRows.forEach(row => {
      const shotCoordinates = row['Shot Coordinates']
      if (shotCoordinates) {
        const coordinates = shotCoordinates.split(';').filter(coord => coord.trim() !== '')
        coordinates.forEach(coord => {
          if (!frequencyMap[coord]) {
            frequencyMap[coord] = 0
          }
          frequencyMap[coord] += 1
        })
      }
    })

    console.log('Frequency Map:', frequencyMap)

    if (Object.keys(frequencyMap).length === 0) {
      return null
    }

    const maxFrequency = Math.max(...Object.values(frequencyMap))
    console.log('Max Frequency:', maxFrequency)

    const circles = Object.entries(frequencyMap).map(([coord, freq]) => {
      const [x, y] = coord.split(',').map(Number)
      const normalizedFreq = freq / maxFrequency
      const radius = 15 + normalizedFreq * 35
      const opacity = 0.3 + normalizedFreq * 0.7
      const color = `rgba(0, 255, 0, ${opacity})`

      return (
        <circle
          key={coord}
          cx={x * 100}
          cy={y * 100}
          r={radius}
          fill={color}
        />
      )
    })

    return circles
  }

  return (
    <div>
      <div style={{ marginBottom: '16px', textAlign: 'center' }}>
      </div>
      <div className="auto-paths-container">
        <h1>Scoring Locations</h1>

        <TeamSelector
          allTeams={allTeams || []}
          selectedTeams={safeSelectedTeams}
          onTeamToggle={handleTeamToggle}
          onClearAll={clearAllTeams}
          title="Select Team"
        />

        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '600px' }}>
          <div style={{ position: 'relative', width: '800px', height: '750px' }}>
            <img src="src/assets/rebuiltauton.png" alt="Background" style={{ width: '100%', height: '100%' }} />
            <svg
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
              viewBox="0 0 800 600"
            >
              {renderHeatMap()}
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TeamAnalysis
