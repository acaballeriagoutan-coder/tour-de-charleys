import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const API = 'http://localhost:8000'
const LS_KEY = 'dorsal_bg_image'

interface Ciclista {
  id: string
  nom: string
  cognoms: string
  numero_dorsal: number
}

export default function Dorsals() {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [ciclistes, setCiclistes] = useState<Ciclista[]>([])
  const [carregant, setCarregant] = useState(true)
  const [bgImage, setBgImage] = useState<string | null>(localStorage.getItem(LS_KEY))

  useEffect(() => {
    axios.get(`${API}/ciclistes/amb-dorsal`).then(res => {
      setCiclistes(res.data)
      setCarregant(false)
    })
  }, [])

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string
      localStorage.setItem(LS_KEY, dataUrl)
      setBgImage(dataUrl)
    }
    reader.readAsDataURL(file)
  }

  function eliminarImatge() {
    localStorage.removeItem(LS_KEY)
    setBgImage(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const dorsalStyle = bgImage
    ? { backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : {}

  return (
    <>
      {/* ── BARRA DE CONTROLS ── */}
      <div className="no-print bg-gray-950 text-white px-6 py-4 border-b border-gray-800">
        <div className="flex items-center gap-4 flex-wrap">
          <button onClick={() => navigate('/admin')} className="text-gray-400 hover:text-white text-sm transition">
            ← Tornar al panell
          </button>
          <span className="text-gray-600">|</span>
          <span className="text-sm text-gray-400">{ciclistes.length} dorsals</span>

          <div className="ml-auto flex items-center gap-3">
            <label className="cursor-pointer bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {bgImage ? 'Canviar plantilla' : 'Pujar plantilla'}
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </label>

            {bgImage && (
              <button onClick={eliminarImatge} className="text-red-400 hover:text-red-300 text-sm transition">
                Eliminar plantilla
              </button>
            )}

            <button onClick={() => window.print()} className="bg-yellow-400 hover:bg-yellow-300 text-black font-bold px-5 py-2 rounded-lg text-sm transition">
              Imprimir
            </button>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${bgImage ? 'bg-green-400' : 'bg-gray-600'}`} />
          <span className="text-xs text-gray-500">
            {bgImage ? 'Plantilla personalitzada activa' : 'Disseny per defecte · Puja la teva plantilla per personalitzar'}
          </span>
        </div>
      </div>

      {/* ── DORSALS ── */}
      {carregant ? (
        <p className="text-center text-gray-500 py-20">Carregant dorsals...</p>
      ) : ciclistes.length === 0 ? (
        <p className="text-center text-gray-500 py-20">Assigna dorsals primer des del panell d'administració.</p>
      ) : (
        <div className="dorsals-grid">
          {ciclistes.map(c => (
            <div key={c.id} className="dorsal-card" style={dorsalStyle}>
              {!bgImage && (
                <>
                  <div className="dorsal-franja-top" />
                  <div className="dorsal-franja-bottom" />
                  <div className="dorsal-cercle" />
                </>
              )}
              <div className="dorsal-header">
                <span>Le Tour de Charley's</span>
                <span>Torelló · 2026</span>
              </div>
              <div className={`dorsal-numero ${bgImage ? 'dorsal-numero-shadow' : ''}`}>{c.numero_dorsal}</div>
              <div className={`dorsal-nom ${bgImage ? 'dorsal-nom-shadow' : ''}`}>{c.nom} {c.cognoms}</div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .dorsals-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 24px;
          background: #e5e7eb;
          padding: 24px;
          min-height: 100vh;
        }
        .dorsal-card {
          width: 100%;
          aspect-ratio: 148 / 105;
          background: white;
          border-radius: 10px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          font-family: 'Arial Black', Arial, sans-serif;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        }
        .dorsal-franja-top {
          position: absolute; top: 0; left: 0; right: 0;
          height: 28%; background: #FFE000;
        }
        .dorsal-franja-bottom {
          position: absolute; bottom: 0; left: 0; right: 0;
          height: 18%; background: #111;
        }
        .dorsal-cercle {
          position: absolute;
          width: 120%; aspect-ratio: 1; border-radius: 50%;
          background: rgba(0,0,0,0.04); top: -20%; left: -10%;
        }
        .dorsal-header {
          position: absolute; top: 0; left: 0; right: 0;
          display: flex; justify-content: space-between; align-items: center;
          padding: 6px 14px; font-size: 10px; font-weight: bold;
          letter-spacing: 1.5px; text-transform: uppercase; color: #111; z-index: 2;
        }
        .dorsal-numero {
          font-size: clamp(48px, 10vw, 88px); font-weight: 900;
          color: #111; line-height: 1; letter-spacing: -3px; z-index: 2; position: relative;
        }
        .dorsal-numero-shadow {
          color: white;
          text-shadow: 2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000;
        }
        .dorsal-nom {
          font-size: 11px; font-weight: bold; color: #374151;
          text-transform: uppercase; letter-spacing: 2px; margin-top: 6px; z-index: 2; position: relative;
        }
        .dorsal-nom-shadow { color: white; text-shadow: 1px 1px 3px rgba(0,0,0,0.8); }

        @media print {
          .no-print { display: none !important; }
          body { margin: 0; background: white; }
          .dorsals-grid { display: block; padding: 0; background: white; }
          .dorsal-card {
            width: 148mm; height: 105mm; aspect-ratio: unset;
            margin: 0 auto; page-break-after: always; border-radius: 0; box-shadow: none;
          }
          .dorsal-card:last-child { page-break-after: avoid; }
          .dorsal-franja-top, .dorsal-franja-bottom {
            -webkit-print-color-adjust: exact; print-color-adjust: exact;
          }
        }
      `}</style>
    </>
  )
}
