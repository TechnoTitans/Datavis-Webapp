import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

function TeamData() {

  //useState() returns things: the team number and the function used to change it
  const [teamNumber, setTeamNumber] = useState('254') // default selection
  const [notes, setNotes] = useState('')
  const [matchRows, setMatchRows] = useState([])
  const [loading, setLoading] = useState(false)

const fetchMatches = async () => {
  if (!teamNumber) {
    setMatchRows([])
    return
  }

  setLoading(true)

  const { data, error } = await supabase
    .from('match_data')
    .select('*')
    .eq('Team Number', Number(teamNumber))
    .order('Scouting ID', { ascending: false })

  if (error) {
    console.error('Error fetching match data:', error)
    alert('Failed to load match data.')
  } else {
    setMatchRows(data)
  }

  setLoading(false)
}

  // call useEffect() whenever teamNumber changes
  useEffect(() => {
    fetchMatches()
  }, [teamNumber])

  // todo
  const handleSaveNotes = () => {
    console.log(`Save notes for team ${teamNumber}:`, notes)
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Team Data</h1>


      <div style={{ marginBottom: '1rem' }}>
        <label>Select Team:&nbsp;</label>
        <select
          value={teamNumber}
          onChange={e => setTeamNumber(e.target.value)}
          style={{ fontSize: '16px', padding: '4px 8px' }}
        >
          <option value="254">254</option>
          <option value="1678">1678</option>
          <option value="1683">1683</option>
          <option value="1690">1690</option>
        </select>
      </div>

      // make new table with rows by team number. add saved stuff to it
      <div style={{ marginBottom: '1rem' }}>
        <label>Notes:</label><br />
        <textarea
          rows="4"
          cols="60"
          value={notes}
          onChange={e => setNotes(e.target.value)}
        />
      </div>

      <button onClick={handleSaveNotes}>Save Notes</button>


      <div style={{ marginTop: '2rem' }}>
        <h2>Matches for Team {teamNumber}</h2>
        {loading ? (
          <p>Loading…</p>
        ) : matchRows.length === 0 ? (
          <p>No matches found.</p>
        ) : (
          <table border="1" cellPadding="6" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th>Scouting ID</th>
                <th>L4 Count</th>
                <th>Comments</th>
              </tr>
            </thead>
            <tbody>
              {matchRows.map(row => (
                <tr key={row.id ?? `${row.team_number}-${row.match_number}`}> // use team number dash match number in case of null
                  <td>{row["Scouting ID"]}</td>
                  <td>{row["L4 Count"]}</td>
                  <td>{row.Notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default TeamData