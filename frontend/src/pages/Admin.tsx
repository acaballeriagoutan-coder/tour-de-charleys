import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const API = 'http://localhost:8000'

interface Ciclista {
  id: string
  nom: string
  cognoms: string
  email: string
  telefon: string
  numero_dorsal: number | null
  created_at: string
}

export default function Admin() {
  const navigate = useNavigate()
  const [ciclistes, setCiclistes] = useState<Ciclista[]>([])
  const [carregant, setCarregant] = useState(true)
  const [assignant, setAssignant] = useState(false)

  async function carregarCiclistes() {
    setCarregant(true)
    const res = await axios.get(`${API}/ciclistes`)
    setCiclistes(res.data)
    setCarregant(false)
  }

  async function assignarDorsals() {
    setAssignant(true)
    await axios.post(`${API}/ciclistes/assignar-dorsals`)
    await carregarCiclistes()
    setAssignant(false)
  }

  useEffect(() => { carregarCiclistes() }, [])

  const senseDorsal = ciclistes.filter(c => c.numero_dorsal === null).length

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Panell d'Administració</h1>
          <p className="text-sm text-gray-400">Tour de Charleys</p>
        </div>
        <button
          onClick={() => navigate('/admin/dorsals')}
          className="bg-orange-500 hover:bg-orange-400 text-white font-semibold px-4 py-2 rounded-lg text-sm transition"
        >
          Imprimir dorsals →
        </button>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-10">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-900 rounded-xl p-5 text-center">
            <p className="text-3xl font-black text-orange-400">{ciclistes.length}</p>
            <p className="text-sm text-gray-400 mt-1">Total inscrits</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-5 text-center">
            <p className="text-3xl font-black text-green-400">{ciclistes.length - senseDorsal}</p>
            <p className="text-sm text-gray-400 mt-1">Amb dorsal</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-5 text-center">
            <p className="text-3xl font-black text-yellow-400">{senseDorsal}</p>
            <p className="text-sm text-gray-400 mt-1">Sense dorsal</p>
          </div>
        </div>

        {/* Acció assignar */}
        {senseDorsal > 0 && (
          <div className="bg-yellow-900/30 border border-yellow-700 rounded-xl p-4 mb-6 flex items-center justify-between">
            <p className="text-yellow-300 text-sm">
              Hi ha <strong>{senseDorsal}</strong> ciclista{senseDorsal !== 1 ? 'es' : ''} sense dorsal assignat.
            </p>
            <button
              onClick={assignarDorsals}
              disabled={assignant}
              className="bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 text-black font-bold px-4 py-2 rounded-lg text-sm transition"
            >
              {assignant ? 'Assignant...' : 'Assignar dorsals'}
            </button>
          </div>
        )}

        {/* Taula */}
        {carregant ? (
          <p className="text-center text-gray-500 py-20">Carregant...</p>
        ) : (
          <div className="bg-gray-900 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-800 text-gray-400 uppercase text-xs tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left">Dorsal</th>
                  <th className="px-4 py-3 text-left">Nom</th>
                  <th className="px-4 py-3 text-left">Cognoms</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Telèfon</th>
                  <th className="px-4 py-3 text-left">Data inscripció</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {ciclistes.map(c => (
                  <tr key={c.id} className="hover:bg-gray-800/50 transition">
                    <td className="px-4 py-3">
                      {c.numero_dorsal !== null
                        ? <span className="bg-orange-500 text-white font-bold px-2 py-0.5 rounded text-xs">{c.numero_dorsal}</span>
                        : <span className="text-gray-600">—</span>
                      }
                    </td>
                    <td className="px-4 py-3 font-medium">{c.nom}</td>
                    <td className="px-4 py-3 text-gray-300">{c.cognoms}</td>
                    <td className="px-4 py-3 text-gray-400">{c.email}</td>
                    <td className="px-4 py-3 text-gray-400">{c.telefon}</td>
                    <td className="px-4 py-3 text-gray-500">{new Date(c.created_at).toLocaleDateString('ca-ES')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {ciclistes.length === 0 && (
              <p className="text-center text-gray-600 py-12">Encara no hi ha inscripcions.</p>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
