import './App.css'
import { useState } from 'react'

function App() {
  const [teamNumber, setTeamNumber] = useState('')
  const [notes, setNotes] = useState('')

  const handleSaveNotes = () => {
    console.log(`Save notes for team ${teamNumber}:`, notes)
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1>1683 Visualizer</h1>

      <div className="button-wrapper">
        <button className="team data">Team Data</button>
        <button>Button 2</button>
        <button>Button 3</button>
        <button>Button 4</button>
      </div>

      <div>
        <h1>Welcome</h1>
      </div>

      <div>
        <label>Team Number:</label>
        <input
          type="text"
          value={teamNumber}
          onChange={e => setTeamNumber(e.target.value)}
        />
      </div>

      <div style={{ marginTop: '1rem' }}>
        <label>Notes:</label>
        <br />
        <textarea
          rows="6"
          cols="50"
          value={notes}
          onChange={e => setNotes(e.target.value)}
        />
      </div>

      <button style={{ marginTop: '1rem' }} onClick={handleSaveNotes}>
        Save Notes
      </button>
    </div>
  )
}

export default App