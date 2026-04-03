import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'

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
  foto_url: string | null
  created_at: string
}

function Badge({ ok, labelOk, labelNo }: { ok: boolean; labelOk: string; labelNo: string }) {
  return ok
    ? <span className="bg-green-900/50 text-green-400 text-xs px-2 py-0.5 rounded">{labelOk}</span>
    : <span className="bg-red-900/50 text-red-400 text-xs px-2 py-0.5 rounded">{labelNo}</span>
}

function Drawer({ ciclista, onClose }: { ciclista: Ciclista; onClose: () => void }) {
  const edat = ciclista.data_naixement
    ? Math.floor((Date.now() - new Date(ciclista.data_naixement).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
    : null

  return (
    <>
      {/* Fons fosc */}
      <div className="fixed inset-0 bg-black/60 z-40" onClick={onClose} />

      {/* Panell lateral */}
      <div className="fixed top-0 right-0 h-full w-full max-w-sm bg-gray-900 border-l border-gray-800 z-50 flex flex-col shadow-2xl">

        {/* Capçalera */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-gray-800">
          <div className="flex items-center gap-3">
            {ciclista.foto_url
              ? <img src={ciclista.foto_url} alt={ciclista.nom} className="w-12 h-12 rounded-full object-cover ring-2 ring-yellow-400" />
              : <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center text-xl text-gray-500">👤</div>
            }
            <div>
              <p className="font-bold text-white">{ciclista.nom} {ciclista.cognoms}</p>
              <p className="text-xs text-gray-500">{ciclista.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl transition mt-0.5">✕</button>
        </div>

        {/* Contingut */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-6 text-sm">

          {/* Dorsal */}
          {ciclista.numero_dorsal !== null && (
            <div className="flex items-center gap-2">
              <span className="bg-yellow-400 text-black font-black px-3 py-1 rounded text-lg">{ciclista.numero_dorsal}</span>
              <span className="text-gray-400 text-xs">Dorsal assignat</span>
            </div>
          )}

          {/* Dades personals */}
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">Dades personals</p>
            <div className="flex flex-col gap-2">
              <Row label="DNI" valor={ciclista.dni} />
              <Row label="Data de naixement" valor={ciclista.data_naixement ? `${new Date(ciclista.data_naixement).toLocaleDateString('ca-ES')}${edat ? ` (${edat} anys)` : ''}` : null} />
              <Row label="Gènere" valor={ciclista.genere} />
              <Row label="Telèfon" valor={ciclista.telefon} />
            </div>
          </div>

          {/* Contacte emergència */}
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">Contacte d'emergència</p>
            <div className="flex flex-col gap-2">
              <Row label="Nom" valor={ciclista.contacte_emergencia_nom} />
              <Row label="Telèfon" valor={ciclista.contacte_emergencia_telefon} />
            </div>
          </div>

          {/* Assegurança */}
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">Assegurança</p>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Assegurança pròpia</span>
                <Badge ok={ciclista.te_asseguranca} labelOk="Sí" labelNo="No" />
              </div>
              {!ciclista.te_asseguranca && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Assegurança organització</span>
                  <span className="bg-orange-900/50 text-orange-400 text-xs px-2 py-0.5 rounded">Pendent de pagament</span>
                </div>
              )}
              {ciclista.numero_llicencia && (
                <Row label="Llicència federativa" valor={ciclista.numero_llicencia} />
              )}
            </div>
          </div>

          {/* Data inscripció */}
          <div className="pt-2 border-t border-gray-800">
            <p className="text-xs text-gray-600">Inscrit el {new Date(ciclista.created_at).toLocaleDateString('ca-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
        </div>
      </div>
    </>
  )
}

function Row({ label, valor }: { label: string; valor: string | null | undefined }) {
  return (
    <div className="flex justify-between items-center gap-4">
      <span className="text-gray-400 shrink-0">{label}</span>
      <span className="text-white text-right">{valor || <span className="text-gray-600">—</span>}</span>
    </div>
  )
}

export default function Admin() {
  const navigate = useNavigate()
  const [ciclistes, setCiclistes] = useState<Ciclista[]>([])
  const [carregant, setCarregant] = useState(true)
  const [seleccionat, setSeleccionat] = useState<Ciclista | null>(null)

  async function carregarCiclistes() {
    setCarregant(true)
    const res = await api.get('/ciclistes')
    setCiclistes(res.data)
    setCarregant(false)
  }

  useEffect(() => { carregarCiclistes() }, [])

  const ambAsseguranca = ciclistes.filter(c => c.te_asseguranca).length
  const volAsseguranca = ciclistes.filter(c => c.vol_asseguranca === true).length

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Panell d'Administració</h1>
          <p className="text-sm text-gray-400">Le Tour de Charley's · 2026</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => navigate('/admin/cronometratge')}
            className="bg-gray-700 hover:bg-gray-600 text-white font-bold px-4 py-2 rounded-lg text-sm transition">
            Cronometratge
          </button>
          <button onClick={() => navigate('/admin/dorsals')}
            className="bg-yellow-400 hover:bg-yellow-300 text-black font-bold px-4 py-2 rounded-lg text-sm transition">
            Imprimir dorsals →
          </button>
          <button onClick={() => { localStorage.removeItem('admin_token'); navigate('/admin/login') }}
            className="bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white font-bold px-4 py-2 rounded-lg text-sm transition">
            Sortir
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-10">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Total inscrits', valor: ciclistes.length, color: 'text-yellow-400' },
            { label: 'Amb assegurança pròpia', valor: ambAsseguranca, color: 'text-blue-400' },
            { label: 'Volen assegurança nostra', valor: volAsseguranca, color: 'text-orange-400' },
          ].map(({ label, valor, color }) => (
            <div key={label} className="bg-gray-900 rounded-xl p-4 text-center">
              <p className={`text-3xl font-black ${color}`}>{valor}</p>
              <p className="text-xs text-gray-400 mt-1">{label}</p>
            </div>
          ))}
        </div>

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
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {ciclistes.map(c => {
                  const edat = c.data_naixement
                    ? Math.floor((Date.now() - new Date(c.data_naixement).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
                    : null

                  return (
                    <tr key={c.id}
                      onClick={() => setSeleccionat(c)}
                      className="hover:bg-gray-800/60 cursor-pointer transition">
                      <td className="px-4 py-3">
                        {c.numero_dorsal !== null
                          ? <span className="bg-yellow-400 text-black font-black px-2 py-0.5 rounded text-xs">{c.numero_dorsal}</span>
                          : <span className="text-gray-600">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {c.foto_url
                            ? <img src={c.foto_url} alt={c.nom} className="w-7 h-7 rounded-full object-cover ring-1 ring-yellow-400/50 shrink-0" />
                            : <div className="w-7 h-7 rounded-full bg-gray-800 shrink-0" />
                          }
                          <div>
                            <p className="font-bold">{c.nom} {c.cognoms}</p>
                            <p className="text-xs text-gray-500">{c.email}</p>
                          </div>
                        </div>
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
                    </tr>
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

      {/* Drawer */}
      {seleccionat && <Drawer ciclista={seleccionat} onClose={() => setSeleccionat(null)} />}
    </div>
  )
}
