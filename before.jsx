import { useState, useEffect, useMemo, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { formatDate, formatDateOnly, formatCurrency, extractDateKey, getDayOfWeek } from '../lib/dates'
import { useToast, Toast } from '../components/Toast'
import Spinner from '../components/Spinner'
import EmptyState from '../components/EmptyState'
import {
  COMISSAO_RATE, MESES, FORMA_PAGAMENTO_LABEL, STATUS_BADGE,
  DIAS_SEMANA, BANCO_LABEL, BANCO_COLORS, FORMA_PAGAMENTO_COLORS,
} from '../lib/constants'
import {
  FileText,
  ChevronDown,
  ChevronUp,
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  PawPrint,
  Search,
  Download,
  Landmark,
  CreditCard,
  BarChart3,
  X,
} from 'lucide-react'

const GRUPO_COLORS = {
  Fixo: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  Variavel: 'bg-yellow-50 text-yellow-700 ring-yellow-600/20',
  Operacional: 'bg-cyan-50 text-cyan-700 ring-cyan-600/20',
  Investimento: 'bg-violet-50 text-violet-700 ring-violet-600/20',
  Pessoal: 'bg-pink-50 text-pink-700 ring-pink-600/20',
}

function getMonthLabel(month) {
  const found = MESES.find((m) => m.value === month)
  return found ? found.label : ''
}

function CollapsibleSection({ title, icon: Icon, defaultOpen = true, children, count }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors">
        <div className="flex items-center gap-3">
          {Icon && <Icon size={20} className="text-indigo-600" />}
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          {count != null && (
            <span className="inline-flex items-center justify-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-600">{count}</span>
          )}
        </div>
        {open ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
      </button>
      {open && <div className="border-t border-gray-100">{children}</div>}
    </div>
  )
}

export default function Relatorios() {
  const now = new Date()
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())
  const [includeOtherMonths, setIncludeOtherMonths] = useState(false)
  const [otherMonthsStart, setOtherMonthsStart] = useState('')
  const [otherMonthsEnd, setOtherMonthsEnd] = useState('')
  const [search, setSearch] = useState('')
  const { toast, showToast, closeToast } = useToast()

  const [atendimentos, setAtendimentos] = useState([])
  const [financeiro, setFinanceiro] = useState([])
  const [loadingAtendimentos, setLoadingAtendimentos] = useState(true)
  const [loadingFinanceiro, setLoadingFinanceiro] = useState(true)
  const [historico, setHistorico] = useState([])
  const [loadingHistorico, setLoadingHistorico] = useState(true)
  const [historicoFin, setHistoricoFin] = useState([])
  const [loadingHistoricoFin, setLoadingHistoricoFin] = useState(false)

  function getMonthRange() {
    const start = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`
    const lastDay = new Date(selectedYear, selectedMonth, 0).getDate()
    const end = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
    return { start, end }
  }

  function getServiceDateRange() {
    if (includeOtherMonths && otherMonthsStart && otherMonthsEnd) {
      return { start: otherMonthsStart, end: otherMonthsEnd }
    }
    return getMonthRange()
  }

  const fetchAtendimentos = useCallback(async () => {
    setLoadingAtendimentos(true)
    const range = getServiceDateRange()
    const { data, error } = await supabase
      .from('atendimentos')
      .select('*, pet:pet_id(id, nome, especie), cliente:cliente_id(id, nome), servico:servico_id(id, nome, preco)')
      .eq('status', 'concluido')
      .gte('data_hora', range.start)
      .lte('data_hora', range.end + 'T23:59:59')
      .order('data_hora', { ascending: false })
    if (error) {
      showToast('Erro ao carregar atendimentos: ' + error.message, 'error')
    } else {
      // Deduplicate by id, tipo, descricao, valor, data
      const records = data || []
      const seen = new Set()
      const uniques = []
      for (const rec of records) {
        const key = `${rec.id}|${rec.tipo}|${rec.descricao}|${rec.valor}|${rec.data}`
        if (!seen.has(key)) {
          seen.add(key)
          uniques.push(rec)
        }
      }
      setAtendimentos(uniques)
    }
    setLoadingAtendimentos(false)
  }, [selectedMonth, selectedYear, includeOtherMonths, otherMonthsStart, otherMonthsEnd])

  const fetchFinanceiro = useCallback(async () => {
    setLoadingFinanceiro(true)
    const range = getMonthRange()
    const { data, error } = await supabase
      .from('financeiro')
      .select('*')
      .gte('data', range.start)
      .lte('data', range.end)
      .order('data', { ascending: false })
    if (error) {
      showToast('Erro ao carregar dados financeiros: ' + error.message, 'error')
    } else {
      // Deduplicate by tipo,descricao,valor,data to avoid duplicate entries in reports
      const records = data || []
      const seen = new Map()
      const uniques = []
      for (const rec of records) {
        const key = `${rec.tipo}|${rec.descricao}|${rec.valor}|${rec.data}`
        if (!seen.has(key)) {
          seen.set(key, true)
          uniques.push(rec)
        }
      }
      setFinanceiro(uniques)
    }
    setLoadingFinanceiro(false)
  }, [selectedMonth, selectedYear])

  const fetchHistorico = useCallback(async () => {
    setLoadingHistorico(true)
    try {
      const now = new Date()
      const startYear = now.getFullYear() - 1
      const start = `${startYear}-01-01`
      const end = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
      const { data, error } = await supabase
        .from('atendimentos')
        .select('id, data_hora, valor, forma_pagamento, banco, status')
        .eq('status', 'concluido')
        .gte('data_hora', start)
        .lte('data_hora', end + 'T23:59:59')
        .order('data_hora', { ascending: false })
      if (!error) {
        setHistorico(data || [])
      } else {
        console.error('fetchHistorico error:', error)
      }
    } catch (err) {
      console.error('fetchHistorico exception:', err)
    }
    setLoadingHistorico(false)
  }, [])

  const fetchHistoricoFinanceiro = useCallback(async () => {
    setLoadingHistoricoFin(true)
    try {
      const now = new Date()
      const startYear = now.getFullYear() - 2
      const start = `${startYear}-01-01`
      const end = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
      const { data, error } = await supabase
        .from('financeiro')
        .select('*')
        .gte('data', start)
        .lte('data', end)
        .order('data', { ascending: false })
      if (!error) {
        setHistoricoFin(data || [])
      } else {
        console.error('fetchHistoricoFinanceiro error:', error)
      }
    } catch (err) {
      console.error('fetchHistoricoFinanceiro exception:', err)
    }
    setLoadingHistoricoFin(false)
  }, [])

  useEffect(() => {
    fetchAtendimentos()
    fetchFinanceiro()
    fetchHistorico()
    fetchHistoricoFinanceiro()
  }, [selectedMonth, selectedYear, includeOtherMonths, otherMonthsStart, otherMonthsEnd])

  function goToPrevMonth() {
    if (selectedMonth === 1) { setSelectedMonth(12); setSelectedYear((y) => y - 1) }
    else setSelectedMonth((m) => m - 1)
  }

  function goToNextMonth() {
    if (selectedMonth === 12) { setSelectedMonth(1); setSelectedYear((y) => y + 1) }
    else setSelectedMonth((m) => m + 1)
  }

  function goToToday() {
    const n = new Date()
    setSelectedMonth(n.getMonth() + 1)
    setSelectedYear(n.getFullYear())
  }

  // Computed data
  const entradas = useMemo(() => financeiro.filter((r) => r.tipo === 'entrada'), [financeiro])
  const saidas = useMemo(() => financeiro.filter((r) => r.tipo === 'saida' && (r.status_pagamento === 'pago' || !r.status_pagamento)), [financeiro])
  const totalEntradas = useMemo(() => entradas.reduce((sum, r) => sum + (parseFloat(r.valor) || 0), 0), [entradas])
  const totalSaidas = useMemo(() => saidas.reduce((sum, r) => sum + (parseFloat(r.valor) || 0), 0), [saidas])
  const lucro = totalEntradas - totalSaidas

  const totalServicos = useMemo(
    () => atendimentos.reduce((sum, a) => sum + (parseFloat(a.valor) || 0), 0),
    [atendimentos]
  )
  const qtdAtendimentos = useMemo(() => atendimentos.length, [atendimentos])
  const totalComissoes = useMemo(
    () => atendimentos.reduce((sum, a) => sum + (parseFloat(a.valor) || 0) * COMISSAO_RATE, 0),
    [atendimentos]
  )
  const uniqueClientes = useMemo(() => {
    const ids = new Set()
    for (const a of atendimentos) { if (a.cliente_id) ids.add(a.cliente_id) }
    return ids.size
  }, [atendimentos])

  const uniquePets = useMemo(() => {
    const ids = new Set()
    for (const a of atendimentos) { if (a.pet_id) ids.add(a.pet_id) }
    return ids.size
  }, [atendimentos])

  const filteredAtendimentos = useMemo(() => {
    if (!search.trim()) return atendimentos
    const term = search.toLowerCase()
    return atendimentos.filter((a) => {
      return a.pet?.nome?.toLowerCase().includes(term) || a.cliente?.nome?.toLowerCase().includes(term) || a.servico?.nome?.toLowerCase().includes(term)
    })
  }, [atendimentos, search])

  const clientesDetalhado = useMemo(() => {
    const clientes = {}
    for (const a of filteredAtendimentos) {
      const id = a.cliente_id || 'sem_id'
      const nome = a.cliente?.nome || 'Cliente nao informado'
      if (!clientes[id]) clientes[id] = { nome, count: 0, total: 0 }
      const valor = parseFloat(a.valor) || 0
      clientes[id].count += 1
      clientes[id].total += valor
    }
    return Object.values(clientes).sort((a, b) => b.count - a.count)
  }, [filteredAtendimentos])

  const saidasByGrupo = useMemo(() => {
    const groups = {}
    for (const s of saidas) {
      const grupo = s.grupo || 'Outros'
      if (!groups[grupo]) groups[grupo] = { items: [], subtotal: 0 }
      groups[grupo].items.push(s)
      groups[grupo].subtotal += parseFloat(s.valor) || 0
    }
    return groups
  }, [saidas])

  const grupoNames = useMemo(() => Object.keys(saidasByGrupo).sort(), [saidasByGrupo])

  const saidasByGrupoCards = useMemo(() => {
    const grupos = {}
    for (const s of saidas) {
      const grupo = s.grupo || 'Outros'
      const cat = s.categoria || 'Outros'
      const sub = s.subcategoria || s.descricao || 'Outros'
      if (!grupos[grupo]) grupos[grupo] = { total: 0, categorias: {} }
      const valor = parseFloat(s.valor) || 0
      grupos[grupo].total += valor
      if (!grupos[grupo].categorias[cat]) grupos[grupo].categorias[cat] = { total: 0, itens: {} }
      grupos[grupo].categorias[cat].total += valor
      const item = s.subcategoria || s.descricao || 'Outros'
      if (!grupos[grupo].categorias[cat].itens[item]) grupos[grupo].categorias[cat].itens[item] = 0
      grupos[grupo].categorias[cat].itens[item] += valor
    }
    return Object.entries(grupos)
      .sort(([,a], [,b]) => b.total - a.total)
      .map(([nome, data]) => ({
        nome,
        total: data.total,
        categorias: Object.entries(data.categorias)
          .sort(([,a], [,b]) => b.total - a.total)
          .map(([catNome, catData]) => ({
            nome: catNome,
            total: catData.total,
            itens: Object.entries(catData.itens)
              .sort(([,a], [,b]) => b - a)
              .map(([itemNome, itemTotal]) => ({ nome: itemNome, total: itemTotal })),
          })),
      }))
  }, [saidas])

  const atendimentosPorDia = useMemo(() => {
    const dias = {}
    for (const a of filteredAtendimentos) {
      const key = extractDateKey(a.data_hora)
      if (!key) continue
      if (!dias[key]) dias[key] = { date: key, items: [], total: 0 }
      const valor = parseFloat(a.valor) || 0
      dias[key].items.push(a)
      dias[key].total += valor
    }
    return Object.values(dias).sort((a, b) => b.date.localeCompare(a.date))
  }, [filteredAtendimentos])

  const entradasPorDia = useMemo(() => {
    const dias = {}
    for (const r of entradas) {
      const key = r.data || ''
      if (!key) continue
      if (!dias[key]) dias[key] = { date: key, items: [], total: 0 }
      const valor = parseFloat(r.valor) || 0
      dias[key].items.push(r)
      dias[key].total += valor
    }
    return Object.values(dias).sort((a, b) => b.date.localeCompare(a.date))
  }, [entradas])

  // Report: by bank (financeiro entradas)
  const porBanco = useMemo(() => {
    const grupos = {}
    for (const r of entradas) {
      const banco = r.banco || 'sem_banco'
      if (!grupos[banco]) grupos[banco] = { items: [], total: 0, count: 0 }
      const valor = parseFloat(r.valor) || 0
      grupos[banco].items.push(r)
      grupos[banco].total += valor
      grupos[banco].count += 1
    }
    return grupos
  }, [entradas])

  // Report: by payment method (financeiro entradas)
  const porFormaPagamento = useMemo(() => {
    const grupos = {}
    for (const r of entradas) {
      const forma = r.forma_pagamento || 'sem_forma'
      if (!grupos[forma]) grupos[forma] = { items: [], total: 0, count: 0 }
      const valor = parseFloat(r.valor) || 0
      grupos[forma].items.push(r)
      grupos[forma].total += valor
      grupos[forma].count += 1
    }
    return grupos
  }, [entradas])

  // Report: by month (using historico financeiro data)
  const porMes = useMemo(() => {
    const meses = {}
    for (const r of historicoFin) {
      const key = (r.data || '').slice(0, 7)
      if (!key) continue
      if (!meses[key]) meses[key] = { month: key, totalEntrada: 0, totalSaida: 0, count: 0, porForma: {}, porBanco: {} }
      const valor = parseFloat(r.valor) || 0
      if (r.tipo === 'entrada') {
        meses[key].totalEntrada += valor
        const forma = r.forma_pagamento || 'sem_forma'
        if (!meses[key].porForma[forma]) meses[key].porForma[forma] = 0
        meses[key].porForma[forma] += valor
        const banco = r.banco || 'sem_banco'
        if (!meses[key].porBanco[banco]) meses[key].porBanco[banco] = 0
        meses[key].porBanco[banco] += valor
      } else if (r.status_pagamento === 'pago' || !r.status_pagamento) {
        meses[key].totalSaida += valor
      }
      meses[key].count += 1
    }
    return Object.values(meses).sort((a, b) => b.month.localeCompare(a.month))
  }, [historicoFin])

  const availableYears = useMemo(() => {
    const current = new Date().getFullYear()
    const years = []
    for (let y = current - 3; y <= current + 1; y++) years.push(y)
    return years
  }, [])

  function getBancoLabel(banco) {
    return BANCO_LABEL[banco] || (banco === 'sem_banco' ? 'Sem banco' : banco)
  }

  function getFormaLabel(forma) {
    return FORMA_PAGAMENTO_LABEL[forma] || (forma === 'sem_forma' ? 'Sem forma' : forma)
  }

  return (
    <div className="space-y-6">
      <Toast toast={toast} onClose={closeToast} />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <FileText size={28} className="text-indigo-600" />
          <h1 className="text-2xl font-bold text-gray-900">Relatorios</h1>
        </div>
        <button onClick={() => showToast('Relatorio gerado com sucesso!')} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors">
          <Download size={18} />
          Exportar
        </button>
      </div>

      {/* Month/Year Selector */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <button onClick={goToPrevMonth} className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors" title="Mes anterior">
              <ChevronDown size={16} className="rotate-90" />
            </button>
            <div className="flex items-center gap-2">
              <select value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))} className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                {MESES.map((m) => (<option key={m.value} value={m.value}>{m.label}</option>))}
              </select>
              <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                {availableYears.map((y) => (<option key={y} value={y}>{y}</option>))}
              </select>
            </div>
            <button onClick={goToNextMonth} className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors" title="Proximo mes">
              <ChevronDown size={16} className="-rotate-90" />
            </button>
            <button onClick={goToToday} className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors">
              Hoje
            </button>
          </div>
          <div className="flex flex-col gap-2 sm:items-end">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={includeOtherMonths} onChange={(e) => setIncludeOtherMonths(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
              <span className="text-sm font-medium text-gray-700">Incluir servicos de outros meses</span>
            </label>
            {includeOtherMonths && (
              <div className="flex items-center gap-2">
                <input type="date" value={otherMonthsStart} onChange={(e) => setOtherMonthsStart(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                <span className="text-sm text-gray-500">ate</span>
                <input type="date" value={otherMonthsEnd} onChange={(e) => setOtherMonthsEnd(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 1. Resumo do Mes */}
      <CollapsibleSection title={`Resumo de ${getMonthLabel(selectedMonth)} ${selectedYear}`} icon={DollarSign} defaultOpen={true}>
        {loadingFinanceiro ? (
          <Spinner />
        ) : (
          <div className="grid grid-cols-1 gap-4 p-4 sm:p-6 sm:grid-cols-2 lg:grid-cols-5">
