import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import Home from './pages/Home'
import Login from './pages/Login'
import Admin from './pages/Admin'
import Dorsals from './pages/Dorsals'
import Cronometratge from './pages/Cronometratge'
import FullTemps from './pages/FullTemps'
import ProtectedRoute from './components/ProtectedRoute'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin/login" element={<Login />} />
        <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
        <Route path="/admin/dorsals" element={<ProtectedRoute><Dorsals /></ProtectedRoute>} />
        <Route path="/admin/cronometratge" element={<ProtectedRoute><Cronometratge /></ProtectedRoute>} />
        <Route path="/admin/full-temps" element={<ProtectedRoute><FullTemps /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
