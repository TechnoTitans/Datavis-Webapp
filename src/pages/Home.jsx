// src/pages/Home.jsx
import { useNavigate } from 'react-router-dom'

function Home() {
  const navigate = useNavigate()

  return (
    <div className="button-wrapper">
      <h1>1683 Visualizer</h1>
      <button onClick={() => navigate('/team-data')}>Team Data</button>
      <button>Notes</button>
      <button>Analytics</button>
    </div>
  )
}

export default Home