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
  dni: string
  data_naixement: string
  genere: string
  contacte_emergencia_nom: string
  contacte_emergencia_telefon: string
  te_asseguranca: boolean
  vol_asseguranca: boolean | null
  numero_llicencia: string | null
  accepta_reglament: boolean
  cessio_imatge: boolean
  numero_dorsal: number | null
  created_at: string
}

function Badge({ ok, labelOk, labelNo }: { ok: boolean; labelOk: string; labelNo: string }) {
  return ok
    ? <span className="bg-green-900/50 text-green-400 text-xs px-2 py-0.5 rounded">{labelOk}</span>
    : <span className="bg-red-900/50 text-red-400 text-xs px-2 py-0.5 rounded">{labelNo}</span>
}

export default function Admin() {
  const navigate = useNavigate()
  const [ciclistes, setCiclistes] = useState<Ciclista[]>([])
  const [carregant, setCarregant] = useState(true)
  const [assignant, setAssignant] = useState(false)
  const [expandit, setExpandit] = useState<string | null>(null)

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
  const ambAsseguranca = ciclistes.filter(c => c.te_asseguranca).length
  const volAsseguranca = ciclistes.filter(c => c.vol_asseguranca === true).length

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Panell d'Administració</h1>
          <p className="text-sm text-gray-400">Le Tour de Charley's · 2026</p>
        </div>
        <button onClick={() => navigate('/admin/dorsals')}
          className="bg-yellow-400 hover:bg-yellow-300 text-black font-bold px-4 py-2 rounded-lg text-sm transition">
          Imprimir dorsals →
        </button>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-10">

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {[
            { label: 'Total inscrits', valor: ciclistes.length, color: 'text-yellow-400' },
            { label: 'Amb dorsal', valor: ciclistes.length - senseDorsal, color: 'text-green-400' },
            { label: 'Sense dorsal', valor: senseDorsal, color: 'text-zinc-400' },
            { label: 'Amb assegurança', valor: ambAsseguranca, color: 'text-blue-400' },
            { label: 'Volen assegurança', valor: volAsseguranca, color: 'text-orange-400' },
          ].map(({ label, valor, color }) => (
            <div key={label} className="bg-gray-900 rounded-xl p-4 text-center">
              <p className={`text-3xl font-black ${color}`}>{valor}</p>
              <p className="text-xs text-gray-400 mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Assignar dorsals */}
        {senseDorsal > 0 && (
          <div className="bg-yellow-900/30 border border-yellow-700 rounded-xl p-4 mb-6 flex items-center justify-between">
            <p className="text-yellow-300 text-sm">
              Hi ha <strong>{senseDorsal}</strong> ciclista{senseDorsal !== 1 ? 'es' : ''} sense dorsal assignat.
            </p>
            <button onClick={assignarDorsals} disabled={assignant}
              className="bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-black font-bold px-4 py-2 rounded-lg text-sm transition">
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
                  <th className="px-4 py-3 text-left">Nom i Cognoms</th>
                  <th className="px-4 py-3 text-left">DNI</th>
                  <th className="px-4 py-3 text-left">Edat</th>
                  <th className="px-4 py-3 text-left">Gènere</th>
                  <th className="px-4 py-3 text-left">Assegurança</th>
                  <th className="px-4 py-3 text-left">Llicència</th>
                  <th className="px-4 py-3 text-left">Inscripció</th>
                  <th className="px-4 py-3 text-left"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {ciclistes.map(c => {
                  const edat = c.data_naixement
                    ? Math.floor((Date.now() - new Date(c.data_naixement).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
                    : null

                  return (
                    <>
                      <tr key={c.id} className="hover:bg-gray-800/50 transition">
                        <td className="px-4 py-3">
                          {c.numero_dorsal !== null
                            ? <span className="bg-yellow-400 text-black font-black px-2 py-0.5 rounded text-xs">{c.numero_dorsal}</span>
                            : <span className="text-gray-600">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-bold">{c.nom} {c.cognoms}</p>
                          <p className="text-xs text-gray-500">{c.email}</p>
                        </td>
                        <td className="px-4 py-3 text-gray-300 font-mono text-xs">{c.dni || '—'}</td>
                        <td className="px-4 py-3 text-gray-300">{edat ? `${edat} anys` : '—'}</td>
                        <td className="px-4 py-3 text-gray-400 text-xs">{c.genere || '—'}</td>
                        <td className="px-4 py-3">
                          {c.te_asseguranca
                            ? <Badge ok labelOk="Pròpia" labelNo="" />
                            : c.vol_asseguranca
                              ? <span className="bg-orange-900/50 text-orange-400 text-xs px-2 py-0.5 rounded">Vol la nostra</span>
                              : <span className="bg-gray-800 text-gray-500 text-xs px-2 py-0.5 rounded">Sense</span>
                          }
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{c.numero_llicencia || '—'}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{new Date(c.created_at).toLocaleDateString('ca-ES')}</td>
                        <td className="px-4 py-3">
                          <button onClick={() => setExpandit(expandit === c.id ? null : c.id)}
                            className="text-xs text-gray-500 hover:text-white transition">
                            {expandit === c.id ? '▲' : '▼'}
                          </button>
                        </td>
                      </tr>

                      {/* Fila expandida */}
                      {expandit === c.id && (
                        <tr key={`${c.id}-detail`} className="bg-gray-800/30">
                          <td colSpan={9} className="px-6 py-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                              <div>
                                <p className="text-gray-500 uppercase tracking-wider mb-1">Telèfon</p>
                                <p className="text-white">{c.telefon}</p>
                              </div>
                              <div>
                                <p className="text-gray-500 uppercase tracking-wider mb-1">Contacte emergència</p>
                                <p className="text-white">{c.contacte_emergencia_nom}</p>
                                <p className="text-gray-400">{c.contacte_emergencia_telefon}</p>
                              </div>
                              <div>
                                <p className="text-gray-500 uppercase tracking-wider mb-1">Cessió d'imatge</p>
                                <Badge ok={c.cessio_imatge} labelOk="Autoritzada" labelNo="No autoritzada" />
                              </div>
                              <div>
                                <p className="text-gray-500 uppercase tracking-wider mb-1">Reglament</p>
                                <Badge ok={c.accepta_reglament} labelOk="Acceptat" labelNo="No acceptat" />
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  )
                })}
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
