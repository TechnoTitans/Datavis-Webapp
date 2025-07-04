// App.jsx
import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import TeamData from './pages/TeamData'
import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient' // adjust path if needed

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
        <Route path="/" element={<Home />} />
        <Route path="/team-data" element={<TeamData />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App