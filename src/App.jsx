// App.jsx
import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './pages/TopBar' // previously Home, now acts as layout
import TeamData from './pages/TeamData'
import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

function App() {
  const [instruments, setInstruments] = useState([]);
  useEffect(() => {
    getInstruments();
  }, []);
  async function getInstruments() {
  const { data } = await supabase.from("instruments").select();
  setInstruments(data);
  }
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<TeamData />} />
          <Route path="team-data" element={<TeamData />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App