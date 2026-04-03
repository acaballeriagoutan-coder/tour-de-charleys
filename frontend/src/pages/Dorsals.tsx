import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const API = 'http://localhost:8000'

interface Ciclista {
  id: string
  nom: string
  cognoms: string
  numero_dorsal: number
}

export default function Dorsals() {
  const navigate = useNavigate()
  const [ciclistes, setCiclistes] = useState<Ciclista[]>([])
  const [carregant, setCarregant] = useState(true)

  useEffect(() => {
    axios.get(`${API}/ciclistes/amb-dorsal`).then(res => {
      setCiclistes(res.data)
      setCarregant(false)
    })
  }, [])

  return (
    <>
      {/* Botons de navegació — ocults en imprimir */}
      <div className="no-print bg-gray-950 text-white px-6 py-4 flex items-center gap-4 border-b border-gray-800">
        <button onClick={() => navigate('/admin')} className="text-gray-400 hover:text-white text-sm transition">
          ← Tornar al panell
        </button>
        <span className="text-gray-600">|</span>
        <span className="text-sm text-gray-400">{ciclistes.length} dorsals preparats</span>
        <button
          onClick={() => window.print()}
          className="ml-auto bg-orange-500 hover:bg-orange-400 text-white font-bold px-5 py-2 rounded-lg text-sm transition"
        >
          Imprimir
        </button>
      </div>

      {carregant ? (
        <p className="text-center text-gray-500 py-20">Carregant dorsals...</p>
      ) : (
        <div className="dorsals-grid">
          {ciclistes.map(c => (
            <div key={c.id} className="dorsal-card">
              <div className="dorsal-header">
                <span className="dorsal-event">Tour de Charleys</span>
                <span className="dorsal-lloc">Torelló · 2025</span>
              </div>
              <div className="dorsal-numero">{c.numero_dorsal}</div>
              <div className="dorsal-nom">{c.nom} {c.cognoms}</div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .dorsals-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0;
          background: #f3f4f6;
          padding: 16px;
        }

        .dorsal-card {
          width: 148mm;
          height: 105mm;
          background: white;
          border: 2px solid #1f2937;
          border-radius: 8px;
          margin: 8px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          font-family: 'Arial Black', Arial, sans-serif;
        }

        .dorsal-header {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          background: #ea580c;
          color: white;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 16px;
          font-size: 11px;
          font-weight: bold;
          letter-spacing: 1px;
          text-transform: uppercase;
        }

        .dorsal-numero {
          font-size: 96px;
          font-weight: 900;
          color: #1f2937;
          line-height: 1;
          letter-spacing: -4px;
        }

        .dorsal-nom {
          font-size: 14px;
          font-weight: bold;
          color: #374151;
          text-transform: uppercase;
          letter-spacing: 2px;
          margin-top: 8px;
        }

        @media print {
          .no-print { display: none !important; }

          body { margin: 0; background: white; }

          .dorsals-grid {
            display: block;
            padding: 0;
            background: white;
          }

          .dorsal-card {
            width: 148mm;
            height: 105mm;
            margin: 0 auto;
            page-break-after: always;
            border-radius: 0;
            border: none;
            border-top: 3px solid #ea580c;
          }

          .dorsal-card:last-child {
            page-break-after: avoid;
          }
        }
      `}</style>
    </>
  )
}
