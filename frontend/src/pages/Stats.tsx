import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Legend } from 'recharts'
import api from '../lib/api'

const COLOR_MAP: Record<string, string> = {
  blue: '#60a5fa',
  yellow: '#facc15',
  green: '#4ade80',
  orange: '#fb923c',
  purple: '#c084fc',
}

const DONUT_COLORS = ['#facc15', '#60a5fa', '#4ade80', '#fb923c', '#c084fc', '#f87171']

interface Insight {
  titol: string
  text: string
  color: string
}

interface Stats {
  total: number
  genere: Record<string, number>
  edats: Record<string, number>
  edat_mitja: number
  edat_min: number
  edat_max: number
  asseguranca: Record<string, number>
  amb_llicencia: number
  per_dia: { data: string; count: number }[]
}

function InsightCard({ insight }: { insight: Insight }) {
  const color = COLOR_MAP[insight.color] || '#facc15'
  return (
    <div className="bg-gray-900 rounded-xl p-5 border-l-4 flex flex-col gap-2" style={{ borderColor: color }}>
      <p className="font-bold text-white text-sm">{insight.titol}</p>
      <p className="text-gray-400 text-sm leading-relaxed">{insight.text}</p>
    </div>
  )
}

function DonutChart({ data, title }: { data: Record<string, number>; title: string }) {
  const chartData = Object.entries(data).map(([name, value]) => ({ name, value }))
  return (
    <div className="bg-gray-900 rounded-xl p-5">
      <p className="text-xs text-gray-500 uppercase tracking-widest mb-4">{title}</p>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie data={chartData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={3}>
            {chartData.map((_, i) => <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />)}
          </Pie>
          <Tooltip
            contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8 }}
            labelStyle={{ color: '#fff' }}
            itemStyle={{ color: '#9ca3af' }}
          />
          <Legend formatter={(val) => <span style={{ color: '#9ca3af', fontSize: 12 }}>{val}</span>} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

export default function Stats() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<Stats | null>(null)
  const [insights, setInsights] = useState<Insight[]>([])
  const [carregant, setCarregant] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/stats/insights')
      .then(res => {
        setStats(res.data.stats)
        setInsights(res.data.insights)
      })
      .catch(() => setError("Error carregant les estadístiques"))
      .finally(() => setCarregant(false))
  }, [])

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div>
          <button onClick={() => navigate('/admin')} className="text-gray-500 hover:text-white text-sm transition mb-1">← Tornar</button>
          <h1 className="text-xl font-bold">Anàlisi de dades · Agent IA</h1>
        </div>
        <button onClick={() => { setCarregant(true); setError(''); api.get('/stats/insights').then(r => { setStats(r.data.stats); setInsights(r.data.insights) }).catch(() => setError('Error')).finally(() => setCarregant(false)) }}
          className="bg-yellow-400 hover:bg-yellow-300 text-black font-bold px-4 py-2 rounded-lg text-sm transition">
          Actualitzar
        </button>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-10">

        {carregant && (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-500 text-sm">L'agent IA està analitzant les dades...</p>
          </div>
        )}

        {error && <p className="text-red-400 text-center py-20">{error}</p>}

        {!carregant && !error && stats && (
          <div className="flex flex-col gap-8">

            {/* KPIs ràpids */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total inscrits', valor: stats.total, color: 'text-yellow-400' },
                { label: 'Edat mitjana', valor: `${stats.edat_mitja} anys`, color: 'text-blue-400' },
                { label: 'Amb assegurança pròpia', valor: stats.asseguranca['Pròpia'] ?? 0, color: 'text-green-400' },
                { label: 'Amb llicència federativa', valor: stats.amb_llicencia, color: 'text-purple-400' },
              ].map(({ label, valor, color }) => (
                <div key={label} className="bg-gray-900 rounded-xl p-4 text-center">
                  <p className={`text-3xl font-black ${color}`}>{valor}</p>
                  <p className="text-xs text-gray-400 mt-1">{label}</p>
                </div>
              ))}
            </div>

            {/* Insights de Claude */}
            {insights.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-widest mb-4">Insights generats per Claude</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {insights.map((ins, i) => <InsightCard key={i} insight={ins} />)}
                </div>
              </div>
            )}

            {/* Gràfics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <DonutChart data={stats.genere} title="Distribució per gènere" />
              <DonutChart data={stats.edats} title="Franges d'edat" />
              <DonutChart data={stats.asseguranca} title="Assegurança" />
            </div>

            {/* Inscripcions per dia */}
            {stats.per_dia.length > 1 && (
              <div className="bg-gray-900 rounded-xl p-5">
                <p className="text-xs text-gray-500 uppercase tracking-widest mb-4">Ritme d'inscripcions per dia</p>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={stats.per_dia}>
                    <XAxis dataKey="data" tick={{ fill: '#6b7280', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8 }}
                      labelStyle={{ color: '#fff' }}
                      itemStyle={{ color: '#facc15' }}
                    />
                    <Bar dataKey="count" fill="#facc15" radius={[4, 4, 0, 0]} name="Inscrits" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

          </div>
        )}
      </main>
    </div>
  )
}
