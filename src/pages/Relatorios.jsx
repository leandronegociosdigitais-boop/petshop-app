import { useState, useEffect, useMemo, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { formatDate, formatDateOnly, formatCurrency, extractDateKey, getDayOfWeek } from '../lib/dates'
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

const COMISSAO_RATE = 0.4

const MESES = [
  { value: 1, label: 'Janeiro' },
  { value: 2, label: 'Fevereiro' },
  { value: 3, label: 'Marco' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Maio' },
  { value: 6, label: 'Junho' },
  { value: 7, label: 'Julho' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Setembro' },
  { value: 10, label: 'Outubro' },
  { value: 11, label: 'Novembro' },
  { value: 12, label: 'Dezembro' },
]

const FORMA_PAGAMENTO_LABEL = {
  dinheiro: 'Dinheiro',
  cartao_credito: 'Cartao de Credito',
  cartao_debito: 'Cartao de Debito',
  pix: 'Pix',
  permuta: 'Permuta',
}

const STATUS_BADGE = {
  agendado: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  em_andamento: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  concluido: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  cancelado: 'bg-gray-50 text-gray-500 ring-gray-500/20',
}

const GRUPO_COLORS = {
  Fixo: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  Variavel: 'bg-yellow-50 text-yellow-700 ring-yellow-600/20',
  Operacional: 'bg-cyan-50 text-cyan-700 ring-cyan-600/20',
  Investimento: 'bg-violet-50 text-violet-700 ring-violet-600/20',
  Pessoal: 'bg-pink-50 text-pink-700 ring-pink-600/20',
}

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab']

const BANCO_LABEL = {
  mercado_pago: 'Mercado Pago',
  pagseguro: 'PagSeguro',
  pagseguro_juridico: 'PagSeguro Juridico',
  caixa_loja: 'Caixa Loja',
}

const BANCO_COLORS = {
  mercado_pago: 'bg-sky-50 text-sky-700 ring-sky-600/20',
  pagseguro: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  pagseguro_juridico: 'bg-teal-50 text-teal-700 ring-teal-600/20',
  caixa_loja: 'bg-amber-50 text-amber-700 ring-amber-600/20',
}

const FORMA_PAGAMENTO_COLORS = {
  dinheiro: 'bg-green-50 text-green-700 ring-green-600/20',
  cartao_credito: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  cartao_debito: 'bg-sky-50 text-sky-700 ring-sky-600/20',
  pix: 'bg-violet-50 text-violet-700 ring-violet-600/20',
  permuta: 'bg-purple-50 text-purple-700 ring-purple-600/20',
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

function Spinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
    </div>
  )
}

function EmptyState({ icon: Icon, message }) {
  return (
    <div className="py-12 text-center">
      <Icon size={36} className="mx-auto text-gray-300" />
      <p className="mt-3 text-sm text-gray-500">{message}</p>
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
  const [toast, setToast] = useState(null)

  const [atendimentos, setAtendimentos] = useState([])
  const [financeiro, setFinanceiro] = useState([])
  const [loadingAtendimentos, setLoadingAtendimentos] = useState(true)
  const [loadingFinanceiro, setLoadingFinanceiro] = useState(true)
  const [historico, setHistorico] = useState([])
  const [loadingHistorico, setLoadingHistorico] = useState(true)
  const [historicoFin, setHistoricoFin] = useState([])
  const [loadingHistoricoFin, setLoadingHistoricoFin] = useState(false)

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  function showToast(message, type = 'success') {
    setToast({ message, type })
  }

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
      setAtendimentos(data || [])
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
      setFinanceiro(data || [])
    }
    setLoadingFinanceiro(false)
  }, [selectedMonth, selectedYear])

  const fetchHistorico = useCallback(async () => {
    setLoadingHistorico(true)
    const now = new Date()
    const startYear = now.getFullYear() - 1
    const start = `${startYear}-01-01`
    const end = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    const { data, error } = await supabase
      .from('atendimentos')
      .select('id, data_hora, valor, forma_pagamento, banco, status')
      .gte('data_hora', start)
      .lte('data_hora', end + 'T23:59:59')
      .order('data_hora', { ascending: false })
    if (!error) {
      setHistorico(data || [])
    }
    setLoadingHistorico(false)
  }, [])

  const fetchHistoricoFinanceiro = useCallback(async () => {
    setLoadingHistoricoFin(true)
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
    if (error) {
      console.error('fetchHistoricoFinanceiro error:', error)
    }
    setHistoricoFin(data || [])
    setLoadingHistoricoFin(false)
  }, [])

  useEffect(() => {
    fetchAtendimentos()
    fetchFinanceiro()
    fetchHistorico()
    fetchHistoricoFinanceiro()
  }, [fetchAtendimentos, fetchFinanceiro, fetchHistorico, fetchHistoricoFinanceiro])

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
  const saidas = useMemo(() => financeiro.filter((r) => r.tipo === 'saida'), [financeiro])
  const totalEntradas = useMemo(() => entradas.reduce((sum, r) => sum + (parseFloat(r.valor) || 0), 0), [entradas])
  const totalSaidas = useMemo(() => saidas.reduce((sum, r) => sum + (parseFloat(r.valor) || 0), 0), [saidas])
  const lucro = totalEntradas - totalSaidas

  const totalComissoes = useMemo(
    () => atendimentos.filter((a) => a.status === 'concluido').reduce((sum, a) => sum + (parseFloat(a.valor) || 0) * COMISSAO_RATE, 0),
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
      } else {
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
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 max-w-[calc(100vw-2rem)] flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium shadow-lg transition-all ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'}`}>
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 hover:opacity-80"><X size={16} /></button>
        </div>
      )}

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
              <ChevronDown size={20} className="rotate-90" />
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
              <ChevronDown size={20} className="-rotate-90" />
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
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
              <p className="text-sm font-medium text-emerald-700">Total Entradas</p>
              <div className="mt-2 flex items-end justify-between">
                <p className="text-2xl font-bold text-emerald-800">{formatCurrency(totalEntradas)}</p>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"><TrendingUp size={20} /></div>
              </div>
            </div>
            <div className="rounded-xl border border-red-200 bg-red-50 p-5 shadow-sm">
              <p className="text-sm font-medium text-red-700">Total Saidas</p>
              <div className="mt-2 flex items-end justify-between">
                <p className="text-2xl font-bold text-red-800">{formatCurrency(totalSaidas)}</p>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600"><TrendingDown size={20} /></div>
              </div>
            </div>
            <div className={`rounded-xl border p-5 shadow-sm ${lucro >= 0 ? 'border-indigo-200 bg-indigo-50' : 'border-red-200 bg-red-50'}`}>
              <p className={`text-sm font-medium ${lucro >= 0 ? 'text-indigo-700' : 'text-red-700'}`}>Lucro</p>
              <div className="mt-2 flex items-end justify-between">
                <p className={`text-2xl font-bold ${lucro >= 0 ? 'text-indigo-800' : 'text-red-800'}`}>{formatCurrency(lucro)}</p>
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${lucro >= 0 ? 'bg-indigo-100 text-indigo-600' : 'bg-red-100 text-red-600'}`}><DollarSign size={20} /></div>
              </div>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
              <p className="text-sm font-medium text-amber-700">Comissoes (40%)</p>
              <div className="mt-2 flex items-end justify-between">
                <p className="text-2xl font-bold text-amber-800">{formatCurrency(totalComissoes)}</p>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600"><FileText size={20} /></div>
              </div>
            </div>
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
              <p className="text-sm font-medium text-blue-700">Clientes Atendidos</p>
              <div className="mt-2 flex items-end justify-between">
                <p className="text-2xl font-bold text-blue-800">{uniqueClientes}</p>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600"><Users size={20} /></div>
              </div>
            </div>
          </div>
        )}
      </CollapsibleSection>

      {/* 2. Servicos do Mes */}
      <CollapsibleSection title="Servicos do Mes" icon={Calendar} defaultOpen={true} count={filteredAtendimentos.length}>
        {loadingAtendimentos ? (
          <Spinner />
        ) : filteredAtendimentos.length === 0 ? (
          <EmptyState icon={Calendar} message="Nenhum atendimento no periodo selecionado." />
        ) : (
          <>
            <div className="p-4">
              <div className="relative max-w-md">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" placeholder="Buscar por pet, cliente ou servico..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
              </div>
            </div>
            <div className="p-4">
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-100">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Data</th>
                      <th className="px-4 py-2 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">Servicos</th>
                      <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {atendimentosPorDia.map((dia) => (
                      <tr key={dia.date} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-2 text-sm font-medium text-gray-900">{DIAS_SEMANA[getDayOfWeek(dia.date)]} - {formatDate(dia.date)}</td>
                        <td className="px-4 py-2 text-center text-sm text-gray-600">{dia.items.length}</td>
                        <td className="px-4 py-2 text-right text-sm font-semibold text-gray-900">{formatCurrency(dia.total)}</td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50">
                      <td className="px-4 py-2 text-sm font-bold text-gray-900">Total</td>
                      <td className="px-4 py-2 text-center text-sm font-bold text-gray-900">{filteredAtendimentos.length}</td>
                      <td className="px-4 py-2 text-right text-sm font-bold text-gray-900">{formatCurrency(filteredAtendimentos.reduce((s, a) => s + (parseFloat(a.valor) || 0), 0))}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div className="p-4 space-y-3">
              {atendimentosPorDia.map((dia) => {
                const diaSemana = DIAS_SEMANA[getDayOfWeek(dia.date)]
                return (
                  <div key={dia.date} className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-gray-100 bg-gray-50 px-3 sm:px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-indigo-600" />
                        <span className="text-sm font-semibold text-gray-900">{diaSemana} - {formatDate(dia.date)}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-gray-500">{dia.items.length} servico{dia.items.length > 1 ? 's' : ''}</span>
                        <span className="font-semibold text-gray-900">Total: {formatCurrency(dia.total)}</span>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-100">
                        <thead>
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Pet</th>
                            <th className="hidden sm:table-cell px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Cliente</th>
                            <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Servico</th>
                            <th className="hidden md:table-cell px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Valor</th>
                            <th className="hidden lg:table-cell px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Forma Pag.</th>
                            <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {dia.items.map((a) => (
                            <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-4 py-2.5">
                                <div className="flex items-center gap-2">
                                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600"><PawPrint size={12} /></div>
                                  <div>
                                    <div className="text-sm font-medium text-gray-900 truncate">{a.pet?.nome || '—'}</div>
                                    {a.pet?.especie && <div className="text-xs text-gray-500">{a.pet.especie}</div>}
                                  </div>
                                </div>
                              </td>
                              <td className="hidden sm:table-cell px-4 py-2.5 text-sm text-gray-700">{a.cliente?.nome || '—'}</td>
                              <td className="px-4 py-2.5 text-sm text-gray-700">{a.servico?.nome || '—'}</td>
                              <td className="hidden md:table-cell px-4 py-2.5 text-right text-sm font-semibold text-gray-900">{formatCurrency(a.valor)}</td>
                              <td className="hidden lg:table-cell px-4 py-2.5">
                                <span className="inline-flex items-center rounded-full bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-700 ring-1 ring-inset ring-gray-500/20">
                                  {FORMA_PAGAMENTO_LABEL[a.forma_pagamento] || a.forma_pagamento || '—'}
                                </span>
                              </td>
                              <td className="px-4 py-2.5">
                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${STATUS_BADGE[a.status] || 'bg-gray-50 text-gray-700 ring-gray-600/20'}`}>
                                  {a.status || '—'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </CollapsibleSection>

      {/* 3. Entradas do Mes */}
      <CollapsibleSection title="Entradas do Mes" icon={TrendingUp} defaultOpen={true} count={entradas.length}>
        {loadingFinanceiro ? (
          <Spinner />
        ) : entradas.length === 0 ? (
          <EmptyState icon={TrendingUp} message="Nenhuma entrada no periodo selecionado." />
        ) : (
          <div className="space-y-3 p-4">
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Data</th>
                    <th className="px-4 py-2 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">Entradas</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {entradasPorDia.map((dia) => (
                    <tr key={dia.date} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-2 text-sm font-medium text-gray-900">{DIAS_SEMANA[getDayOfWeek(dia.date)]} - {formatDate(dia.date)}</td>
                      <td className="px-4 py-2 text-center text-sm text-gray-600">{dia.items.length}</td>
                      <td className="px-4 py-2 text-right text-sm font-semibold text-emerald-700">{formatCurrency(dia.total)}</td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50">
                    <td className="px-4 py-2 text-sm font-bold text-gray-900">Total</td>
                    <td className="px-4 py-2 text-center text-sm font-bold text-gray-900">{entradas.length}</td>
                    <td className="px-4 py-2 text-right text-sm font-bold text-emerald-700">{formatCurrency(totalEntradas)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            {entradasPorDia.map((dia) => {
              const diaSemana = DIAS_SEMANA[getDayOfWeek(dia.date)]
              return (
                <div key={dia.date} className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                  <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-gray-100 bg-gray-50 px-3 sm:px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-emerald-600" />
                      <span className="text-sm font-semibold text-gray-900">{diaSemana} - {formatDate(dia.date)}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-gray-500">{dia.items.length} entrada{dia.items.length > 1 ? 's' : ''}</span>
                      <span className="font-semibold text-emerald-700">{formatCurrency(dia.total)}</span>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-100">
                      <thead>
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Categoria</th>
                          <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Descricao</th>
                          <th className="hidden sm:table-cell px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Forma Pag.</th>
                          <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Valor</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {dia.items.map((r) => (
                          <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-2.5">
                              <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">{r.categoria || '—'}</span>
                            </td>
                            <td className="px-4 py-2.5 text-sm font-medium text-gray-900">{r.descricao || '—'}</td>
                            <td className="hidden sm:table-cell px-4 py-2.5">
                              <span className="inline-flex items-center rounded-full bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-700 ring-1 ring-inset ring-gray-500/20">{FORMA_PAGAMENTO_LABEL[r.forma_pagamento] || r.forma_pagamento || '—'}</span>
                            </td>
                            <td className="px-4 py-2.5 text-right text-sm font-semibold text-emerald-700">+ {formatCurrency(r.valor)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CollapsibleSection>

      {/* 4. Saidas do Mes */}
      <CollapsibleSection title="Saidas do Mes" icon={TrendingDown} defaultOpen={true} count={saidas.length}>
        {loadingFinanceiro ? (
          <Spinner />
        ) : saidas.length === 0 ? (
          <EmptyState icon={TrendingDown} message="Nenhuma saida no periodo selecionado." />
        ) : (
          <div>
            {grupoNames.map((grupo) => (
              <div key={grupo} className="border-b border-gray-100 last:border-b-0">
                <div className="flex items-center justify-between bg-gray-50 px-6 py-3">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${GRUPO_COLORS[grupo] || 'bg-gray-50 text-gray-700 ring-gray-600/20'}`}>{grupo}</span>
                  </div>
                  <span className="text-sm font-bold text-red-700">- {formatCurrency(saidasByGrupo[grupo].subtotal)}</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-100">
                    <thead>
                      <tr>
                        <th className="px-3 sm:px-6 py-2 text-left text-xs font-medium uppercase tracking-wide text-gray-400">Data</th>
                        <th className="px-3 sm:px-6 py-2 text-left text-xs font-medium uppercase tracking-wide text-gray-400">Categoria</th>
                        <th className="px-3 sm:px-6 py-2 text-left text-xs font-medium uppercase tracking-wide text-gray-400">Descricao</th>
                        <th className="hidden sm:table-cell px-6 py-2 text-left text-xs font-medium uppercase tracking-wide text-gray-400">Forma Pag.</th>
                        <th className="px-3 sm:px-6 py-2 text-right text-xs font-medium uppercase tracking-wide text-gray-400">Valor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {saidasByGrupo[grupo].items.map((r) => (
                        <tr key={r.id} className="transition-colors hover:bg-gray-50">
                          <td className="px-3 sm:px-6 py-3 text-sm text-gray-700">{formatDateOnly(r.data)}</td>
                          <td className="px-3 sm:px-6 py-3 text-sm text-gray-600">{r.categoria || '—'}</td>
                          <td className="px-3 sm:px-6 py-3 text-sm font-medium text-gray-900">{r.descricao || '—'}</td>
                          <td className="hidden sm:table-cell px-6 py-3">
                            <span className="inline-flex items-center rounded-full bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/20">{FORMA_PAGAMENTO_LABEL[r.forma_pagamento] || r.forma_pagamento || '—'}</span>
                          </td>
                          <td className="px-3 sm:px-6 py-3 text-right text-sm font-semibold text-red-700">- {formatCurrency(r.valor)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
            <div className="flex items-center justify-between bg-red-50 px-6 py-4">
              <span className="text-sm font-bold text-gray-900">Total Saidas</span>
              <span className="text-sm font-bold text-red-700">- {formatCurrency(totalSaidas)}</span>
            </div>
          </div>
        )}
      </CollapsibleSection>

      {/* 5. Clientes Atendidos - Detalhado */}
      <CollapsibleSection title="Clientes Atendidos" icon={Users} defaultOpen={true} count={clientesDetalhado.length}>
        {loadingAtendimentos ? (
          <Spinner />
        ) : clientesDetalhado.length === 0 ? (
          <EmptyState icon={Users} message="Nenhum cliente atendido no periodo." />
        ) : (
          <div className="p-4">
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Cliente</th>
                    <th className="px-4 py-2 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">Atendimentos</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {clientesDetalhado.map((c, i) => (
                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600"><Users size={12} /></div>
                          <span className="text-sm font-medium text-gray-900">{c.nome}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-center text-sm text-gray-600">{c.count}</td>
                      <td className="px-4 py-2.5 text-right text-sm font-semibold text-gray-900">{formatCurrency(c.total)}</td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50">
                    <td className="px-4 py-2 text-sm font-bold text-gray-900">Total ({clientesDetalhado.length} clientes)</td>
                    <td className="px-4 py-2 text-center text-sm font-bold text-gray-900">{filteredAtendimentos.length}</td>
                    <td className="px-4 py-2 text-right text-sm font-bold text-gray-900">{formatCurrency(filteredAtendimentos.reduce((s, a) => s + (parseFloat(a.valor) || 0), 0))}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CollapsibleSection>

      {/* 6. Pets Atendidos */}
      <CollapsibleSection title="Pets Atendidos" icon={PawPrint} defaultOpen={true}>
        {loadingAtendimentos ? (
          <Spinner />
        ) : (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-50 text-purple-600 mb-3"><PawPrint size={32} /></div>
            <p className="text-3xl font-bold text-gray-900">{uniquePets}</p>
            <p className="mt-1 text-sm text-gray-500">pets atendidos no periodo</p>
          </div>
        )}
      </CollapsibleSection>

      {/* 7. Relatorio por Banco */}
      <CollapsibleSection title="Relatorio por Banco" icon={Landmark} defaultOpen={false} count={Object.keys(porBanco).length}>
        {loadingFinanceiro ? (
          <Spinner />
        ) : Object.keys(porBanco).length === 0 ? (
          <EmptyState icon={Landmark} message="Nenhum dado por banco no periodo." />
        ) : (
          <div className="p-4 space-y-3">
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Banco</th>
                    <th className="px-4 py-2 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">Entradas</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {Object.entries(porBanco).sort(([,a], [,b]) => b.total - a.total).map(([banco, data]) => (
                    <tr key={banco} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-2.5">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${BANCO_COLORS[banco] || 'bg-gray-50 text-gray-700 ring-gray-600/20'}`}>{getBancoLabel(banco)}</span>
                      </td>
                      <td className="px-4 py-2.5 text-center text-sm text-gray-600">{data.count}</td>
                      <td className="px-4 py-2.5 text-right text-sm font-semibold text-emerald-700">{formatCurrency(data.total)}</td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50">
                    <td className="px-4 py-2 text-sm font-bold text-gray-900">Total</td>
                    <td className="px-4 py-2 text-center text-sm font-bold text-gray-900">{entradas.length}</td>
                    <td className="px-4 py-2 text-right text-sm font-bold text-emerald-700">{formatCurrency(totalEntradas)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            {Object.entries(porBanco).sort(([,a], [,b]) => b.total - a.total).map(([banco, data]) => (
              <div key={banco} className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-gray-100 bg-gray-50 px-3 sm:px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <Landmark size={14} className="text-indigo-600" />
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${BANCO_COLORS[banco] || 'bg-gray-50 text-gray-700 ring-gray-600/20'}`}>{getBancoLabel(banco)}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-gray-500">{data.count} entrada{data.count > 1 ? 's' : ''}</span>
                    <span className="font-semibold text-emerald-700">{formatCurrency(data.total)}</span>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-100">
                    <thead>
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Data</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Descricao</th>
                        <th className="hidden sm:table-cell px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Forma Pag.</th>
                        <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Valor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {data.items.map((r) => (
                        <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-2.5 text-sm text-gray-700">{formatDateOnly(r.data)}</td>
                          <td className="px-4 py-2.5 text-sm font-medium text-gray-900">{r.descricao || '—'}</td>
                          <td className="hidden sm:table-cell px-4 py-2.5">
                            <span className="inline-flex items-center rounded-full bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-700 ring-1 ring-inset ring-gray-500/20">{FORMA_PAGAMENTO_LABEL[r.forma_pagamento] || r.forma_pagamento || '—'}</span>
                          </td>
                          <td className="px-4 py-2.5 text-right text-sm font-semibold text-emerald-700">{formatCurrency(r.valor)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </CollapsibleSection>

      {/* 8. Relatorio por Forma de Pagamento */}
      <CollapsibleSection title="Relatorio por Forma de Pagamento" icon={CreditCard} defaultOpen={false} count={Object.keys(porFormaPagamento).length}>
        {loadingFinanceiro ? (
          <Spinner />
        ) : Object.keys(porFormaPagamento).length === 0 ? (
          <EmptyState icon={CreditCard} message="Nenhum dado por forma de pagamento no periodo." />
        ) : (
          <div className="p-4 space-y-3">
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Forma Pagamento</th>
                    <th className="px-4 py-2 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">Entradas</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {Object.entries(porFormaPagamento).sort(([,a], [,b]) => b.total - a.total).map(([forma, data]) => (
                    <tr key={forma} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-2.5">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${FORMA_PAGAMENTO_COLORS[forma] || 'bg-gray-50 text-gray-700 ring-gray-600/20'}`}>{getFormaLabel(forma)}</span>
                      </td>
                      <td className="px-4 py-2.5 text-center text-sm text-gray-600">{data.count}</td>
                      <td className="px-4 py-2.5 text-right text-sm font-semibold text-emerald-700">{formatCurrency(data.total)}</td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50">
                    <td className="px-4 py-2 text-sm font-bold text-gray-900">Total</td>
                    <td className="px-4 py-2 text-center text-sm font-bold text-gray-900">{entradas.length}</td>
                    <td className="px-4 py-2 text-right text-sm font-bold text-emerald-700">{formatCurrency(totalEntradas)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            {Object.entries(porFormaPagamento).sort(([,a], [,b]) => b.total - a.total).map(([forma, data]) => (
              <div key={forma} className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-gray-100 bg-gray-50 px-3 sm:px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <CreditCard size={14} className="text-indigo-600" />
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${FORMA_PAGAMENTO_COLORS[forma] || 'bg-gray-50 text-gray-700 ring-gray-600/20'}`}>{getFormaLabel(forma)}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-gray-500">{data.count} entrada{data.count > 1 ? 's' : ''}</span>
                    <span className="font-semibold text-emerald-700">{formatCurrency(data.total)}</span>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-100">
                    <thead>
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Data</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Descricao</th>
                        <th className="hidden sm:table-cell px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Banco</th>
                        <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Valor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {data.items.map((r) => (
                        <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-2.5 text-sm text-gray-700">{formatDateOnly(r.data)}</td>
                          <td className="px-4 py-2.5 text-sm font-medium text-gray-900">{r.descricao || '—'}</td>
                          <td className="hidden sm:table-cell px-4 py-2.5">
                            {r.banco ? (
                              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${BANCO_COLORS[r.banco] || 'bg-gray-50 text-gray-700 ring-gray-600/20'}`}>{BANCO_LABEL[r.banco] || r.banco}</span>
                            ) : <span className="text-xs text-gray-400">—</span>}
                          </td>
                          <td className="px-4 py-2.5 text-right text-sm font-semibold text-emerald-700">{formatCurrency(r.valor)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </CollapsibleSection>

      {/* 9. Relatorio por Mes */}
      <CollapsibleSection title="Relatorio por Mes (Historico)" icon={BarChart3} defaultOpen={false} count={porMes.length}>
        {loadingHistoricoFin ? (
          <Spinner />
        ) : porMes.length === 0 ? (
          <EmptyState icon={BarChart3} message="Nenhum dado historico disponivel." />
        ) : (
          <div className="p-4 space-y-3">
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Mes</th>
                    <th className="px-4 py-2 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">Registros</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide text-emerald-600">Entradas</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide text-red-600">Saidas</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide text-indigo-600">Saldo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {porMes.map((m) => {
                    const [y, mo] = m.month.split('-')
                    const label = getMonthLabel(parseInt(mo)) + ' ' + y
                    const saldo = m.totalEntrada - m.totalSaida
                    return (
                      <tr key={m.month} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-2.5 text-sm font-medium text-gray-900">{label}</td>
                        <td className="px-4 py-2.5 text-center text-sm text-gray-600">{m.count}</td>
                        <td className="px-4 py-2.5 text-right text-sm font-semibold text-emerald-700">{formatCurrency(m.totalEntrada)}</td>
                        <td className="px-4 py-2.5 text-right text-sm font-semibold text-red-700">{formatCurrency(m.totalSaida)}</td>
                        <td className={`px-4 py-2.5 text-right text-sm font-bold ${saldo >= 0 ? 'text-indigo-700' : 'text-red-700'}`}>{formatCurrency(saldo)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {porMes.map((m) => {
              const [y, mo] = m.month.split('-')
              const label = getMonthLabel(parseInt(mo)) + ' ' + y
              const saldo = m.totalEntrada - m.totalSaida
              return (
                <div key={m.month} className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                  <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-gray-100 bg-gray-50 px-3 sm:px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <BarChart3 size={14} className="text-indigo-600" />
                      <span className="text-sm font-semibold text-gray-900">{label}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-emerald-700 font-semibold">+{formatCurrency(m.totalEntrada)}</span>
                      <span className="text-red-700 font-semibold">-{formatCurrency(m.totalSaida)}</span>
                      <span className={`font-bold ${saldo >= 0 ? 'text-indigo-700' : 'text-red-700'}`}>Saldo: {formatCurrency(saldo)}</span>
                    </div>
                  </div>
                  <div className="p-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Por Forma de Pagamento</p>
                      <div className="space-y-1.5">
                        {Object.entries(m.porForma).sort(([,a],[,b]) => b - a).map(([forma, valor]) => (
                          <div key={forma} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${FORMA_PAGAMENTO_COLORS[forma] || 'bg-gray-50 text-gray-700 ring-gray-600/20'}`}>{FORMA_PAGAMENTO_LABEL[forma] || forma}</span>
                            <span className="text-sm font-semibold text-gray-900">{formatCurrency(valor)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Por Banco</p>
                      <div className="space-y-1.5">
                        {Object.entries(m.porBanco).sort(([,a],[,b]) => b - a).map(([banco, valor]) => (
                          <div key={banco} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${BANCO_COLORS[banco] || 'bg-gray-50 text-gray-700 ring-gray-600/20'}`}>{getBancoLabel(banco)}</span>
                            <span className="text-sm font-semibold text-gray-900">{formatCurrency(valor)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CollapsibleSection>
    </div>
  )
}
