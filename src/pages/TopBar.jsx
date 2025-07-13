// src/pages/TopBar.jsx
import { useNavigate } from 'react-router-dom'

function Layout({ children }) {
  const navigate = useNavigate()

  return (
    <div>
      <div className="top-bar">
        <h1>Data Vis</h1>
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