// src/pages/TopBar.jsx
import { useNavigate } from 'react-router-dom'

function Layout({ children }) {
  const navigate = useNavigate()

  return (
    <div>
      <div className="top-bar" style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: '#f1f1f1' }}>
        <h1>1683 Visualizer</h1>
        <div className="button-wrapper">
          <button onClick={() => navigate('/team-data')}>Team Data</button>
          <button onClick={() => navigate('/compare')}>Compare</button>
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