import BaseLineChart from './BaseLineChart'

// Helper functions for chart data validation and domain calculation
const hasDataForKey = (chartDataByTeam, selectedTeams, dataKey) => {
  return selectedTeams.some(team => 
    (chartDataByTeam[team] || []).some(row => row[dataKey] !== null)
  )
}

const getMinMaxDomain = (chartDataByTeam, selectedTeams, dataKey) => {
  let max = 1, min = 0
  for (const team of selectedTeams) {
    const arr = chartDataByTeam[team] || []
    arr.forEach(row => {
      if (row[dataKey] != null) {
        if (row[dataKey] > max) max = row[dataKey]
        if (row[dataKey] < min) min = row[dataKey]
      }
    })
  }
  return [Math.min(0, min), Math.max(1, max)]
}

/**
 * Attempts chart component
 */
export const AttemptsChart = ({ chartDataByTeam, selectedTeams }) => (
  <BaseLineChart
    chartDataByTeam={chartDataByTeam}
    selectedTeams={selectedTeams}
    dataKey="attempts"
    title="Attempts"
    hasDataCheck={hasDataForKey}
    getYDomain={getMinMaxDomain}
  />
)

/**
 * Success rate chart component
 */
export const SuccessRateChart = ({ chartDataByTeam, selectedTeams }) => (
  <BaseLineChart
    chartDataByTeam={chartDataByTeam}
    selectedTeams={selectedTeams}
    dataKey="successRate"
    title="Success %"
    hasDataCheck={hasDataForKey}
    getYDomain={() => [0, 100]}
    noDataMessage="No Success % data for this field."
  />
)

/**
 * Made chart component
 */
export const MadeChart = ({ chartDataByTeam, selectedTeams }) => (
  <BaseLineChart
    chartDataByTeam={chartDataByTeam}
    selectedTeams={selectedTeams}
    dataKey="made"
    title="Made"
    hasDataCheck={hasDataForKey}
    getYDomain={getMinMaxDomain}
    noDataMessage="No Made data for this field."
  />
)
