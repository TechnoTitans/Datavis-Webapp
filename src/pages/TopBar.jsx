// src/pages/TopBar.jsx
import { useNavigate } from 'react-router-dom'
import '../styles/topbar.css'

function Layout({ children }) {
  const navigate = useNavigate()

  return (
    <div>
      <div className="top-bar">
        <h1>Data Vis</h1>
        <div className="button-wrapper">
          <button onClick={() => navigate('/team-data')}>Team Data</button>
          <button onClick={() => navigate('/compare')}>Compare</button>
          <button onClick={() => navigate('/team-analysis')}>Team Analysis</button>
          <button onClick={() => navigate('/auto-paths')}>Auto Paths</button>
          <button onClick={() => navigate('/match-strategy')}>Match Strategy</button>
          <button onClick={() => navigate('/rankings')}>Rankings</button>
          <button onClick={() => navigate('/picklist')}>Picklist</button>
          <button onClick={() => navigate('/upload')}>Upload</button>
          <button onClick={() => navigate('/settings')}>Settings</button>
        </div>
      </div>

      <div style={{ padding: '2rem' }}>
        {children}
      </div>
    </div>
  )
}

export default Layout