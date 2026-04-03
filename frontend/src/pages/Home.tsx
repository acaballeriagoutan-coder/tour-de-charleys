import { useState } from 'react'
import type { FormEvent } from 'react'
import axios from 'axios'

const API = 'http://localhost:8000'

type Estat = 'idle' | 'loading' | 'ok' | 'error'

const GENERES = ['Home', 'Dona', 'No binari', 'Prefereixo no especificar']

// Patrons de validació
const PATTERNS = {
  email: {
    pattern: '[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}',
    title: 'Format vàlid: usuari@correu.domini',
  },
  tel: {
    pattern: '[0-9]{9}',
    title: '9 dígits numèrics (ex: 612345678)',
  },
  dni: {
    pattern: '[0-9]{7,8}[A-Za-z]',
    title: 'Format vàlid: 12345678A',
  },
  llicencia: {
    pattern: '[A-Za-z]{2,5}-[0-9]{4,6}',
    title: 'Format vàlid: CAT-12345',
  },
}

function Input({ label, name, type = 'text', value, onChange, required = true, placeholder = '', pattern, title }: {
  label: string; name: string; type?: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  required?: boolean; placeholder?: string; pattern?: string; title?: string
}) {
  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">
        {label} {required && <span className="text-yellow-400">*</span>}
      </label>
      <input
        type={type} name={name} value={value} onChange={onChange}
        required={required} placeholder={placeholder}
        pattern={pattern} title={title}
        style={{ fontFamily: 'Arial, sans-serif' }}
        className="w-full bg-zinc-900 border border-zinc-700 px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-400 invalid:border-red-700 transition text-sm"
      />
      {title && <p className="mt-1 text-xs text-zinc-600">{title}</p>}
    </div>
  )
}

function Seccio({ titol, children }: { titol: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="h-px flex-1 bg-zinc-800" />
        <span className="text-xs font-bold uppercase tracking-widest text-yellow-400">{titol}</span>
        <div className="h-px flex-1 bg-zinc-800" />
      </div>
      <div className="flex flex-col gap-4">{children}</div>
    </div>
  )
}

export default function Home() {
  const [form, setForm] = useState({
    nom: '', cognoms: '', email: '', telefon: '',
    dni: '', data_naixement: '', genere: '',
    contacte_emergencia_nom: '', contacte_emergencia_telefon: '',
    te_asseguranca: '', vol_asseguranca: '', numero_llicencia: '', cessio_imatge: '',
  })
  const [accepta_reglament, setAcceptaReglament] = useState(false)
  const [fotoFile, setFotoFile] = useState<File | null>(null)
  const [fotoPreview, setFotoPreview] = useState<string | null>(null)
  const [estat, setEstat] = useState<Estat>('idle')
  const [missatgeError, setMissatgeError] = useState('')

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  function handleFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFotoFile(file)
    setFotoPreview(URL.createObjectURL(file))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!accepta_reglament) {
      setMissatgeError('Cal acceptar el reglament per continuar.')
      setEstat('error')
      return
    }
    setEstat('loading')
    setMissatgeError('')

    // Upload foto si n'hi ha
    let foto_url: string | null = null
    if (fotoFile) {
      const fd = new FormData()
      fd.append('foto', fotoFile)
      const res = await axios.post(`${API}/upload-foto`, fd)
      foto_url = res.data.url
    }

    try {
      await axios.post(`${API}/ciclistes`, {
        ...form,
        te_asseguranca: form.te_asseguranca === 'true',
        vol_asseguranca: form.te_asseguranca === 'false' ? true : null,
        numero_llicencia: form.numero_llicencia,
        foto_url,
        accepta_reglament,
        cessio_imatge: form.cessio_imatge === 'true',
      })
      setEstat('ok')
      setForm({ nom: '', cognoms: '', email: '', telefon: '', dni: '', data_naixement: '', genere: '', contacte_emergencia_nom: '', contacte_emergencia_telefon: '', te_asseguranca: '', vol_asseguranca: '', numero_llicencia: '', cessio_imatge: '' })
      setAcceptaReglament(false)
      setFotoFile(null)
      setFotoPreview(null)
    } catch (err: any) {
      const detail = err?.response?.data?.detail ?? ''
      setMissatgeError(
        detail.includes('email') ? 'Aquest email ja està inscrit.' :
        detail.includes('DNI') ? 'Aquest DNI ja està inscrit.' :
        detail.includes('reglament') ? 'Cal acceptar el reglament.' :
        'Hi ha hagut un error. Torna-ho a intentar.'
      )
      setEstat('error')
    }
  }

  return (
    <div style={{ fontFamily: "'Arial Black', 'Impact', Arial, sans-serif" }} className="min-h-screen bg-black text-white">

      {/* ── HERO ── */}
      <header className="relative flex flex-col items-center justify-center text-center px-6 py-36 overflow-hidden min-h-screen">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/Santuari_de_Bellmunt.jpg')" }} />
        <div className="absolute inset-0 bg-black/55" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black" />
        <div className="absolute top-0 left-0 right-0 h-1 bg-yellow-400" />

        <div className="relative z-10 flex flex-col items-center">
          <img src="/logo.png" alt="Le Tour de Charley's"
            className="w-44 md:w-56 mb-8 drop-shadow-2xl rounded-full ring-2 ring-white/40 object-cover" />
          <div className="flex items-center gap-4">
            <div className="h-px w-16 bg-yellow-400" />
            <span className="text-yellow-400 text-xs font-bold uppercase tracking-[0.3em]">Edició 2026 · Torelló</span>
            <div className="h-px w-16 bg-yellow-400" />
          </div>
          <p className="mt-6 text-white/80 text-lg max-w-md font-normal" style={{ fontFamily: 'Arial, sans-serif' }}>
            La cursa ciclista més esperada de l'any torna. Apunta't i viu l'experiència.
          </p>
          <a href="#inscripcio"
            className="mt-10 inline-flex items-center gap-2 bg-yellow-400 text-black font-black uppercase px-10 py-4 text-sm tracking-widest hover:bg-yellow-300 transition">
            Inscriu-te ara <span className="text-lg">»</span>
          </a>
        </div>
        <img src="/logo.png" alt="" className="absolute bottom-6 right-6 w-12 opacity-60 rounded-full ring-1 ring-white/30 object-cover" />
      </header>

      {/* ── STRIP INFO ── */}
      <div className="bg-yellow-400 text-black py-4 px-6">
        <div className="max-w-4xl mx-auto flex flex-wrap justify-center gap-8 text-center">
          {[{ label: 'Esdeveniment', valor: 'Sports Event' }, { label: 'Ubicació', valor: 'Torelló, Osona' }, { label: 'Edició', valor: '2026' }].map(({ label, valor }) => (
            <div key={label}>
              <p className="text-xs uppercase tracking-widest font-bold opacity-60">{label}</p>
              <p className="text-lg font-black uppercase">{valor}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── FORMULARI ── */}
      <section id="inscripcio" className="max-w-2xl mx-auto px-4 py-20">
        <div className="mb-10 text-center">
          <p className="text-yellow-400 text-xs font-bold uppercase tracking-[0.3em] mb-2">Inscripcions obertes</p>
          <h2 className="text-4xl font-black uppercase">Reserva la<br />teva plaça</h2>
          <div className="mt-4 mx-auto w-12 h-1 bg-yellow-400" />
          <p className="mt-4 text-zinc-500 text-xs" style={{ fontFamily: 'Arial, sans-serif' }}>
            Els camps marcats amb <span className="text-yellow-400">*</span> són obligatoris
          </p>
        </div>

        {estat === 'ok' ? (
          <div className="border border-yellow-400 p-10 text-center">
            <div className="text-5xl font-black text-yellow-400 mb-3">✓</div>
            <h3 className="text-2xl font-black uppercase mb-2">Inscripció confirmada!</h3>
            <p className="text-zinc-400 font-normal" style={{ fontFamily: 'Arial, sans-serif' }}>
              Ens posarem en contacte amb tu aviat. Fins aviat al Tour!
            </p>
            <button onClick={() => setEstat('idle')}
              className="mt-6 text-xs text-yellow-400 uppercase tracking-widest hover:text-yellow-300 transition">
              Inscriure una altra persona →
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="border border-zinc-800 bg-zinc-950 p-8 flex flex-col gap-8">

            {/* DADES PERSONALS */}
            <Seccio titol="Dades personals">
              <div className="grid grid-cols-2 gap-4">
                <Input label="Nom" name="nom" value={form.nom} onChange={handleChange} />
                <Input label="Cognoms" name="cognoms" value={form.cognoms} onChange={handleChange} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="DNI / Passaport" name="dni" value={form.dni} onChange={handleChange} placeholder="12345678A" pattern={PATTERNS.dni.pattern} title={PATTERNS.dni.title} />
                <Input label="Data de naixement" name="data_naixement" type="date" value={form.data_naixement} onChange={handleChange} />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">
                  Gènere <span className="text-yellow-400">*</span>
                </label>
                <select name="genere" value={form.genere} onChange={handleChange} required
                  style={{ fontFamily: 'Arial, sans-serif' }}
                  className="w-full bg-zinc-900 border border-zinc-700 px-4 py-3 text-white focus:outline-none focus:border-yellow-400 transition text-sm">
                  <option value="">Selecciona...</option>
                  {GENERES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Email" name="email" type="email" value={form.email} onChange={handleChange} pattern={PATTERNS.email.pattern} title={PATTERNS.email.title} />
                <Input label="Telèfon" name="telefon" type="tel" value={form.telefon} onChange={handleChange} pattern={PATTERNS.tel.pattern} title={PATTERNS.tel.title} placeholder="612345678" />
              </div>
            </Seccio>

            {/* CONTACTE D'EMERGÈNCIA */}
            <Seccio titol="Contacte d'emergència">
              <div className="grid grid-cols-2 gap-4">
                <Input label="Nom i cognoms" name="contacte_emergencia_nom" value={form.contacte_emergencia_nom} onChange={handleChange} />
                <Input label="Telèfon" name="contacte_emergencia_telefon" type="tel" value={form.contacte_emergencia_telefon} onChange={handleChange} pattern={PATTERNS.tel.pattern} title={PATTERNS.tel.title} placeholder="612345678" />
              </div>
            </Seccio>

            {/* ASSEGURANÇA */}
            <Seccio titol="Assegurança">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">
                  Disposes d'assegurança esportiva pròpia? <span className="text-yellow-400">*</span>
                </label>
                <div className="flex gap-4">
                  {[{ val: 'true', label: 'Sí, en tinc' }, { val: 'false', label: 'No en tinc' }].map(({ val, label }) => (
                    <label key={val} className={`flex-1 flex items-center justify-center gap-2 border px-4 py-3 cursor-pointer transition text-sm ${form.te_asseguranca === val ? 'border-yellow-400 text-yellow-400' : 'border-zinc-700 text-zinc-400 hover:border-zinc-500'}`}>
                      <input type="radio" name="te_asseguranca" value={val} checked={form.te_asseguranca === val}
                        onChange={handleChange} required className="accent-yellow-400" />
                      {label}
                    </label>
                  ))}
                </div>
              </div>

              {form.te_asseguranca === 'false' && (
                <div className="border border-yellow-400/40 bg-yellow-400/5 px-4 py-3 text-sm text-yellow-300" style={{ fontFamily: 'Arial, sans-serif' }}>
                  ⚠️ En no disposar d'assegurança pròpia, l'organització te'n proporcionarà una. L'import s'afegirà al cost total de la inscripció.
                </div>
              )}

              {form.te_asseguranca === 'true' && (
                <Input label="Número de llicència federativa" name="numero_llicencia" value={form.numero_llicencia}
                  onChange={handleChange} required placeholder="Ex: CAT-12345" />
              )}
            </Seccio>

            {/* LEGAL */}
            <Seccio titol="Aspectes legals">
              <label className={`flex items-start gap-3 border p-4 cursor-pointer transition ${accepta_reglament ? 'border-yellow-400' : 'border-zinc-700 hover:border-zinc-500'}`}>
                <input type="checkbox" checked={accepta_reglament} onChange={e => setAcceptaReglament(e.target.checked)}
                  className="mt-0.5 accent-yellow-400 w-4 h-4 shrink-0" />
                <span className="text-sm text-zinc-300" style={{ fontFamily: 'Arial, sans-serif' }}>
                  He llegit i accepto el <span className="text-yellow-400 underline">reglament de la cursa</span> i les condicions de participació.
                  <span className="text-yellow-400 ml-1">*</span>
                </span>
              </label>

              <label className={`flex items-start gap-3 border p-4 cursor-pointer transition ${form.cessio_imatge === 'true' ? 'border-yellow-400' : 'border-zinc-700 hover:border-zinc-500'}`}>
                <input type="checkbox" checked={form.cessio_imatge === 'true'}
                  onChange={e => setForm({ ...form, cessio_imatge: e.target.checked ? 'true' : '' })}
                  required className="mt-0.5 accent-yellow-400 w-4 h-4 shrink-0" />
                <span className="text-sm text-zinc-300" style={{ fontFamily: 'Arial, sans-serif' }}>
                  Autoritzo l'organització a usar les meves imatges i vídeos de l'esdeveniment amb finalitats informatives i de promoció.
                  <span className="text-yellow-400 ml-1">*</span>
                </span>
              </label>
            </Seccio>

            {/* FOTO PERSONAL */}
            <Seccio titol="🆕 Novetat!">
              <div>
                <p className="text-sm text-zinc-300 mb-4" style={{ fontFamily: 'Arial, sans-serif' }}>
                  Puja una foto teva i la veuràs al teu dorsal el dia de la cursa! Pot ser una foto esportiva, divertida o la que vulguis, és la teva targeta de presentació a la sortida.
                  <span className="text-zinc-500 ml-1">(opcional)</span>
                </p>
                <label className={`flex flex-col items-center justify-center border border-dashed px-6 py-8 cursor-pointer transition gap-3 ${fotoPreview ? 'border-yellow-400' : 'border-zinc-700 hover:border-zinc-500'}`}>
                  {fotoPreview ? (
                    <img src={fotoPreview} alt="Preview" className="w-32 h-32 object-cover rounded-full ring-2 ring-yellow-400" />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-zinc-800 flex items-center justify-center text-3xl">📸</div>
                  )}
                  <span className="text-sm text-zinc-400" style={{ fontFamily: 'Arial, sans-serif' }}>
                    {fotoPreview ? 'Canviar foto' : 'Seleccionar foto (JPG, PNG)'}
                  </span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleFoto} />
                </label>
                {fotoPreview && (
                  <button type="button" onClick={() => { setFotoFile(null); setFotoPreview(null) }}
                    className="mt-2 text-xs text-red-400 hover:text-red-300 transition">
                    Eliminar foto
                  </button>
                )}
              </div>
            </Seccio>

            {estat === 'error' && (
              <p className="text-yellow-400 text-sm text-center" style={{ fontFamily: 'Arial, sans-serif' }}>
                {missatgeError}
              </p>
            )}

            <button type="submit" disabled={estat === 'loading'}
              className="bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-black font-black uppercase py-4 tracking-widest text-sm transition">
              {estat === 'loading' ? 'Enviant...' : "Completar inscripció"}
            </button>
          </form>
        )}
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-zinc-900 py-8 text-center">
        <p className="text-xs text-zinc-600 uppercase tracking-widest" style={{ fontFamily: 'Arial, sans-serif' }}>
          © 2026 Le Tour de Charley's · Torelló
        </p>
        <a href="https://www.instagram.com/letourdecharleys/" target="_blank" rel="noopener noreferrer"
          className="mt-2 inline-block text-xs text-zinc-500 hover:text-yellow-400 transition uppercase tracking-widest"
          style={{ fontFamily: 'Arial, sans-serif' }}>
          @letourdecharleys
        </a>
      </footer>
    </div>
  )
}
