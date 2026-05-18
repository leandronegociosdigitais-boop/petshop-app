import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getLocalDateISO } from '../lib/dates'
import {
  TrendingUp,
  Scissors,
  Receipt,
  CalendarClock,
  PawPrint,
  Clock,
  RefreshCw,
  Zap,
  CreditCard,
  Banknote,
  ArrowLeftRight,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

const STATUS_BADGE_DARK = {
  agendado: 'bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/30',
  em_andamento: 'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30',
  concluido: 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30',
  cancelado: 'bg-slate-500/15 text-slate-400 ring-1 ring-slate-500/30',
}

const STATUS_LABEL = {
  agendado: 'Agendado',
  em_andamento: 'Em Andamento',
  concluido: 'Concluido',
  cancelado: 'Cancelado',
}

const FORMA_PAGAMENTO_LABEL = {
  pix: 'Pix',
  cartao_debito: 'Debito',
  cartao_credito: 'Credito',
  dinheiro: 'Dinheiro',
  permuta: 'Permuta',
}

const FORMA_PAGAMENTO_ICON = {
  pix: Zap,
  cartao_debito: CreditCard,
  cartao_credito: CreditCard,
  dinheiro: Banknote,
  permuta: ArrowLeftRight,
}

const PIE_COLORS = ['#8b5cf6', '#06b6d4', '#f59e0b', '#10b981', '#f43f5e']

const MONTH_NAMES_FULL = [
  'janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'debembro',
]

const WEEKDAYS = [
  'Domingo', 'Segunda-feira', 'Terca-feira', 'Quarta-feira',
  'Quinta-feira', 'Sexta-feira', 'Sabado',
]

function formatCurrency(value) {
  if (value == null) return 'R$ 0,00'
  const num = parseFloat(value)
  if (isNaN(num)) return 'R$ 0,00'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num)
}

function formatTickK(v) {
  if (v >= 1000) return `${(v / 1000).toFixed(0)}k`
  return `${v}`
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return { text: 'Bom dia', emoji: '☀️' }
  if (h < 18) return { text: 'Boa tarde', emoji: '🌤️' }
  return { text: 'Boa noite', emoji: '🌙' }
}

function getDateDisplay() {
  const now = new Date()
  const weekday = WEEKDAYS[now.getDay()]
  const day = now.getDate()
  const month = MONTH_NAMES_FULL[now.getMonth()]
  return `${weekday}, ${day} de ${month}`
}

function getMonthRange() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  const toStr = (d) => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }
  return { start: toStr(start), end: toStr(end) }
}

function getPrevMonthRange() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const end = new Date(now.getFullYear(), now.getMonth(), 0)
  const toStr = (d) => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }
  return { start: toStr(start), end: toStr(end) }
}

function getLast30DaysRange() {
  const now = new Date()
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  const start = new Date(end)
  start.setDate(start.getDate() - 30)
  const toStr = (d) => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }
  return { start: toStr(start), end: toStr(end) }
}

function getNext7DaysRange() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const end = new Date(start)
  end.setDate(end.getDate() + 8)
  const toStr = (d) => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }
  return { start: toStr(start), end: toStr(end) }
}

function SkeletonCard() {
  return (
    <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 animate-pulse">
      <div className="h-4 w-24 bg-slate-800 rounded mb-3" />
      <div className="h-8 w-32 bg-slate-800 rounded mb-2" />
      <div className="h-3 w-20 bg-slate-800 rounded" />
    </div>
  )
}

function SkeletonChart() {
  return (
    <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 animate-pulse">
      <div className="h-5 w-40 bg-slate-800 rounded mb-6" />
      <div className="flex items-end gap-2 h-[220px]">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex-1 bg-slate-800 rounded-t" style={{ height: `${30 + Math.random() * 70}%` }} />
        ))}
      </div>
    </div>
  )
}

function SkeletonList() {
  return (
    <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 animate-pulse space-y-4">
      <div className="h-5 w-48 bg-slate-800 rounded" />
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-800 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-32 bg-slate-800 rounded" />
            <div className="h-3 w-24 bg-slate-800 rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}

const CustomTooltipFaturamento = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 shadow-xl">
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      <p className="text-sm font-semibold text-emerald-400">{formatCurrency(payload[0].value)}</p>
    </div>
  )
}

const CustomTooltipServicos = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 shadow-xl">
      <p className="text-sm font-semibold text-slate-200">{d.nome}</p>
      <p className="text-xs text-slate-400">{d.quantidade} atendimentos ({d.percentual}%)</p>
    </div>
  )
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Section A
  const [atendimentosHojeCount, setAtendimentosHojeCount] = useState(0)

  // Section B - KPIs
  const [faturamentoMes, setFaturamentoMes] = useState(0)
  const [faturamentoMesAnterior, setFaturamentoMesAnterior] = useState(0)
  const [atendimentosMes, setAtendimentosMes] = useState(0)
  const [ticketMedio, setTicketMedio] = useState(0)
  const [agendados7Dias, setAgendados7Dias] = useState(0)

  // Section C
  const [faturamentoDiario, setFaturamentoDiario] = useState([])

  // Section D
  const [servicosMaisVendidos, setServicosMaisVendidos] = useState([])

  // Section E
  const [proximosAtendimentos, setProximosAtendimentos] = useState([])

  // Section F
  const [formasPagamento, setFormasPagamento] = useState([])

  useEffect(() => { loadAllData() }, [])

  async function loadAllData() {
    setRefreshing(true)
    try {
      await Promise.allSettled([
        fetchAtendimentosHoje(),
        fetchFaturamentoMes(),
        fetchFaturamentoMesAnterior(),
        fetchAtendimentosMes(),
        fetchAgendados7Dias(),
        fetchFaturamentoDiario(),
        fetchServicosMaisVendidos(),
        fetchProximosAtendimentos(),
        fetchFormasPagamento(),
      ])
    } catch (err) {
      console.error('Erro ao carregar dados:', err)
    }
    setLoading(false)
    setRefreshing(false)
  }

  async function fetchAtendimentosHoje() {
    try {
      const today = getLocalDateISO()
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const tomorrowStr = getLocalDateISO(tomorrow)
      const { count, error } = await supabase
        .from('atendimentos')
        .select('*', { count: 'exact', head: true })
        .gte('data_hora', today)
        .lt('data_hora', tomorrowStr)
      if (!error) setAtendimentosHojeCount(count || 0)
    } catch (err) { console.error('fetchAtendimentosHoje:', err) }
  }

  async function fetchFaturamentoMes() {
    try {
      const { start, end } = getMonthRange()
      const { data, error } = await supabase
        .from('atendimentos')
        .select('valor')
        .eq('status', 'concluido')
        .gte('data_hora', start)
        .lte('data_hora', end + 'T23:59:59')
      if (!error) {
        const total = (data || []).reduce((s, a) => s + (parseFloat(a.valor) || 0), 0)
        setFaturamentoMes(total)
      }
    } catch (err) { console.error('fetchFaturamentoMes:', err) }
  }

  async function fetchFaturamentoMesAnterior() {
    try {
      const { start, end } = getPrevMonthRange()
      const { data, error } = await supabase
        .from('atendimentos')
        .select('valor')
        .eq('status', 'concluido')
        .gte('data_hora', start)
        .lte('data_hora', end + 'T23:59:59')
      if (!error) {
        const total = (data || []).reduce((s, a) => s + (parseFloat(a.valor) || 0), 0)
        setFaturamentoMesAnterior(total)
      }
    } catch (err) { console.error('fetchFaturamentoMesAnterior:', err) }
  }

  async function fetchAtendimentosMes() {
    try {
      const { start, end } = getMonthRange()
      const { count, error } = await supabase
        .from('atendimentos')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'concluido')
        .gte('data_hora', start)
        .lte('data_hora', end + 'T23:59:59')
      if (!error) setAtendimentosMes(count || 0)
    } catch (err) { console.error('fetchAtendimentosMes:', err) }
  }

  async function fetchAgendados7Dias() {
    try {
      const { start, end } = getNext7DaysRange()
      const { count, error } = await supabase
        .from('atendimentos')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'agendado')
        .gte('data_hora', start)
        .lte('data_hora', end + 'T23:59:59')
      if (!error) setAgendados7Dias(count || 0)
    } catch (err) { console.error('fetchAgendados7Dias:', err) }
  }

  async function fetchFaturamentoDiario() {
    try {
      const { start, end } = getLast30DaysRange()
      const { data, error } = await supabase
        .from('atendimentos')
        .select('data_hora, valor')
        .eq('status', 'concluido')
        .gte('data_hora', start)
        .lte('data_hora', end + 'T23:59:59')
      if (error || !data) return

      const byDay = {}
      for (const r of data) {
        const dayKey = r.data_hora?.slice(0, 10)
        if (!dayKey) continue
        byDay[dayKey] = (byDay[dayKey] || 0) + (parseFloat(r.valor) || 0)
      }

      const chart = []
      const cursor = new Date(start + 'T00:00:00')
      const endDate = new Date(end + 'T00:00:00')
      while (cursor < endDate) {
        const key = getLocalDateISO(cursor)
        const label = String(cursor.getDate()).padStart(2, '0')
        chart.push({ dia: label, valor: byDay[key] || 0 })
        cursor.setDate(cursor.getDate() + 1)
      }
      setFaturamentoDiario(chart)
    } catch (err) { console.error('fetchFaturamentoDiario:', err) }
  }

  async function fetchServicosMaisVendidos() {
    try {
      const { start, end } = getMonthRange()
      const { data, error } = await supabase
        .from('atendimentos')
        .select('servico_id, servicos:servico_id(nome)')
        .eq('status', 'concluido')
        .gte('data_hora', start)
        .lte('data_hora', end + 'T23:59:59')
      if (error || !data) return

      const byServico = {}
      let totalAtend = 0
      for (const r of data) {
        const nome = r.servicos?.nome || 'Outro'
        byServico[nome] = (byServico[nome] || 0) + 1
        totalAtend++
      }

      const sorted = Object.entries(byServico)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([nome, quantidade]) => ({
          nome,
          quantidade,
          percentual: totalAtend > 0 ? Math.round((quantidade / totalAtend) * 100) : 0,
        }))

      setServicosMaisVendidos(sorted)
    } catch (err) { console.error('fetchServicosMaisVendidos:', err) }
  }

  async function fetchProximosAtendimentos() {
    try {
      const now = new Date()
      const nowStr = now.toISOString()
      const { data, error } = await supabase
        .from('atendimentos')
        .select('*, pet:pet_id(nome, raca), cliente:cliente_id(nome), servico:servico_id(nome)')
        .gte('data_hora', nowStr)
        .order('data_hora', { ascending: true })
        .limit(5)
      if (!error) setProximosAtendimentos(data || [])
    } catch (err) { console.error('fetchProximosAtendimentos:', err) }
  }

  async function fetchFormasPagamento() {
    try {
      const { start, end } = getMonthRange()
      const { data, error } = await supabase
        .from('atendimentos')
        .select('forma_pagamento, valor')
        .eq('status', 'concluido')
        .gte('data_hora', start)
        .lte('data_hora', end + 'T23:59:59')
      if (error || !data) return

      const byForma = {}
      let total = 0
      for (const r of data) {
        const key = r.forma_pagamento || 'outro'
        const val = parseFloat(r.valor) || 0
        byForma[key] = (byForma[key] || 0) + val
        total += val
      }

      const order = ['pix', 'cartao_debito', 'cartao_credito', 'dinheiro', 'permuta']
      const result = order
        .filter((k) => byForma[k] > 0)
        .map((key) => ({
          name: FORMA_PAGAMENTO_LABEL[key] || key,
          value: byForma[key],
          percentual: total > 0 ? Math.round((byForma[key] / total) * 100) : 0,
          key,
        }))

      Object.keys(byForma).forEach((key) => {
        if (!order.includes(key) && byForma[key] > 0) {
          result.push({
            name: key,
            value: byForma[key],
            percentual: total > 0 ? Math.round((byForma[key] / total) * 100) : 0,
            key,
          })
        }
      })

      setFormasPagamento(result)
    } catch (err) { console.error('fetchFormasPagamento:', err) }
  }

  // Derived KPI values
  const comparativoFaturamento = useMemo(() => {
    if (faturamentoMesAnterior === 0) return null
    const pct = ((faturamentoMes - faturamentoMesAnterior) / faturamentoMesAnterior) * 100
    return pct >= 0 ? `+${pct.toFixed(0)}%` : `${pct.toFixed(0)}%`
  }, [faturamentoMes, faturamentoMesAnterior])

  const mediaDiaria = useMemo(() => {
    if (atendimentosMes === 0) return 0
    const today = new Date()
    const dayOfMonth = today.getDate()
    const currentYear = today.getFullYear()
    const currentMonth = today.getMonth()
    let uteis = 0
    for (let d = 1; d <= dayOfMonth; d++) {
      const dow = new Date(currentYear, currentMonth, d).getDay()
      if (dow !== 0 && dow !== 6) uteis++
    }
    return uteis > 0 ? Math.round(atendimentosMes / uteis) : 0
  }, [atendimentosMes])

  const greeting = getGreeting()
  const dateDisplay = getDateDisplay()

  return (
    <div className="min-h-screen bg-slate-950 -m-4 sm:-m-6 p-4 sm:p-6 space-y-6">
      {/* ====== SECTION A — Header ====== */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between transition-opacity duration-500">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-100">
            {greeting.text} {greeting.emoji}
          </h1>
          <p className="mt-1 text-sm text-slate-500">{dateDisplay}</p>
        </div>
        <div className="flex items-center gap-3">
          {atendimentosHojeCount > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 px-3 py-1 text-xs font-medium text-violet-400">
              <CalendarClock className="w-3.5 h-3.5" />
              {atendimentosHojeCount} atendimento{atendimentosHojeCount > 1 ? 's' : ''} hoje
            </span>
          )}
          <button
            onClick={loadAllData}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            Atualizar
          </button>
        </div>
      </div>

      {/* ====== SECTION B — KPI Cards ====== */}
      {loading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {/* Card 1 — Faturamento do Mes */}
          <div className="rounded-xl bg-gradient-to-br from-emerald-950 to-slate-900 border border-emerald-900/50 p-5 transition-all duration-500 hover:border-emerald-700/50">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              </div>
              <span className="text-xs font-medium text-slate-500">Faturamento do Mes</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-slate-100">{formatCurrency(faturamentoMes)}</p>
            {comparativoFaturamento && (
              <p className={`mt-1 text-xs font-medium ${comparativoFaturamento.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>
                {comparativoFaturamento.startsWith('+') ? <TrendingUp className="inline w-3 h-3 mr-0.5" /> : <TrendingUp className="inline w-3 h-3 mr-0.5 rotate-180" />}
                {comparativoFaturamento} vs mes anterior
              </p>
            )}
          </div>

          {/* Card 2 — Atendimentos do Mes */}
          <div className="rounded-xl bg-gradient-to-br from-violet-950 to-slate-900 border border-violet-900/50 p-5 transition-all duration-500 hover:border-violet-700/50">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/10">
                <Scissors className="w-5 h-5 text-violet-400" />
              </div>
              <span className="text-xs font-medium text-slate-500">Atendimentos do Mes</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-slate-100">{atendimentosMes}</p>
            <p className="mt-1 text-xs font-medium text-slate-500">
              ~{mediaDiaria} por dia
            </p>
          </div>

          {/* Card 3 — Ticket Medio */}
          <div className="rounded-xl bg-gradient-to-br from-amber-950 to-slate-900 border border-amber-900/50 p-5 transition-all duration-500 hover:border-amber-700/50">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10">
                <Receipt className="w-5 h-5 text-amber-400" />
              </div>
              <span className="text-xs font-medium text-slate-500">Ticket Medio</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-slate-100">
              {formatCurrency(atendimentosMes > 0 ? faturamentoMes / atendimentosMes : 0)}
            </p>
          </div>

          {/* Card 4 — Agendados proximos 7 dias */}
          <div className="rounded-xl bg-gradient-to-br from-blue-950 to-slate-900 border border-blue-900/50 p-5 transition-all duration-500 hover:border-blue-700/50">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10">
                <CalendarClock className="w-5 h-5 text-blue-400" />
              </div>
              <span className="text-xs font-medium text-slate-500">Agendados (7 dias)</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-slate-100">{agendados7Dias}</p>
          </div>
        </div>
      )}

      {/* ====== SECTION C — Grafico Faturamento Diario ====== */}
      {loading ? (
        <SkeletonChart />
      ) : (
        <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 transition-all duration-500">
          <h2 className="text-base font-semibold text-slate-200 mb-4">Faturamento Diario (30 dias)</h2>
          {faturamentoDiario.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={faturamentoDiario} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradFaturamento" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="dia" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={formatTickK} />
                <Tooltip content={<CustomTooltipFaturamento />} />
                <Area type="monotone" dataKey="valor" stroke="#10b981" strokeWidth={2} fill="url(#gradFaturamento)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-[220px] text-slate-600">
              <TrendingUp className="w-10 h-10 mb-2" />
              <p className="text-sm">Sem dados no periodo</p>
            </div>
          )}
        </div>
      )}

      {/* ====== SECTION D — Servicos Mais Vendidos ====== */}
      {loading ? (
        <SkeletonChart />
      ) : (
        <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 transition-all duration-500">
          <h2 className="text-base font-semibold text-slate-200 mb-4">Servicos Mais Vendidos</h2>
          {servicosMaisVendidos.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Horizontal BarChart */}
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={servicosMaisVendidos} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis type="category" dataKey="nome" width={100} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <Tooltip content={<CustomTooltipServicos />} />
                  <Bar dataKey="quantidade" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={18} />
                </BarChart>
              </ResponsiveContainer>
              {/* Top 3 ranking */}
              <div className="flex flex-col justify-center gap-3">
                {servicosMaisVendidos.slice(0, 3).map((s, i) => {
                  const medals = ['text-amber-400', 'text-slate-400', 'text-amber-700']
                  return (
                    <div key={s.nome} className="flex items-center gap-3">
                      <span className={`text-lg font-bold ${medals[i]}`}>
                        {i + 1}º
                      </span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-200">{s.nome}</p>
                        <p className="text-xs text-slate-500">{s.quantidade} atendimentos — {s.percentual}%</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[200px] text-slate-600">
              <Scissors className="w-10 h-10 mb-2" />
              <p className="text-sm">Sem dados no periodo</p>
            </div>
          )}
        </div>
      )}

      {/* ====== SECTION E — Proximos Atendimentos ====== */}
      {loading ? (
        <SkeletonList />
      ) : (
        <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 transition-all duration-500">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-200">Proximos Atendimentos</h2>
            <Link
              to="/atendimentos"
              className="text-xs font-medium text-violet-400 hover:text-violet-300 transition-colors"
            >
              Ver todos
            </Link>
          </div>
          {proximosAtendimentos.length > 0 ? (
            <div className="space-y-3">
              {proximosAtendimentos.map((a) => {
                const d = new Date(a.data_hora)
                const hours = String(d.getHours()).padStart(2, '0')
                const minutes = String(d.getMinutes()).padStart(2, '0')
                return (
                  <div
                    key={a.id}
                    className="flex items-center gap-3 rounded-lg bg-slate-800/50 border border-slate-700/50 p-3 hover:bg-slate-800 transition-colors"
                  >
                    <span className="text-lg mr-1">🐾</span>
                    <span className="text-sm font-mono font-semibold text-slate-300 w-12 shrink-0">
                      {hours}:{minutes}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-200 truncate">
                        {a.pet?.nome || '—'}
                        {a.pet?.raca ? <span className="text-slate-500 font-normal"> · {a.pet.raca}</span> : ''}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {a.cliente?.nome || '—'} · {a.servico?.nome || '—'}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-slate-300 shrink-0">{formatCurrency(a.valor)}</span>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium shrink-0 ${STATUS_BADGE_DARK[a.status] || STATUS_BADGE_DARK.agendado}`}>
                      {STATUS_LABEL[a.status] || a.status}
                    </span>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-slate-600">
              <Clock className="w-10 h-10 mb-2" />
              <p className="text-sm">Nenhum atendimento agendado</p>
            </div>
          )}
        </div>
      )}

      {/* ====== SECTION F — Formas de Pagamento ====== */}
      {loading ? (
        <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 animate-pulse">
          <div className="h-5 w-44 bg-slate-800 rounded mb-6" />
          <div className="flex items-center justify-center h-[200px] bg-slate-800 rounded-lg" />
        </div>
      ) : (
        <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 transition-all duration-500">
          <h2 className="text-base font-semibold text-slate-200 mb-4">Formas de Pagamento</h2>
          {formasPagamento.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Donut Chart */}
              <div className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={formasPagamento}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                    >
                      {formasPagamento.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => formatCurrency(value)}
                      contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#e2e8f0' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {/* Legenda lateral */}
              <div className="flex flex-col justify-center gap-3">
                {formasPagamento.map((f, i) => {
                  const IconComp = FORMA_PAGAMENTO_ICON[f.key] || Banknote
                  return (
                    <div key={f.key} className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <IconComp className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="text-sm text-slate-300 flex-1">{f.name}</span>
                      <span className="text-xs text-slate-500">{f.percentual}%</span>
                      <span className="text-sm font-semibold text-slate-200 shrink-0">{formatCurrency(f.value)}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-slate-600">
              <CreditCard className="w-10 h-10 mb-2" />
              <p className="text-sm">Sem dados no periodo</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
