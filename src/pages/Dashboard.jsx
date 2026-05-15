import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { formatDate, formatDateTime, formatTime, getLocalDateISO } from '../lib/dates'
import {
  Users,
  PawPrint,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  RefreshCw,
  AlertTriangle,
  Percent,
  Landmark,
  CreditCard,
  Banknote,
  Store,
  ArrowLeftRight,
  ShoppingBag,
  Wrench,
  Zap,
  Droplets,
  Scissors,
  Receipt,
  Home,
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts'

const STATUS_BADGE = {
  agendado: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  em_andamento: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  concluido: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  cancelado: 'bg-gray-50 text-gray-500 ring-gray-500/20',
}

const STATUS_LABEL = {
  agendado: 'Agendado',
  em_andamento: 'Em Andamento',
  concluido: 'Concluido',
  cancelado: 'Cancelado',
}

const FORMA_PAGAMENTO_LABEL = {
  dinheiro: 'Dinheiro',
  cartao_credito: 'Cartao de Credito',
  cartao_debito: 'Cartao de Debito',
  pix: 'Pix',
  permuta: 'Permuta',
}

const FORMA_PAGAMENTO_ICON = {
  dinheiro: Banknote,
  cartao_credito: CreditCard,
  cartao_debito: CreditCard,
  pix: Zap,
  permuta: ArrowLeftRight,
}

const FORMA_PAGAMENTO_COLOR = {
  dinheiro: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', bar: 'bg-green-500', icon: 'text-green-600' },
  cartao_credito: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', bar: 'bg-blue-500', icon: 'text-blue-600' },
  cartao_debito: { bg: 'bg-sky-50', border: 'border-sky-200', text: 'text-sky-700', bar: 'bg-sky-500', icon: 'text-sky-600' },
  pix: { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700', bar: 'bg-violet-500', icon: 'text-violet-600' },
  permuta: { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', bar: 'bg-rose-500', icon: 'text-rose-600' },
}

const GRUPO_LABEL = {
  'Servicos': 'Servicos',
  'Despesas Fixas': 'Despesas Fixas',
  'Custo de Consumo': 'Custo de Consumo',
  'Custo de Descartaveis': 'Custo de Descartaveis',
  'Comissoes': 'Comissoes',
  'Despesas Variaveis': 'Despesas Variaveis',
  'Taxas de Cartao': 'Taxas de Cartao',
  'Manutencao': 'Manutencao',
}

const GRUPO_ICON = {
  'Servicos': Scissors,
  'Despesas Fixas': Home,
  'Custo de Consumo': Droplets,
  'Custo de Descartaveis': ShoppingBag,
  'Comissoes': Percent,
  'Despesas Variaveis': ShoppingBag,
  'Taxas de Cartao': Receipt,
  'Manutencao': Wrench,
}

const GRUPO_COLOR = {
  'Servicos': { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', bar: 'bg-emerald-500', icon: 'text-emerald-500' },
  'Despesas Fixas': { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', bar: 'bg-red-500', icon: 'text-red-500' },
  'Custo de Consumo': { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', bar: 'bg-orange-500', icon: 'text-orange-500' },
  'Custo de Descartaveis': { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', bar: 'bg-yellow-500', icon: 'text-yellow-500' },
  'Comissoes': { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', bar: 'bg-purple-500', icon: 'text-purple-500' },
  'Despesas Variaveis': { bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-700', bar: 'bg-pink-500', icon: 'text-pink-500' },
  'Taxas de Cartao': { bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-700', bar: 'bg-teal-500', icon: 'text-teal-500' },
  'Manutencao': { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-700', bar: 'bg-slate-500', icon: 'text-slate-500' },
}

const COMISSAO_RATE = 0.4
const MONTH_NAMES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

function formatCurrency(value) {
  if (value == null) return 'R$ 0,00'
  const num = parseFloat(value)
  if (isNaN(num)) return 'R$ 0,00'
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatTickK(v) {
  if (v >= 1000) return `${(v / 1000).toFixed(0)}k`
  return `${v}`
}

function formatBarLabel(value) {
  if (value == null) return '0'
  return Math.round(parseFloat(value)).toLocaleString('pt-BR')
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

function Spinner({ className = 'h-8 w-8' }) {
  return (
    <div className="flex items-center justify-center py-10">
      <div className={`animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600 ${className}`} />
    </div>
  )
}

export default function Dashboard() {
  const [totalClientes, setTotalClientes] = useState(null)
  const [totalPets, setTotalPets] = useState(null)
  const [atendimentosHoje, setAtendimentosHoje] = useState(null)
  const [atendimentosHojeList, setAtendimentosHojeList] = useState([])
  const [ultimosAtendimentos, setUltimosAtendimentos] = useState([])
  const [inadimplencia, setInadimplencia] = useState([])
  const [entradasPorForma, setEntradasPorForma] = useState({})
  const [saidasPorGrupo, setSaidasPorGrupo] = useState({})
  const [financeiroMes, setFinanceiroMes] = useState({ entradas: 0, saidas: 0 })
  const [comissoesMes, setComissoesMes] = useState(0)
  const [atendimentosMes, setAtendimentosMes] = useState(0)
  const [dadosMensais, setDadosMensais] = useState([])

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => { loadAllData() }, [])

  async function loadAllData() {
    setRefreshing(true)
    await Promise.all([
      fetchTotalClientes(),
      fetchTotalPets(),
      fetchAtendimentosHoje(),
      fetchUltimosAtendimentos(),
      fetchInadimplencia(),
      fetchEntradasPorForma(),
      fetchSaidasPorGrupo(),
      fetchFinanceiroMes(),
      fetchComissoesMes(),
      fetchAtendimentosMes(),
      fetchDadosMensais(),
    ])
    setRefreshing(false)
    setLoading(false)
  }

  async function fetchTotalClientes() {
    const { count, error } = await supabase.from('clientes').select('*', { count: 'exact', head: true })
    if (!error) setTotalClientes(count || 0)
  }

  async function fetchTotalPets() {
    const { count, error } = await supabase.from('pets').select('*', { count: 'exact', head: true })
    if (!error) setTotalPets(count || 0)
  }

  async function fetchAtendimentosHoje() {
    const today = getLocalDateISO()
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStr = getLocalDateISO(tomorrow)

    const { data, error } = await supabase
      .from('atendimentos')
      .select('*, pet:pet_id(id, nome), cliente:cliente_id(id, nome), servico:servico_id(id, nome)')
      .gte('data_hora', today)
      .lt('data_hora', tomorrowStr)
      .order('data_hora', { ascending: true })

    if (!error) {
      setAtendimentosHojeList(data || [])
      setAtendimentosHoje((data || []).length)
    }
  }

  async function fetchUltimosAtendimentos() {
    const { data, error } = await supabase
      .from('atendimentos')
      .select('*, pet:pet_id(id, nome), cliente:cliente_id(id, nome), servico:servico_id(id, nome)')
      .order('data_hora', { ascending: false })
      .limit(5)

    if (!error) setUltimosAtendimentos(data || [])
  }

  async function fetchInadimplencia() {
    const today = getLocalDateISO()
    const { data, error } = await supabase
      .from('atendimentos')
      .select('*, pet:pet_id(id, nome), cliente:cliente_id(id, nome), servico:servico_id(id, nome)')
      .in('status_pagamento', ['pendente', 'vencido'])
      .lt('data_vencimento', today)
      .order('data_vencimento', { ascending: true })

    if (!error) setInadimplencia(data || [])
  }

  async function fetchEntradasPorForma() {
    const { start, end } = getMonthRange()
    const { data, error } = await supabase
      .from('financeiro')
      .select('forma_pagamento, valor')
      .eq('tipo', 'entrada')
      .gte('data', start)
      .lte('data', end)

    if (!error) {
      const grouped = {}
      for (const r of data || []) {
        const key = r.forma_pagamento || 'outro'
        grouped[key] = (grouped[key] || 0) + (parseFloat(r.valor) || 0)
      }
      setEntradasPorForma(grouped)
    }
  }

  async function fetchSaidasPorGrupo() {
    const { start, end } = getMonthRange()
    const { data, error } = await supabase
      .from('financeiro')
      .select('grupo, valor')
      .eq('tipo', 'saida')
      .gte('data', start)
      .lte('data', end)

    if (!error) {
      const grouped = {}
      for (const r of data || []) {
        const key = r.grupo || 'Outros'
        grouped[key] = (grouped[key] || 0) + (parseFloat(r.valor) || 0)
      }
      setSaidasPorGrupo(grouped)
    }
  }

  async function fetchFinanceiroMes() {
    const { start, end } = getMonthRange()
    const { data, error } = await supabase
      .from('financeiro')
      .select('tipo, valor')
      .gte('data', start)
      .lte('data', end)

    if (!error) {
      const entradas = (data || []).filter(r => r.tipo === 'entrada').reduce((s, r) => s + (parseFloat(r.valor) || 0), 0)
      const saidas = (data || []).filter(r => r.tipo === 'saida').reduce((s, r) => s + (parseFloat(r.valor) || 0), 0)
      setFinanceiroMes({ entradas, saidas })
    }
  }

  async function fetchComissoesMes() {
    const { start, end } = getMonthRange()
    const { data, error } = await supabase
      .from('atendimentos')
      .select('valor')
      .eq('status', 'concluido')
      .gte('data_hora', start)
      .lte('data_hora', end + 'T23:59:59')

    if (!error) {
      const total = (data || []).reduce((s, a) => s + (parseFloat(a.valor) || 0) * COMISSAO_RATE, 0)
      setComissoesMes(total)
    }
  }

  async function fetchAtendimentosMes() {
    const { start, end } = getMonthRange()
    const { count, error } = await supabase
      .from('atendimentos')
      .select('*', { count: 'exact', head: true })
      .gte('data_hora', start)
      .lte('data_hora', end + 'T23:59:59')

    if (!error) setAtendimentosMes(count || 0)
  }

  async function fetchDadosMensais() {
    const currentYear = new Date().getFullYear()
    const { data, error } = await supabase
      .from('financeiro')
      .select('tipo, valor, data')
      .gte('data', currentYear + '-01-01')
      .lte('data', currentYear + '-12-31')

    if (error || !data || data.length === 0) return

    const byMonth = {}
    for (const r of data) {
      const m = parseInt(r.data?.split('-')[1] || '0', 10)
      if (m < 1 || m > 12) continue
      if (!byMonth[m]) byMonth[m] = { entradas: 0, saidas: 0 }
      const v = parseFloat(r.valor) || 0
      if (r.tipo === 'entrada') byMonth[m].entradas += v
      else if (r.tipo === 'saida') byMonth[m].saidas += v
    }

    const currentMonth = new Date().getMonth() + 1
    const meses = Object.keys(byMonth).sort((a, b) => a - b).filter(m => parseInt(m) <= currentMonth).map(m => ({
      mes: MONTH_NAMES[parseInt(m) - 1],
      entradas: byMonth[m].entradas,
      saidas: byMonth[m].saidas,
      lucro: byMonth[m].entradas - byMonth[m].saidas,
    }))
    setDadosMensais(meses)
  }

  const now = new Date()
  const monthName = now.toLocaleString('pt-BR', { month: 'long' })
  const year = now.getFullYear()

  const lucroMes = financeiroMes.entradas - financeiroMes.saidas

  const entradasTotal = useMemo(() => {
    return Object.values(entradasPorForma).reduce((s, v) => s + v, 0)
  }, [entradasPorForma])

  const entradasMax = useMemo(() => {
    const vals = Object.values(entradasPorForma)
    return vals.length > 0 ? Math.max(...vals, 1) : 1
  }, [entradasPorForma])

  const saidasTotal = useMemo(() => {
    return Object.values(saidasPorGrupo).reduce((s, v) => s + v, 0)
  }, [saidasPorGrupo])

  const saidasMax = useMemo(() => {
    const vals = Object.values(saidasPorGrupo)
    return vals.length > 0 ? Math.max(...vals, 1) : 1
  }, [saidasPorGrupo])

  const formaOrder = ['dinheiro', 'cartao_credito', 'cartao_debito', 'pix', 'permuta']
  const grupoOrder = ['Servicos', 'Despesas Fixas', 'Custo de Consumo', 'Custo de Descartaveis', 'Comissoes', 'Despesas Variaveis', 'Taxas de Cartao', 'Manutencao']

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Visao geral do petshop â€” {monthName} {year}
          </p>
        </div>
        <button
          onClick={loadAllData}
          disabled={refreshing}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          Atualizar
        </button>
      </div>

      {/* Inadimplencia Alert */}
      {inadimplencia.length > 0 && (
        <div className="rounded-xl border border-red-400 bg-gradient-to-r from-red-600 to-red-700 p-5 shadow-lg">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20">
              <AlertTriangle size={22} className="text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-white">
                Inadimplencia â€” {inadimplencia.length} pagamento{inadimplencia.length > 1 ? 's' : ''} vencido{inadimplencia.length > 1 ? 's' : ''}
              </h3>
              <p className="mt-0.5 text-sm text-red-100">
                Atendimentos com pagamentos vencidos que precisam de atencao.
              </p>
              <div className="mt-3 space-y-2">
                {inadimplencia.slice(0, 3).map((item) => (
                  <div key={item.id} className="flex flex-col gap-1 rounded-lg bg-white/15 px-4 py-2.5 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <span className="font-semibold text-white">{item.cliente?.nome || 'â€”'}</span>
                      <span className="mx-1 text-red-200">Â·</span>
                      <span className="text-red-100">{item.pet?.nome || 'â€”'}</span>
                      <span className="mx-1 text-red-200">Â·</span>
                      <span className="text-red-100">{item.servico?.nome || 'â€”'}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-white">{formatCurrency(item.valor)}</span>
                      <span className="text-xs text-red-200">Venc: {formatDate(item.data_vencimento)}</span>
                    </div>
                  </div>
                ))}
                {inadimplencia.length > 3 && (
                  <p className="text-sm text-red-100 italic">...e mais {inadimplencia.length - 3} item{inadimplencia.length - 3 > 1 ? 's' : ''}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====== TOP SUMMARY CARDS ====== */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5 sm:grid-cols-3">
        <div className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50 p-4 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"><TrendingUp size={20} /></div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-emerald-700">Entradas</p>
              <p className="mt-1 text-lg font-bold text-emerald-900 truncate">{formatCurrency(financeiroMes.entradas)}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-red-200 bg-gradient-to-br from-red-50 to-rose-50 p-4 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600"><TrendingDown size={20} /></div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-red-700">Saidas</p>
              <p className="mt-1 text-lg font-bold text-red-900 truncate">{formatCurrency(financeiroMes.saidas)}</p>
            </div>
          </div>
        </div>
        <div className={`rounded-xl border ${lucroMes >= 0 ? 'border-indigo-200 bg-gradient-to-br from-indigo-50 to-blue-50' : 'border-red-300 bg-gradient-to-br from-red-50 to-rose-50'} p-4 shadow-sm overflow-hidden`}>
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${lucroMes >= 0 ? 'bg-indigo-100 text-indigo-600' : 'bg-red-100 text-red-600'}`}>
              <DollarSign size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-600">Lucro</p>
              <p className={`mt-1 text-lg font-bold ${lucroMes >= 0 ? 'text-indigo-900' : 'text-red-700'} truncate`}>{formatCurrency(lucroMes)}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50 p-4 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600"><Percent size={20} /></div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-amber-700">Comissoes (40%)</p>
              <p className="mt-1 text-lg font-bold text-amber-900 truncate">{formatCurrency(comissoesMes)}</p>
            </div>
          </div>
        </div>
        <div className="col-span-2 lg:col-span-1 rounded-xl border border-purple-200 bg-gradient-to-br from-purple-50 to-fuchsia-50 p-4 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-600"><Calendar size={20} /></div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-purple-700">Atendimentos</p>
              <p className="mt-1 text-lg font-bold text-purple-900 truncate">{atendimentosMes}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ====== MAIN FINANCIAL BREAKDOWN ====== */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* ENTRADAS POR FORMA DE PAGAMENTO */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-4 sm:px-6 py-4">
            <div className="flex items-center gap-2">
              <TrendingUp size={20} className="text-emerald-600" />
              <h2 className="text-lg font-semibold text-gray-900">Entradas por Forma de Pagamento</h2>
            </div>
            <p className="mt-0.5 text-sm text-gray-500">{monthName} {year}</p>
          </div>
          <div className="p-4 sm:p-6 space-y-4">
            {formaOrder.map((key) => {
              const valor = entradasPorForma[key] || 0
              const label = FORMA_PAGAMENTO_LABEL[key] || key
              const colors = FORMA_PAGAMENTO_COLOR[key] || FORMA_PAGAMENTO_COLOR.loja
              const IconComp = FORMA_PAGAMENTO_ICON[key] || DollarSign
              const pct = entradasTotal > 0 ? (valor / entradasTotal) * 100 : 0
              const barPct = entradasMax > 0 ? (valor / entradasMax) * 100 : 0
              return (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className={`flex h-7 w-7 items-center justify-center rounded-full ${colors.bg} ${colors.icon}`}>
                        <IconComp size={14} />
                      </div>
                      <span className="text-sm font-medium text-gray-700">{label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">{pct.toFixed(1)}%</span>
                      <span className="text-sm font-bold text-gray-900">{formatCurrency(valor)}</span>
                    </div>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-gray-100">
                    <div
                      className={`h-2.5 rounded-full ${colors.bar} transition-all duration-500`}
                      style={{ width: `${Math.max(barPct, valor > 0 ? 2 : 0)}%` }}
                    />
                  </div>
                </div>
              )
            })}

            {Object.keys(entradasPorForma).length === 0 && (
              <div className="py-8 text-center">
                <TrendingUp size={32} className="mx-auto text-gray-300" />
                <p className="mt-2 text-sm text-gray-500">Nenhuma entrada registrada este mes.</p>
              </div>
            )}

            {/* Total */}
            <div className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-emerald-800">Total Entradas</span>
                <span className="text-lg font-bold text-emerald-900">{formatCurrency(entradasTotal)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* SAIDAS POR GRUPO */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-4 sm:px-6 py-4">
            <div className="flex items-center gap-2">
              <TrendingDown size={20} className="text-red-600" />
              <h2 className="text-lg font-semibold text-gray-900">Saidas por Grupo</h2>
            </div>
            <p className="mt-0.5 text-sm text-gray-500">{monthName} {year}</p>
          </div>
          <div className="p-4 sm:p-6 space-y-4">
            {grupoOrder.map((key) => {
              const valor = saidasPorGrupo[key] || 0
              const label = GRUPO_LABEL[key] || key
              const colors = GRUPO_COLOR[key] || GRUPO_COLOR['Manutencao']
              const IconComp = GRUPO_ICON[key] || DollarSign
              const pct = saidasTotal > 0 ? (valor / saidasTotal) * 100 : 0
              const barPct = saidasMax > 0 ? (valor / saidasMax) * 100 : 0
              return (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className={`flex h-7 w-7 items-center justify-center rounded-full ${colors.bg} ${colors.icon}`}>
                        <IconComp size={14} />
                      </div>
                      <span className="text-sm font-medium text-gray-700">{label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">{pct.toFixed(1)}%</span>
                      <span className="text-sm font-bold text-gray-900">{formatCurrency(valor)}</span>
                    </div>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-gray-100">
                    <div
                      className={`h-2.5 rounded-full ${colors.bar} transition-all duration-500`}
                      style={{ width: `${Math.max(barPct, valor > 0 ? 2 : 0)}%` }}
                    />
                  </div>
                </div>
              )
            })}

            {/* Show any groups not in the predefined order */}
            {Object.keys(saidasPorGrupo).filter(k => !grupoOrder.includes(k)).map((key) => {
              const valor = saidasPorGrupo[key] || 0
              const pct = saidasTotal > 0 ? (valor / saidasTotal) * 100 : 0
              const barPct = saidasMax > 0 ? (valor / saidasMax) * 100 : 0
              return (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-50 text-gray-500">
                        <DollarSign size={14} />
                      </div>
                      <span className="text-sm font-medium text-gray-700">{key}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">{pct.toFixed(1)}%</span>
                      <span className="text-sm font-bold text-gray-900">{formatCurrency(valor)}</span>
                    </div>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-gray-100">
                    <div className="h-2.5 rounded-full bg-gray-500 transition-all duration-500" style={{ width: `${Math.max(barPct, valor > 0 ? 2 : 0)}%` }} />
                  </div>
                </div>
              )
            })}

            {Object.keys(saidasPorGrupo).length === 0 && (
              <div className="py-8 text-center">
                <TrendingDown size={32} className="mx-auto text-gray-300" />
                <p className="mt-2 text-sm text-gray-500">Nenhuma saida registrada este mes.</p>
              </div>
            )}

            {/* Total */}
            <div className="mt-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-red-800">Total Saidas</span>
                <span className="text-lg font-bold text-red-900">{formatCurrency(saidasTotal)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ====== GRAFICOS MENSAIS ====== */}
      {dadosMensais.length > 0 && (
        <div className="grid grid-cols-1 gap-6">
          {/* Receita x Lucro por Mes */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-4 sm:px-6 py-4">
              <div className="flex items-center gap-2">
                <DollarSign size={20} className="text-indigo-600" />
                <h2 className="text-lg font-semibold text-gray-900">Receita x Lucro</h2>
              </div>
              <p className="mt-0.5 text-sm text-gray-500">Comparativo mensal â€” {year}</p>
            </div>
            <div className="p-4">
              <ResponsiveContainer width="100%" height={340}>
                <BarChart data={dadosMensais} margin={{ top: 30, right: 30, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={formatTickK} />
                  <Tooltip formatter={(value) => formatCurrency(value)} labelStyle={{ fontWeight: 600 }} />
                  <Legend />
                  <Bar dataKey="entradas" name="Receita" fill="#10b981" radius={[4, 4, 0, 0]} label={{ position: 'top', fontSize: 11, fontWeight: 600, fill: '#10b981', formatter: (v) => formatBarLabel(v) }} />
                  <Bar dataKey="lucro" name="Lucro" fill="#6366f1" radius={[4, 4, 0, 0]} label={{ position: 'top', fontSize: 11, fontWeight: 600, fill: '#6366f1', formatter: (v) => formatBarLabel(v) }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Analise Evolutiva - Entradas x Despesas */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-4 sm:px-6 py-4">
              <div className="flex items-center gap-2">
                <TrendingUp size={20} className="text-emerald-600" />
                <h2 className="text-lg font-semibold text-gray-900">Analise Evolutiva</h2>
              </div>
              <p className="mt-0.5 text-sm text-gray-500">Entradas x Despesas mensal â€” {year}</p>
            </div>
            <div className="p-4">
              <ResponsiveContainer width="100%" height={340}>
                <BarChart data={dadosMensais} margin={{ top: 30, right: 30, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={formatTickK} />
                  <Tooltip formatter={(value) => formatCurrency(value)} labelStyle={{ fontWeight: 600 }} />
                  <Legend />
                  <Bar dataKey="entradas" name="Entradas" fill="#10b981" radius={[4, 4, 0, 0]} label={{ position: 'top', fontSize: 11, fontWeight: 600, fill: '#10b981', formatter: (v) => formatBarLabel(v) }} />
                  <Bar dataKey="saidas" name="Despesas" fill="#ef4444" radius={[4, 4, 0, 0]} label={{ position: 'top', fontSize: 11, fontWeight: 600, fill: '#ef4444', formatter: (v) => formatBarLabel(v) }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ====== TABELA RESUMO MENSAL ====== */}
      {dadosMensais.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-4 sm:px-6 py-4">
            <div className="flex items-center gap-2">
              <BarChart size={20} className="text-indigo-600" />
              <h2 className="text-lg font-semibold text-gray-900">Resumo por Mes</h2>
            </div>
            <p className="mt-0.5 text-sm text-gray-500">{year}</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase text-gray-500">Mes</th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase text-gray-500">Entradas</th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase text-gray-500">Despesas</th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase text-gray-500">Lucro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {dadosMensais.map((row) => (
                  <tr key={row.mes} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 text-sm font-medium capitalize text-gray-900">{row.mes}</td>
                    <td className="px-4 py-2.5 text-right text-sm font-semibold text-emerald-700">{formatCurrency(row.entradas)}</td>
                    <td className="px-4 py-2.5 text-right text-sm font-semibold text-red-700">{formatCurrency(row.saidas)}</td>
                    <td className={`px-4 py-2.5 text-right text-sm font-bold ${row.lucro >= 0 ? 'text-indigo-700' : 'text-red-700'}`}>{formatCurrency(row.lucro)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td className="px-4 py-2.5 text-sm font-bold text-gray-900">Total</td>
                  <td className="px-4 py-2.5 text-right text-sm font-bold text-emerald-800">{formatCurrency(dadosMensais.reduce((s, r) => s + r.entradas, 0))}</td>
                  <td className="px-4 py-2.5 text-right text-sm font-bold text-red-800">{formatCurrency(dadosMensais.reduce((s, r) => s + r.saidas, 0))}</td>
                  <td className={`px-4 py-2.5 text-right text-sm font-bold ${dadosMensais.reduce((s, r) => s + r.lucro, 0) >= 0 ? 'text-indigo-800' : 'text-red-800'}`}>{formatCurrency(dadosMensais.reduce((s, r) => s + r.lucro, 0))}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* ====== LUCRO DO MES ====== */}
      <div className={`rounded-xl border ${lucroMes >= 0 ? 'border-indigo-300 bg-gradient-to-r from-indigo-600 to-blue-600' : 'border-red-300 bg-gradient-to-r from-red-600 to-rose-600'} p-6 shadow-lg`}>
        <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20">
              <DollarSign size={28} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-white/80">Resultado do Mes</p>
              <p className="text-sm text-white/60">{monthName} {year}</p>
            </div>
          </div>
          <div className="text-center sm:text-right">
            <p className="text-3xl font-bold text-white">{formatCurrency(lucroMes)}</p>
            <div className="mt-1 flex items-center gap-4 justify-center sm:justify-end text-sm text-white/80">
              <span><TrendingUp size={14} className="inline mr-1" />{formatCurrency(financeiroMes.entradas)}</span>
              <span><TrendingDown size={14} className="inline mr-1" />{formatCurrency(financeiroMes.saidas)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ====== ATENDIMENTOS DE HOJE ====== */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-4 sm:px-6 py-4">
          <div className="flex items-center gap-2">
            <Calendar size={20} className="text-indigo-600" />
            <h2 className="text-lg font-semibold text-gray-900">Atendimentos de Hoje</h2>
            <span className="ml-auto inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
              {formatDate(getLocalDateISO())}
            </span>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <Spinner className="h-6 w-6" />
          ) : atendimentosHojeList.length === 0 ? (
            <div className="py-10 text-center">
              <Clock size={40} className="mx-auto text-gray-300" />
              <p className="mt-3 text-sm text-gray-500">Nenhum atendimento agendado para hoje.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {atendimentosHojeList.map((atendimento) => (
                <div
                  key={atendimento.id}
                  className="flex flex-col gap-2 rounded-lg border border-gray-100 bg-gray-50/50 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                      <PawPrint size={18} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{atendimento.pet?.nome || 'â€”'}</p>
                      <p className="text-xs text-gray-500">{atendimento.cliente?.nome || 'â€”'} &middot; {atendimento.servico?.nome || 'â€”'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Clock size={14} className="text-gray-400" />
                      {formatTime(atendimento.data_hora)}
                    </div>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_BADGE[atendimento.status] || STATUS_BADGE.agendado}`}>
                      {STATUS_LABEL[atendimento.status] || atendimento.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ====== ULTIMOS ATENDIMENTOS ====== */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-4 sm:px-6 py-4">
          <div className="flex items-center gap-2">
            <Clock size={20} className="text-indigo-600" />
            <h2 className="text-lg font-semibold text-gray-900">Ultimos Atendimentos</h2>
          </div>
        </div>

        {loading ? (
          <div className="p-6"><Spinner className="h-6 w-6" /></div>
        ) : ultimosAtendimentos.length === 0 ? (
          <div className="p-6 py-10 text-center">
            <Calendar size={40} className="mx-auto text-gray-300" />
            <p className="mt-3 text-sm text-gray-500">Nenhum atendimento cadastrado ainda.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Pet / Cliente</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Servico</th>
                  <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Data / Hora</th>
                  <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {ultimosAtendimentos.map((atendimento) => (
                  <tr key={atendimento.id} className="transition-colors hover:bg-gray-50">
                    <td className="px-3 sm:px-6 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                          <PawPrint size={16} />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{atendimento.pet?.nome || 'â€”'}</div>
                          <div className="text-xs text-gray-500">{atendimento.cliente?.nome || 'â€”'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 text-sm text-gray-700">{atendimento.servico?.nome || 'â€”'}</td>
                    <td className="hidden sm:table-cell px-3 sm:px-6 py-4 text-sm text-gray-600">{formatDate(atendimento.data_hora)} {formatTime(atendimento.data_hora)}</td>
                    <td className="hidden md:table-cell px-3 sm:px-6 py-4">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_BADGE[atendimento.status] || STATUS_BADGE.agendado}`}>
                        {STATUS_LABEL[atendimento.status] || atendimento.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ====== QUICK STATS ROW ====== */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600"><Users size={18} /></div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500">Total Clientes</p>
              <p className="text-lg font-bold text-gray-900 truncate">{totalClientes ?? 'â€”'}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple-50 text-purple-600"><PawPrint size={18} /></div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500">Total Pets</p>
              <p className="text-lg font-bold text-gray-900 truncate">{totalPets ?? 'â€”'}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-50 text-green-600"><Calendar size={18} /></div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500">Atendimentos Hoje</p>
              <p className="text-lg font-bold text-gray-900 truncate">{atendimentosHoje ?? 'â€”'}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600"><Percent size={18} /></div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500">Comissoes do Mes</p>
              <p className="text-lg font-bold text-gray-900 truncate">{formatCurrency(comissoesMes)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


