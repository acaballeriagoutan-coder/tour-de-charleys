import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import Home from './pages/Home'
import Admin from './pages/Admin'
import Dorsals from './pages/Dorsals'
import Cronometratge from './pages/Cronometratge'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/admin/dorsals" element={<Dorsals />} />
        <Route path="/admin/cronometratge" element={<Cronometratge />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
