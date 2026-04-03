import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_URL } from '../lib/api'
import axios from 'axios'

export default function Login() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [carregant, setCarregant] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setCarregant(true)
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { username, password })
      localStorage.setItem('admin_token', res.data.access_token)
      navigate('/admin')
    } catch {
      setError('Usuari o contrasenya incorrectes')
    } finally {
      setCarregant(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        <div className="text-center mb-8">
          <h1 className="text-2xl font-black text-white uppercase tracking-widest">Le Tour de Charley's</h1>
          <p className="text-gray-500 text-sm mt-1">Accés d'administrador</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-gray-900 rounded-2xl p-8 flex flex-col gap-5 border border-gray-800">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-400 uppercase tracking-wider">Usuari</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoComplete="username"
              autoFocus
              required
              className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-400 transition"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-gray-400 uppercase tracking-wider">Contrasenya</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-400 transition"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={carregant}
            className="bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-black font-black py-3 rounded-lg transition mt-1"
          >
            {carregant ? 'Entrant...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
