// App.jsx
import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './pages/TopBar' // previously Home, now acts as layout
import TeamData from './pages/TeamData'
import Compare from './pages/Compare'

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<TeamData />} />
          <Route path="team-data" element={<TeamData />} />
          <Route path="compare" element={<Compare />} />
          {/* Add more routes here as needed */}
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}

export default App