import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getLocalDateISO } from '../lib/dates'
import {
  TrendingUp,
  Scissors,
  Receipt,
  CalendarClock,
  CalendarOff,
  Clock,
  RefreshCw,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

const STATUS_BADGE_DARK = {
  agendado: 'bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/30',
  em_andamento: 'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30',
  concluido: 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30',
  cancelado: 'bg-gray-500/15 text-gray-400 ring-1 ring-gray-500/30',
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

const DOT_COLORS = {
  pix: '#A78BFA',
  cartao_credito: '#34D399',
  cartao_debito: '#60A5FA',
  dinheiro: '#FCD34D',
  permuta: '#F87171',
}

const RANKING_COLORS = ['text-amber-400', 'text-gray-400', 'text-amber-600', 'text-gray-600', 'text-gray-600']

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
    <div className="rounded-2xl bg-[#111827] border border-[#1F2937] p-5 animate-pulse">
      <div className="h-3 w-20 bg-[#1F2937] rounded mb-4" />
      <div className="h-8 w-28 bg-[#1F2937] rounded mb-2" />
      <div className="h-3 w-16 bg-[#1F2937] rounded" />
    </div>
  )
}

function SkeletonChart() {
  return (
    <div className="rounded-2xl bg-[#111827] border border-[#1F2937] p-5 animate-pulse">
      <div className="h-4 w-48 bg-[#1F2937] rounded mb-6" />
      <div className="flex items-end gap-2 h-[180px]">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex-1 bg-[#1F2937] rounded-t" style={{ height: `${30 + Math.random() * 70}%` }} />
        ))}
      </div>
    </div>
  )
}

function SkeletonList() {
  return (
    <div className="rounded-2xl bg-[#111827] border border-[#1F2937] p-5 animate-pulse space-y-4">
      <div className="h-4 w-44 bg-[#1F2937] rounded" />
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#1F2937] rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-32 bg-[#1F2937] rounded" />
            <div className="h-3 w-24 bg-[#1F2937] rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}

const CustomTooltipFaturamento = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#1F2937] border border-[#374151] rounded-lg px-3 py-2 shadow-xl">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className="text-sm font-semibold text-white">{formatCurrency(payload[0].value)}</p>
    </div>
  )
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const [atendimentosHojeCount, setAtendimentosHojeCount] = useState(0)
  const [faturamentoMes, setFaturamentoMes] = useState(0)
  const [faturamentoMesAnterior, setFaturamentoMesAnterior] = useState(0)
  const [atendimentosMes, setAtendimentosMes] = useState(0)
  const [ticketMedio, setTicketMedio] = useState(0)
  const [agendados7Dias, setAgendados7Dias] = useState(0)
  const [faturamentoDiario, setFaturamentoDiario] = useState([])
  const [servicosMaisVendidos, setServicosMaisVendidos] = useState([])
  const [proximosAtendimentos, setProximosAtendimentos] = useState([])
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

  const totalPagamentos = useMemo(
    () => formasPagamento.reduce((s, f) => s + f.value, 0),
    [formasPagamento]
  )

  const maxServicoQtd = useMemo(
    () => servicosMaisVendidos.length > 0 ? servicosMaisVendidos[0].quantidade : 1,
    [servicosMaisVendidos]
  )

  const greeting = getGreeting()
  const dateDisplay = getDateDisplay()

  return (
    <div className="min-h-screen bg-[#0B0F1A] -m-4 sm:-m-6 px-4 py-4 sm:px-6 sm:py-6 space-y-6">

      {/* ━━━ SECTION 1 — HEADER ━━━ */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            {greeting.text} {greeting.emoji}
          </h1>
          <p className="mt-1 text-sm text-gray-400">{dateDisplay}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 bg-violet-900/50 text-violet-300 border border-violet-700 text-xs px-3 py-1 rounded-full">
            <CalendarClock className="w-3.5 h-3.5" />
            {atendimentosHojeCount} atendimento{atendimentosHojeCount !== 1 ? 's' : ''} hoje
          </span>
          <button
            onClick={loadAllData}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-lg bg-[#111827] border border-[#1F2937] px-3 py-2 text-sm font-medium text-gray-400 hover:text-white hover:border-[#374151] transition-colors disabled:opacity-50"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            Atualizar
          </button>
        </div>
      </div>

      {/* ━━━ SECTION 2 — KPI CARDS ━━━ */}
      {loading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {/* Card 1 — Faturamento do Mes */}
          <div className="relative rounded-2xl bg-gradient-to-br from-emerald-950 to-[#0B1A14] border border-emerald-900 p-5 overflow-hidden">
            <TrendingUp className="absolute right-4 top-4 text-4xl text-emerald-400 opacity-10" />
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[10px] tracking-widest uppercase text-emerald-400 font-medium">Faturamento do Mes</span>
            </div>
            <p className="text-3xl font-medium text-white">{formatCurrency(faturamentoMes)}</p>
            {comparativoFaturamento && (
              <p className={`mt-1 text-xs ${comparativoFaturamento.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>
                {comparativoFaturamento.startsWith('+') ? '↑' : '↓'} {comparativoFaturamento} vs mes anterior
              </p>
            )}
          </div>

          {/* Card 2 — Atendimentos do Mes */}
          <div className="relative rounded-2xl bg-gradient-to-br from-violet-950 to-[#110C2E] border border-violet-900 p-5 overflow-hidden">
            <Scissors className="absolute right-4 top-4 text-4xl text-violet-400 opacity-10" />
            <div className="flex items-center gap-2 mb-3">
              <Scissors className="w-3.5 h-3.5 text-violet-400" />
              <span className="text-[10px] tracking-widest uppercase text-violet-400 font-medium">Atendimentos do Mes</span>
            </div>
            <p className="text-3xl font-medium text-white">{atendimentosMes}</p>
            <p className="mt-1 text-xs text-violet-400">~{mediaDiaria} por dia util</p>
          </div>

          {/* Card 3 — Ticket Medio */}
          <div className="relative rounded-2xl bg-gradient-to-br from-amber-950 to-[#1C1100] border border-amber-900 p-5 overflow-hidden">
            <Receipt className="absolute right-4 top-4 text-4xl text-amber-400 opacity-10" />
            <div className="flex items-center gap-2 mb-3">
              <Receipt className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[10px] tracking-widest uppercase text-amber-400 font-medium">Ticket Medio</span>
            </div>
            <p className="text-3xl font-medium text-white">
              {formatCurrency(atendimentosMes > 0 ? faturamentoMes / atendimentosMes : 0)}
            </p>
            <p className="mt-1 text-xs text-amber-400">por atendimento</p>
          </div>

          {/* Card 4 — Agendados 7 dias */}
          <div className="relative rounded-2xl bg-gradient-to-br from-blue-950 to-[#060F1C] border border-blue-900 p-5 overflow-hidden">
            <CalendarClock className="absolute right-4 top-4 text-4xl text-blue-400 opacity-10" />
            <div className="flex items-center gap-2 mb-3">
              <CalendarClock className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-[10px] tracking-widest uppercase text-blue-400 font-medium">Agendados (7 dias)</span>
            </div>
            <p className="text-3xl font-medium text-white">{agendados7Dias}</p>
            <p className="mt-1 text-xs text-blue-400">proximos 7 dias</p>
          </div>
        </div>
      )}

      {/* ━━━ SECTION 3 — GRAFICO FATURAMENTO DIARIO ━━━ */}
      {loading ? (
        <SkeletonChart />
      ) : (
        <div className="rounded-2xl bg-[#111827] border border-[#1F2937] p-5">
          <h2 className="text-xs uppercase tracking-wider text-gray-400 mb-4">
            Faturamento diario — ultimos 30 dias
          </h2>
          {faturamentoDiario.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={faturamentoDiario} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradFaturamento" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34D399" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#34D399" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
                <XAxis dataKey="dia" tick={{ fontSize: 11, fill: '#4B5563' }} />
                <YAxis tick={{ fontSize: 11, fill: '#4B5563' }} tickFormatter={formatTickK} />
                <Tooltip content={<CustomTooltipFaturamento />} />
                <Area type="monotone" dataKey="valor" stroke="#34D399" strokeWidth={2} fill="url(#gradFaturamento)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-[180px] text-gray-600">
              <TrendingUp className="w-10 h-10 mb-2" />
              <p className="text-sm">Sem dados no periodo</p>
            </div>
          )}
        </div>
      )}

      {/* ━━━ SECTION 4 — SERVICOS + PAGAMENTOS ━━━ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Servicos mais vendidos */}
        {loading ? (
          <SkeletonList />
        ) : (
          <div className="rounded-2xl bg-[#111827] border border-[#1F2937] p-5">
            <h2 className="text-xs uppercase tracking-wider text-gray-400 mb-4">
              Servicos mais vendidos
            </h2>
            {servicosMaisVendidos.length > 0 ? (
              <div className="space-y-3">
                {servicosMaisVendidos.map((s, i) => (
                  <div key={s.nome}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`text-sm font-bold ${RANKING_COLORS[i]}`}>{i + 1}°</span>
                        <span className="text-sm text-white font-medium truncate">{s.nome}</span>
                      </div>
                      <span className="text-xs text-gray-500 shrink-0 ml-2">
                        {s.quantidade} · {s.percentual}%
                      </span>
                    </div>
                    <div className="h-1 rounded bg-[#1F2937] overflow-hidden">
                      <div
                        className="h-full rounded bg-violet-500"
                        style={{ width: `${(s.quantidade / maxServicoQtd) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center min-h-[140px] text-gray-600">
                <Scissors className="w-10 h-10 mb-2" />
                <p className="text-sm">Sem dados no periodo</p>
              </div>
            )}
          </div>
        )}

        {/* Formas de pagamento */}
        {loading ? (
          <div className="rounded-2xl bg-[#111827] border border-[#1F2937] p-5 animate-pulse">
            <div className="h-4 w-40 bg-[#1F2937] rounded mb-6" />
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-4 bg-[#1F2937] rounded" />
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl bg-[#111827] border border-[#1F2937] p-5">
            <h2 className="text-xs uppercase tracking-wider text-gray-400 mb-4">
              Formas de pagamento
            </h2>
            {formasPagamento.length > 0 ? (
              <>
                <div className="divide-y divide-[#1F2937]">
                  {formasPagamento.map((f) => (
                    <div key={f.key} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: DOT_COLORS[f.key] || '#6B7280' }}
                        />
                        <span className="text-sm text-white truncate">{f.name}</span>
                        <span className="text-xs text-gray-500">{f.percentual}%</span>
                      </div>
                      <span className="text-sm text-white shrink-0 ml-2">{formatCurrency(f.value)}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-3 border-t border-[#1F2937] flex justify-between">
                  <span className="text-sm text-white font-medium">Total</span>
                  <span className="text-sm text-white font-medium">{formatCurrency(totalPagamentos)}</span>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center min-h-[140px] text-gray-600">
                <Receipt className="w-10 h-10 mb-2" />
                <p className="text-sm">Sem dados no periodo</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ━━━ SECTION 5 — PROXIMOS ATENDIMENTOS ━━━ */}
      {loading ? (
        <SkeletonList />
      ) : (
        <div className="rounded-2xl bg-[#111827] border border-[#1F2937] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs uppercase tracking-wider text-gray-400">
              Proximos atendimentos
            </h2>
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
                    className="flex items-center gap-3 rounded-lg bg-[#0B0F1A] border border-[#1F2937] p-3 hover:border-[#374151] transition-colors"
                  >
                    <span className="text-sm font-mono font-medium text-violet-400 w-12 shrink-0">
                      {hours}:{minutes}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {a.pet?.nome || '—'}
                        {a.pet?.raca ? <span className="text-gray-400 font-normal"> · {a.pet.raca}</span> : ''}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {a.cliente?.nome || '—'} · {a.servico?.nome || '—'}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-emerald-400 shrink-0">{formatCurrency(a.valor)}</span>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium shrink-0 ${STATUS_BADGE_DARK[a.status] || STATUS_BADGE_DARK.agendado}`}>
                      {STATUS_LABEL[a.status] || a.status}
                    </span>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="min-h-[140px] flex flex-col items-center justify-center text-gray-600">
              <CalendarOff className="w-10 h-10 mb-2 text-gray-700" />
              <p className="text-sm text-gray-500">Nenhum agendamento nos proximos 7 dias</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
