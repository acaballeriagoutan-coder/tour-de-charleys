import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import * as XLSX from 'xlsx'

const API = 'http://localhost:8000'
const ETAPES = [1, 2, 3]

interface Ciclista {
  id: string
  nom: string
  cognoms: string
  numero_dorsal: number
  genere: string
}

interface Registre {
  dorsal: number
  nom: string
  cognoms: string
  temps: string // HH:MM:SS
  timestamp: number
}

type Temps = Record<number, Record<number, Registre>> // etapa -> dorsal -> registre

export default function Cronometratge() {
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const [ciclistes, setCiclistes] = useState<Ciclista[]>([])
  const [etapa, setEtapa] = useState(1)
  const [dorsalInput, setDorsalInput] = useState('')
  const [temps, setTemps] = useState<Temps>(() => {
    const saved = localStorage.getItem('cronometratge')
    return saved ? JSON.parse(saved) : {}
  })
  const [ultim, setUltim] = useState<Registre | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    axios.get(`${API}/ciclistes`).then(res => setCiclistes(res.data))
  }, [])

  useEffect(() => {
    localStorage.setItem('cronometratge', JSON.stringify(temps))
  }, [temps])

  useEffect(() => {
    inputRef.current?.focus()
  }, [etapa])

  function ara(): string {
    const d = new Date()
    return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`
  }

  function registrarDorsal() {
    const dorsal = parseInt(dorsalInput.trim())
    if (isNaN(dorsal)) { setError('Dorsal no vàlid'); return }

    const ciclista = ciclistes.find(c => c.numero_dorsal === dorsal)
    if (!ciclista) { setError(`Dorsal ${dorsal} no trobat`); setDorsalInput(''); return }

    if (temps[etapa]?.[dorsal]) { setError(`Dorsal ${dorsal} ja registrat en aquesta etapa`); setDorsalInput(''); return }

    const registre: Registre = {
      dorsal,
      nom: ciclista.nom,
      cognoms: ciclista.cognoms,
      temps: ara(),
      timestamp: Date.now(),
    }

    setTemps(prev => ({
      ...prev,
      [etapa]: { ...(prev[etapa] || {}), [dorsal]: registre }
    }))
    setUltim(registre)
    setError('')
    setDorsalInput('')
    inputRef.current?.focus()
  }

  function eliminarRegistre(etapaNum: number, dorsal: number) {
    setTemps(prev => {
      const nova = { ...prev }
      const copiaEtapa = { ...nova[etapaNum] }
      delete copiaEtapa[dorsal]
      nova[etapaNum] = copiaEtapa
      return nova
    })
  }

  function resetEtapa() {
    if (!confirm(`Segur que vols esborrar tots els temps de l'Etapa ${etapa}?`)) return
    setTemps(prev => { const nova = { ...prev }; delete nova[etapa]; return nova })
  }

  // Registres de l'etapa actual ordenats per temps d'arribada
  const registresEtapa = Object.values(temps[etapa] || {}).sort((a, b) => a.timestamp - b.timestamp)

  // Càlcul d'intervals
  function interval(idx: number): string {
    if (idx === 0) return 'líder'
    const base = registresEtapa[0].timestamp
    const diff = registresEtapa[idx].timestamp - base
    const s = Math.floor(diff / 1000)
    const m = Math.floor(s / 60)
    const ss = s % 60
    return m > 0 ? `+${m}m ${ss}s` : `+${ss}s`
  }

  // Classificació general (suma de timestamps relatius per etapa)
  function classificacioGeneral() {
    const totals: Record<number, { nom: string; cognoms: string; etapes: number; totalMs: number }> = {}

    ETAPES.forEach(e => {
      const regs = Object.values(temps[e] || {})
      if (regs.length === 0) return
      const primer = Math.min(...regs.map(r => r.timestamp))
      regs.forEach(r => {
        const difMs = r.timestamp - primer
        if (!totals[r.dorsal]) totals[r.dorsal] = { nom: r.nom, cognoms: r.cognoms, etapes: 0, totalMs: 0 }
        totals[r.dorsal].etapes++
        totals[r.dorsal].totalMs += difMs
      })
    })

    return Object.entries(totals)
      .sort((a, b) => {
        if (b[1].etapes !== a[1].etapes) return b[1].etapes - a[1].etapes
        return a[1].totalMs - b[1].totalMs
      })
      .map(([dorsal, d]) => ({ dorsal: parseInt(dorsal), ...d }))
  }

  function exportarExcel() {
    const wb = XLSX.utils.book_new()

    // Full per etapa
    ETAPES.forEach(e => {
      const regs = Object.values(temps[e] || {}).sort((a, b) => a.timestamp - b.timestamp)
      if (regs.length === 0) return
      const primer = regs[0].timestamp
      const files = regs.map((r, i) => {
        const difMs = r.timestamp - primer
        const s = Math.floor(difMs / 1000)
        const m = Math.floor(s / 60)
        const ss = s % 60
        return {
          Posició: i + 1,
          Dorsal: r.dorsal,
          Nom: `${r.nom} ${r.cognoms}`,
          'Hora arribada': r.temps,
          Interval: i === 0 ? 'líder' : (m > 0 ? `+${m}m ${ss}s` : `+${ss}s`),
        }
      })
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(files), `Etapa ${e}`)
    })

    // Full classificació general
    const general = classificacioGeneral()
    if (general.length > 0) {
      const primerMs = general[0].totalMs
      const filesGen = general.map((g, i) => {
        const difMs = g.totalMs - primerMs
        const s = Math.floor(difMs / 1000)
        const m = Math.floor(s / 60)
        const ss = s % 60
        return {
          Posició: i + 1,
          Dorsal: g.dorsal,
          Nom: `${g.nom} ${g.cognoms}`,
          Etapes: g.etapes,
          'Interval acumulat': i === 0 ? 'líder' : (m > 0 ? `+${m}m ${ss}s` : `+${ss}s`),
        }
      })
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(filesGen), 'Classificació General')
    }

    XLSX.writeFile(wb, 'resultats-tour-de-charleys.xlsx')
  }

  const general = classificacioGeneral()
  const etapesAmbDades = ETAPES.filter(e => Object.keys(temps[e] || {}).length > 0)

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div>
          <button onClick={() => navigate('/admin')} className="text-gray-500 hover:text-white text-sm transition mb-1">← Tornar</button>
          <h1 className="text-xl font-bold">Cronometratge</h1>
        </div>
        <div className="flex gap-3">
          <button onClick={exportarExcel}
            className="bg-green-600 hover:bg-green-500 text-white font-bold px-4 py-2 rounded-lg text-sm transition">
            Exportar Excel
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 flex flex-col gap-8">

        {/* Selector d'etapa */}
        <div className="flex gap-3">
          {ETAPES.map(e => (
            <button key={e} onClick={() => { setEtapa(e); setError(''); setDorsalInput('') }}
              className={`px-6 py-3 rounded-xl font-black text-sm uppercase tracking-wider transition ${etapa === e ? 'bg-yellow-400 text-black' : 'bg-gray-900 text-gray-400 hover:bg-gray-800'}`}>
              Etapa {e}
              {temps[e] && Object.keys(temps[e]).length > 0 && (
                <span className="ml-2 text-xs font-normal opacity-70">({Object.keys(temps[e]).length})</span>
              )}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* INPUT DORSAL */}
          <div className="bg-gray-900 rounded-xl p-6 flex flex-col gap-4">
            <h2 className="font-bold uppercase tracking-wider text-yellow-400 text-sm">Etapa {etapa} — Entrada de dorsals</h2>

            <div className="flex gap-3">
              <input
                ref={inputRef}
                type="number"
                value={dorsalInput}
                onChange={e => { setDorsalInput(e.target.value); setError('') }}
                onKeyDown={e => e.key === 'Enter' && registrarDorsal()}
                placeholder="Dorsal..."
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-4 text-white text-3xl font-black focus:outline-none focus:border-yellow-400 transition text-center"
                autoFocus
              />
              <button onClick={registrarDorsal}
                className="bg-yellow-400 hover:bg-yellow-300 text-black font-black px-5 rounded-lg transition text-xl">
                ↵
              </button>
            </div>

            {error && <p className="text-red-400 text-sm text-center">{error}</p>}

            {ultim && (
              <div className="bg-green-900/40 border border-green-700 rounded-lg px-4 py-3 text-center">
                <p className="text-green-400 font-bold text-lg">{ultim.nom} {ultim.cognoms}</p>
                <p className="text-green-300 text-sm">Dorsal {ultim.dorsal} · {ultim.temps}</p>
              </div>
            )}

            <p className="text-xs text-gray-600 text-center">Escriu el dorsal i prem Enter</p>
          </div>

          {/* LLISTA ETAPA ACTUAL */}
          <div className="bg-gray-900 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
              <h2 className="font-bold text-sm uppercase tracking-wider">Resultats Etapa {etapa}</h2>
              {registresEtapa.length > 0 && (
                <button onClick={resetEtapa} className="text-xs text-red-500 hover:text-red-400 transition">Esborrar etapa</button>
              )}
            </div>
            <div className="overflow-y-auto max-h-80">
              {registresEtapa.length === 0 ? (
                <p className="text-center text-gray-600 py-10 text-sm">Encara no hi ha registres</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-800 text-gray-400 text-xs uppercase">
                    <tr>
                      <th className="px-3 py-2 text-left">#</th>
                      <th className="px-3 py-2 text-left">Dorsal</th>
                      <th className="px-3 py-2 text-left">Nom</th>
                      <th className="px-3 py-2 text-left">Hora</th>
                      <th className="px-3 py-2 text-left">Interval</th>
                      <th className="px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {registresEtapa.map((r, i) => (
                      <tr key={r.dorsal} className={i === 0 ? 'bg-yellow-400/10' : ''}>
                        <td className="px-3 py-2 font-black text-yellow-400">{i + 1}</td>
                        <td className="px-3 py-2">
                          <span className="bg-yellow-400 text-black font-black px-2 py-0.5 rounded text-xs">{r.dorsal}</span>
                        </td>
                        <td className="px-3 py-2 font-medium">{r.nom} {r.cognoms}</td>
                        <td className="px-3 py-2 font-mono text-gray-300 text-xs">{r.temps}</td>
                        <td className="px-3 py-2 text-xs text-gray-400">{interval(i)}</td>
                        <td className="px-3 py-2">
                          <button onClick={() => eliminarRegistre(etapa, r.dorsal)}
                            className="text-gray-600 hover:text-red-400 text-xs transition">✕</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* CLASSIFICACIÓ GENERAL */}
        {etapesAmbDades.length > 0 && (
          <div className="bg-gray-900 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-800">
              <h2 className="font-bold text-sm uppercase tracking-wider">
                Classificació General
                <span className="ml-2 text-xs text-gray-500 font-normal">
                  ({etapesAmbDades.length === 3 ? 'final' : `${etapesAmbDades.length}/3 etapes`})
                </span>
              </h2>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-800 text-gray-400 text-xs uppercase">
                <tr>
                  <th className="px-4 py-2 text-left">#</th>
                  <th className="px-4 py-2 text-left">Dorsal</th>
                  <th className="px-4 py-2 text-left">Nom</th>
                  <th className="px-4 py-2 text-left">Etapes</th>
                  <th className="px-4 py-2 text-left">Interval acumulat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {general.map((g, i) => {
                  const difMs = g.totalMs - general[0].totalMs
                  const s = Math.floor(difMs / 1000)
                  const m = Math.floor(s / 60)
                  const ss = s % 60
                  return (
                    <tr key={g.dorsal} className={i === 0 ? 'bg-yellow-400/10' : ''}>
                      <td className="px-4 py-2 font-black text-yellow-400">{i + 1}</td>
                      <td className="px-4 py-2">
                        <span className="bg-yellow-400 text-black font-black px-2 py-0.5 rounded text-xs">{g.dorsal}</span>
                      </td>
                      <td className="px-4 py-2 font-medium">{g.nom} {g.cognoms}</td>
                      <td className="px-4 py-2 text-gray-400">{g.etapes}/3</td>
                      <td className="px-4 py-2 text-gray-300 text-xs">
                        {i === 0 ? <span className="text-yellow-400 font-bold">Líder</span> : (m > 0 ? `+${m}m ${ss}s` : `+${ss}s`)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}
