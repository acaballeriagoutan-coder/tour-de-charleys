import { useState, FormEvent } from 'react'
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
      setMissatgeError(
        err?.response?.data?.detail === 'duplicate key value violates unique constraint "ciclistes_email_key"'
          ? 'Aquest email ja està inscrit.'
          : 'Hi ha hagut un error. Torna-ho a intentar.'
      )
      setEstat('error')
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* HERO */}
      <header className="relative flex flex-col items-center justify-center text-center px-4 py-24 bg-gradient-to-b from-orange-600 via-orange-500 to-gray-950">
        <p className="text-orange-200 uppercase tracking-widest text-sm font-semibold mb-3">Torelló · 2025</p>
        <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tight leading-none">
          Tour de<br />Charleys
        </h1>
        <p className="mt-6 text-lg text-orange-100 max-w-md">
          La cursa ciclista més esperada de l'any. Inscriu-te ara i reserva el teu lloc.
        </p>
        <a href="#inscripcio" className="mt-10 inline-block bg-white text-orange-600 font-bold px-8 py-3 rounded-full hover:bg-orange-100 transition">
          Inscriu-te ara →
        </a>
      </header>

      {/* FORMULARI */}
      <section id="inscripcio" className="max-w-lg mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-2">Formulari d'inscripció</h2>
        <p className="text-center text-gray-400 mb-10">Omple les dades per reservar la teva plaça.</p>

        {estat === 'ok' ? (
          <div className="bg-green-900/50 border border-green-500 rounded-2xl p-8 text-center">
            <div className="text-4xl mb-3">🎉</div>
            <h3 className="text-xl font-bold text-green-400 mb-2">Inscripció completada!</h3>
            <p className="text-green-200">Ens posarem en contacte amb tu aviat. Fins aviat!</p>
            <button
              onClick={() => setEstat('idle')}
              className="mt-6 text-sm text-green-400 underline hover:text-green-300"
            >
              Inscriure una altra persona
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-gray-900 rounded-2xl p-8 flex flex-col gap-5 shadow-xl">
            {[
              { label: 'Nom', name: 'nom', type: 'text' },
              { label: 'Cognoms', name: 'cognoms', type: 'text' },
              { label: 'Email', name: 'email', type: 'email' },
              { label: 'Telèfon', name: 'telefon', type: 'tel' },
            ].map(({ label, name, type }) => (
              <div key={name}>
                <label className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
                <input
                  type={type}
                  name={name}
                  value={form[name as keyof typeof form]}
                  onChange={handleChange}
                  required
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 transition"
                />
              </div>
            ))}

            {estat === 'error' && (
              <p className="text-red-400 text-sm text-center">{missatgeError}</p>
            )}

            <button
              type="submit"
              disabled={estat === 'loading'}
              className="bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white font-bold py-3 rounded-lg transition mt-2"
            >
              {estat === 'loading' ? 'Enviant...' : 'Inscriure\'m'}
            </button>
          </form>
        )}
      </section>

      <footer className="text-center text-gray-600 pb-10 text-sm">
        © 2025 Tour de Charleys · Torelló
      </footer>
    </div>
  )
}
