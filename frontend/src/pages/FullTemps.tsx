import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'

interface Ciclista {
  id: string
  nom: string
  cognoms: string
  numero_dorsal: number
}

export default function FullTemps() {
  const navigate = useNavigate()
  const [ciclistes, setCiclistes] = useState<Ciclista[]>([])
  const [carregant, setCarregant] = useState(true)

  useEffect(() => {
    api.get('/ciclistes/amb-dorsal').then(res => {
      setCiclistes(res.data)
      setCarregant(false)
    })
  }, [])

  return (
    <div className="min-h-screen bg-white text-black">

      {/* Header — només visible en pantalla */}
      <header className="print:hidden bg-gray-900 text-white px-6 py-4 flex items-center justify-between">
        <div>
          <button onClick={() => navigate('/admin/cronometratge')} className="text-gray-500 hover:text-white text-sm transition mb-1">← Tornar</button>
          <h1 className="text-xl font-bold">Full de temps manual</h1>
        </div>
        <button
          onClick={() => window.print()}
          className="bg-yellow-400 hover:bg-yellow-300 text-black font-bold px-5 py-2 rounded-lg text-sm transition"
        >
          Imprimir
        </button>
      </header>

      {/* Contingut imprimible */}
      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* Capçalera del full */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black uppercase tracking-widest">Le Tour de Charley's</h1>
          <p className="text-lg font-bold mt-1">Full de control de temps · 2026</p>
        </div>

        {carregant ? (
          <p className="text-center text-gray-400 py-10">Carregant inscrits...</p>
        ) : (
          <div className="flex gap-8 items-start">

            {/* Taula principal de temps */}
            <div className="flex-1">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-black text-white">
                    <th className="border border-black px-3 py-2 text-left w-16">Dorsal</th>
                    <th className="border border-black px-3 py-2 text-left">Nom i Cognoms</th>
                    <th className="border border-black px-3 py-2 text-center w-24">Etapa 1</th>
                    <th className="border border-black px-3 py-2 text-center w-24">Etapa 2</th>
                    <th className="border border-black px-3 py-2 text-center w-24">Etapa 3</th>
                    <th className="border border-black px-3 py-2 text-center w-28">Temps general</th>
                    <th className="border border-black px-3 py-2 text-center w-20">Obs.</th>
                  </tr>
                </thead>
                <tbody>
                  {ciclistes.map((c, i) => (
                    <tr key={c.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-100'}>
                      <td className="border border-black px-3 py-3 font-black text-center text-base">{c.numero_dorsal}</td>
                      <td className="border border-black px-3 py-3 font-medium">{c.nom} {c.cognoms}</td>
                      <td className="border border-black px-3 py-3"></td>
                      <td className="border border-black px-3 py-3"></td>
                      <td className="border border-black px-3 py-3"></td>
                      <td className="border border-black px-3 py-3"></td>
                      <td className="border border-black px-3 py-3"></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-xs text-gray-400 mt-3 print:text-gray-500">
                {ciclistes.length} participants inscrits
              </p>
            </div>

            {/* Taula classificació general final */}
            <div className="w-56 shrink-0">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-black text-white">
                    <th className="border border-black px-2 py-2 text-center" colSpan={3}>Classificació General Final</th>
                  </tr>
                  <tr className="bg-gray-800 text-white">
                    <th className="border border-black px-2 py-1 text-center w-8">#</th>
                    <th className="border border-black px-2 py-1 text-center w-14">Dorsal</th>
                    <th className="border border-black px-2 py-1 text-center">Temps total</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: ciclistes.length }).map((_, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-100'}>
                      <td className="border border-black px-2 py-3 text-center font-black text-gray-500">{i + 1}</td>
                      <td className="border border-black px-2 py-3"></td>
                      <td className="border border-black px-2 py-3"></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        )}
      </div>
    </div>
  )
}
