import { useState } from 'react'
import type { FormEvent } from 'react'
import axios from 'axios'

const API = 'http://localhost:8000'

type Estat = 'idle' | 'loading' | 'ok' | 'error'

export default function Home() {
  const [form, setForm] = useState({ nom: '', cognoms: '', email: '', telefon: '' })
  const [estat, setEstat] = useState<Estat>('idle')
  const [missatgeError, setMissatgeError] = useState('')

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setEstat('loading')
    setMissatgeError('')
    try {
      await axios.post(`${API}/ciclistes`, form)
      setEstat('ok')
      setForm({ nom: '', cognoms: '', email: '', telefon: '' })
    } catch (err: any) {
      const detail = err?.response?.data?.detail ?? ''
      setMissatgeError(
        detail.includes('unique constraint')
          ? 'Aquest email ja està inscrit.'
          : 'Hi ha hagut un error. Torna-ho a intentar.'
      )
      setEstat('error')
    }
  }

  return (
    <div style={{ fontFamily: "'Arial Black', 'Impact', Arial, sans-serif" }} className="min-h-screen bg-black text-white">

      {/* ── HERO ── */}
      <header className="relative flex flex-col items-center justify-center text-center px-6 py-36 overflow-hidden min-h-screen">
        {/* Foto de fons */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/hero-bg.jpg')" }}
        />
        {/* Capa fosca sobre la foto */}
        <div className="absolute inset-0 bg-black/55" />
        {/* Degradat cap a baix per fusionar amb el negre */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black" />

        {/* Línia accent groga */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-yellow-400" />

        <div className="relative z-10 flex flex-col items-center">
          {/* Logo gran centrat */}
          <img
            src="/logo.png"
            alt="Le Tour de Charley's"
            className="w-44 md:w-56 mb-8 drop-shadow-2xl"
          />

          <div className="flex items-center gap-4">
            <div className="h-px w-16 bg-yellow-400" />
            <span className="text-yellow-400 text-xs font-bold uppercase tracking-[0.3em]">Edició 2026 · Torelló</span>
            <div className="h-px w-16 bg-yellow-400" />
          </div>

          <p className="mt-6 text-white/80 text-lg max-w-md font-normal" style={{ fontFamily: 'Arial, sans-serif' }}>
            La cursa ciclista més esperada de l'any torna. Apunta't i viu l'experiència.
          </p>

          <a
            href="#inscripcio"
            className="mt-10 inline-flex items-center gap-2 bg-yellow-400 text-black font-black uppercase px-10 py-4 text-sm tracking-widest hover:bg-yellow-300 transition"
          >
            Inscriu-te ara
            <span className="text-lg">»</span>
          </a>
        </div>

        {/* Logo petit cantonada inferior dreta */}
        <img
          src="/logo.png"
          alt=""
          className="absolute bottom-6 right-6 w-12 opacity-60"
        />
      </header>

      {/* ── STRIP INFO ── */}
      <div className="bg-yellow-400 text-black py-4 px-6">
        <div className="max-w-4xl mx-auto flex flex-wrap justify-center gap-8 text-center">
          {[
            { label: 'Esdeveniment', valor: 'Sports Event' },
            { label: 'Ubicació', valor: 'Torelló, Osona' },
            { label: 'Edició', valor: '2026' },
          ].map(({ label, valor }) => (
            <div key={label}>
              <p className="text-xs uppercase tracking-widest font-bold opacity-60">{label}</p>
              <p className="text-lg font-black uppercase">{valor}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── FORMULARI ── */}
      <section id="inscripcio" className="max-w-lg mx-auto px-4 py-20">
        <div className="mb-10 text-center">
          <p className="text-yellow-400 text-xs font-bold uppercase tracking-[0.3em] mb-2">Inscripcions obertes</p>
          <h2 className="text-4xl font-black uppercase">Reserva la<br />teva plaça</h2>
          <div className="mt-4 mx-auto w-12 h-1 bg-yellow-400" />
        </div>

        {estat === 'ok' ? (
          <div className="border border-yellow-400 p-10 text-center">
            <div className="text-5xl font-black text-yellow-400 mb-3">✓</div>
            <h3 className="text-2xl font-black uppercase mb-2">Inscripció confirmada!</h3>
            <p className="text-zinc-400 font-normal" style={{ fontFamily: 'Arial, sans-serif' }}>
              Ens posarem en contacte amb tu aviat. Fins aviat al Tour!
            </p>
            <button
              onClick={() => setEstat('idle')}
              className="mt-6 text-xs text-yellow-400 uppercase tracking-widest hover:text-yellow-300 transition"
            >
              Inscriure una altra persona →
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="border border-zinc-800 bg-zinc-950 p-8 flex flex-col gap-5">
            {[
              { label: 'Nom', name: 'nom', type: 'text' },
              { label: 'Cognoms', name: 'cognoms', type: 'text' },
              { label: 'Email', name: 'email', type: 'email' },
              { label: 'Telèfon', name: 'telefon', type: 'tel' },
            ].map(({ label, name, type }) => (
              <div key={name}>
                <label
                  className="block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2"
                >
                  {label}
                </label>
                <input
                  type={type}
                  name={name}
                  value={form[name as keyof typeof form]}
                  onChange={handleChange}
                  required
                  style={{ fontFamily: 'Arial, sans-serif' }}
                  className="w-full bg-zinc-900 border border-zinc-700 px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-400 transition text-sm"
                />
              </div>
            ))}

            {estat === 'error' && (
              <p className="text-yellow-400 text-sm text-center" style={{ fontFamily: 'Arial, sans-serif' }}>
                {missatgeError}
              </p>
            )}

            <button
              type="submit"
              disabled={estat === 'loading'}
              className="mt-2 bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-black font-black uppercase py-4 tracking-widest text-sm transition"
            >
              {estat === 'loading' ? 'Enviant...' : "Inscriure'm"}
            </button>
          </form>
        )}
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-zinc-900 py-8 text-center">
        <p className="text-xs text-zinc-600 uppercase tracking-widest" style={{ fontFamily: 'Arial, sans-serif' }}>
          © 2026 Le Tour de Charley's · Torelló
        </p>
        <a
          href="https://www.instagram.com/letourdecharleys/"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block text-xs text-zinc-500 hover:text-yellow-400 transition uppercase tracking-widest"
          style={{ fontFamily: 'Arial, sans-serif' }}
        >
          @letourdecharleys
        </a>
      </footer>
    </div>
  )
}
