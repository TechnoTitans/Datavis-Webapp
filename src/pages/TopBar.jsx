// src/pages/Home.jsx
import { useNavigate, Outlet } from 'react-router-dom'

function Layout() {
  const navigate = useNavigate()

  return (
    <div>
      <div className="top-bar">
        <h1>1683 Visualizer</h1>
        <div className="button-wrapper">
          <button onClick={() => navigate('/team-data')}>Team Data</button>
          <button onClick={() => navigate('/compare')}>Compare</button>
          <button onClick={() => navigate('/upload')}>Upload</button>
        </div>
      </div>
      <Outlet />
    </div>
  )
}

export default Layout