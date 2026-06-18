import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { getLocalDateISO, formatDate, extractDateKey, getDayOfWeek, formatCurrency as formatCurrencyUtil } from '../lib/dates'
import {
  Plus,
  Pencil,
  Trash2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Search,
  X,
  Filter,
  AlertCircle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Bell,
  BellRing,
  Clock,
  CheckCircle2,
} from 'lucide-react'

const EMPTY_FORM = {
  tipo: 'entrada',
  categoria: '',
  descricao: '',
  valor: '',
  data: getLocalDateISO(),
  forma_pagamento: 'pix',
  grupo: '',
  banco: '',
  status_pagamento: 'pago',
  data_vencimento: '',
}

const CATEGORIAS_ENTRADA = ['Servicos', 'Produtos', 'Outros']

const CATEGORIAS_SAIDA_POR_GRUPO = {
  'Servicos': ['Banho', 'Tosa', 'Banho e Tosa', 'Hidratacao', 'Tosa Higienica'],
  'Despesas Fixas': ['Energia Eletrica', 'Internet', 'Aluguel'],
  'Custo de Consumo': ['Shampoo Neutro', 'Pre-lavagem', 'Lacos', 'Algodao', 'Perfume', 'Hidratante', 'Afiacao de Laminas'],
  'Custo de Descartaveis': ['Limpeza', 'Copo Descartavel', 'Papel Higienico', 'Agua'],
  'Comissoes': ['Comissao Emidio'],
  'Despesas Variaveis': ['Medicamento'],
  'Taxas de Cartao': ['PagSeguro', 'Mercado Pago'],
  'Manutencao': ['Equipamento', 'Predial'],
}

const GRUPOS_SAIDA = ['Servicos', 'Despesas Fixas', 'Custo de Consumo', 'Custo de Descartaveis', 'Comissoes', 'Despesas Variaveis', 'Taxas de Cartao', 'Manutencao']

const FORMAS_PAGAMENTO = [
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'cartao_credito', label: 'Cartao de Credito' },
  { value: 'cartao_debito', label: 'Cartao de Debito' },
  { value: 'pix', label: 'Pix' },
  { value: 'permuta', label: 'Permuta' },
]

const BANCO_OPTIONS = [
  { value: '', label: 'Nenhum' },
  { value: 'mercado_pago_juridico', label: 'Mercado Pago Juridico' },
  { value: 'pagseguro', label: 'PagSeguro' },
  { value: 'pagseguro_juridico', label: 'PagSeguro Juridico' },
  { value: 'caixa_loja', label: 'Caixa da Loja' },
  { value: 'permuta', label: 'Permuta' },
]

const STATUS_PAGAMENTO_FIN_COLORS = {
  pago: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  pendente: 'bg-amber-100 text-amber-700 border border-amber-200',
}

const FORMA_PAGAMENTO_COLORS = {
  dinheiro: 'bg-green-50 text-green-700 ring-green-600/20',
  cartao_credito: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  cartao_debito: 'bg-sky-50 text-sky-700 ring-sky-600/20',
  pix: 'bg-violet-50 text-violet-700 ring-violet-600/20',
  permuta: 'bg-purple-50 text-purple-700 ring-purple-600/20',
}

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

const GRUPO_COLORS = {
  'Servicos': 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  'Despesas Fixas': 'bg-blue-50 text-blue-700 ring-blue-600/20',
  'Custo de Consumo': 'bg-yellow-50 text-yellow-700 ring-yellow-600/20',
  'Custo de Descartaveis': 'bg-cyan-50 text-cyan-700 ring-cyan-600/20',
  'Comissoes': 'bg-purple-50 text-purple-700 ring-purple-600/20',
  'Despesas Variaveis': 'bg-orange-50 text-orange-700 ring-orange-600/20',
  'Taxas de Cartao': 'bg-sky-50 text-sky-700 ring-sky-600/20',
  'Manutencao': 'bg-rose-50 text-rose-700 ring-rose-600/20',
}

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab']

function getMonthLabel(month) {
  const found = MESES.find((m) => m.value === month)
  return found ? found.label : ''
}

const TABS = [
  { value: 'todos', label: 'Todos' },
  { value: 'entrada', label: 'Entradas' },
  { value: 'saida', label: 'Saidas' },
  { value: 'mes_a_mes', label: 'Mes a Mes' },
]

const formatCurrency = formatCurrencyUtil

function getToday() {
  return getLocalDateISO()
}

function getFormaPagamentoLabel(value) {
  const found = FORMAS_PAGAMENTO.find((f) => f.value === value)
  return found ? found.label : value
}

const availableYears = (() => { const c = new Date().getFullYear(); const y = []; for (let i = c - 3; i <= c + 1; i++) y.push(i); return y })()

export default function Financeiro() {
  const [registros, setRegistros] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('todos')
  const [filterCategoria, setFilterCategoria] = useState('')
  const [filterGrupo, setFilterGrupo] = useState('')
  const [filterFormaPagamento, setFilterFormaPagamento] = useState('')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [toast, setToast] = useState(null)
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear())
  const [lembretes, setLembretes] = useState([])

  useEffect(() => {
    fetchRegistros()
  }, [selectedMonth, selectedYear])

  useEffect(() => {
    fetchLembretes()
  }, [])

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  async function fetchRegistros() {
    setLoading(true)
    const lastDay = new Date(selectedYear, selectedMonth, 0).getDate()
    const start = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`
    const end = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
    const { data, error } = await supabase
      .from('financeiro')
      .select('*')
      .gte('data', start)
      .lte('data', end)
      .order('data', { ascending: false })

    if (error) {
      showToast('Erro ao carregar registros financeiros: ' + error.message, 'error')
    } else {
      setRegistros(data || [])
    }
    setLoading(false)
  }

  async function fetchLembretes() {
    try {
      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const start = `${year}-${month}-01`

      const { data, error } = await supabase
        .from('financeiro')
        .select('*')
        .eq('tipo', 'saida')
        .eq('status_pagamento', 'pendente')
        .gte('data_vencimento', start)
        .order('data_vencimento', { ascending: true, nullsFirst: false })

      if (!error && data) {
        setLembretes(data)
      } else {
        setLembretes([])
      }
    } catch {
      setLembretes([])
    }
  }

  function showToast(message, type = 'success') {
    setToast({ message, type })
  }

  function openCreateModal(tipo) {
    setEditingId(null)
    setForm({ ...EMPTY_FORM, tipo, data: getToday() })
    setModalOpen(true)
  }

  function openEditModal(registro) {
    setEditingId(registro.id)
    setForm({
      tipo: registro.tipo || 'entrada',
      categoria: registro.categoria || '',
      descricao: registro.descricao || '',
      valor: registro.valor != null ? String(registro.valor) : '',
      data: registro.data || getToday(),
      forma_pagamento: registro.forma_pagamento || 'dinheiro',
      grupo: registro.grupo || '',
      status_pagamento: registro.status_pagamento || 'pago',
      data_vencimento: registro.data_vencimento || '',
    })
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditingId(null)
    setForm(EMPTY_FORM)
  }

  function handleFormChange(field, value) {
    setForm((prev) => {
      const next = { ...prev, [field]: value }
      if (field === 'tipo') {
        next.categoria = ''
        next.grupo = ''
      }
      if (field === 'grupo') {
        next.categoria = ''
      }
      return next
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.descricao.trim()) {
      showToast('Informe a descricao.', 'error')
      return
    }
    if (!form.valor || parseFloat(form.valor) <= 0) {
      showToast('Informe um valor valido.', 'error')
      return
    }
    if (!form.data) {
      showToast('Informe a data.', 'error')
      return
    }
    if (!form.categoria) {
      showToast('Selecione a categoria.', 'error')
      return
    }

    setSaving(true)
    const payload = {
      tipo: form.tipo,
      categoria: form.categoria,
      descricao: form.descricao.trim(),
      valor: parseFloat(form.valor),
      data: form.data,
      forma_pagamento: form.forma_pagamento || 'dinheiro',
      grupo: form.tipo === 'saida' ? (form.grupo || null) : null,
      status_pagamento: form.tipo === 'saida' ? (form.status_pagamento || 'pago') : 'pago',
      data_vencimento: form.tipo === 'saida' && form.status_pagamento === 'pendente' && form.data_vencimento
        ? form.data_vencimento
        : null,
    }

    let error
    if (editingId) {
      ;({ error } = await supabase
        .from('financeiro')
        .update(payload)
        .eq('id', editingId))
    } else {
      ;({ error } = await supabase.from('financeiro').insert([payload]))
    }

    if (error) {
      showToast('Erro ao salvar registro financeiro.', 'error')
    } else {
      showToast(
        editingId
          ? 'Registro atualizado com sucesso!'
          : 'Registro criado com sucesso!'
      )
      closeModal()
      fetchRegistros()
      fetchLembretes()
    }
    setSaving(false)
  }

  async function handleDelete() {
    if (!deleteId) return
    const { error } = await supabase
      .from('financeiro')
      .delete()
      .eq('id', deleteId)

    if (error) {
      showToast('Erro ao excluir registro.', 'error')
    } else {
      showToast('Registro excluido com sucesso!')
      fetchRegistros()
      fetchLembretes()
    }
    setDeleteId(null)
  }

  async function marcarPago(id) {
    const { error } = await supabase
      .from('financeiro')
      .update({ status_pagamento: 'pago' })
      .eq('id', id)
    if (error) {
      showToast('Erro ao marcar como pago.', 'error')
    } else {
      showToast('Pagamento marcado como pago!')
      fetchRegistros()
      fetchLembretes()
    }
  }

  function clearFilters() {
    setFilterCategoria('')
    setFilterGrupo('')
    setFilterFormaPagamento('')
    setDataInicio('')
    setDataFim('')
    setSearch('')
    setActiveTab('todos')
  }

  const categoriaOptions = useMemo(() => {
    if (form.tipo === 'entrada') return CATEGORIAS_ENTRADA
    if (form.grupo && CATEGORIAS_SAIDA_POR_GRUPO[form.grupo]) {
      return CATEGORIAS_SAIDA_POR_GRUPO[form.grupo]
    }
    return Object.values(CATEGORIAS_SAIDA_POR_GRUPO).flat()
  }, [form.tipo, form.grupo])

  const filtered = useMemo(() => {
    return registros.filter((r) => {
      if (activeTab !== 'todos' && activeTab !== 'mes_a_mes' && r.tipo !== activeTab) return false
      if (filterCategoria && r.categoria !== filterCategoria) return false
      if (filterGrupo && r.grupo !== filterGrupo) return false
      if (filterFormaPagamento && r.forma_pagamento !== filterFormaPagamento) return false
      if (dataInicio && r.data < dataInicio) return false
      if (dataFim && r.data > dataFim) return false
      if (search.trim()) {
        const term = search.toLowerCase()
        const matchDesc = r.descricao?.toLowerCase().includes(term)
        const matchCat = r.categoria?.toLowerCase().includes(term)
        if (!matchDesc && !matchCat) return false
      }
      return true
    })
  }, [registros, activeTab, filterCategoria, filterGrupo, filterFormaPagamento, dataInicio, dataFim, search])

  const porDia = useMemo(() => {
    const dias = {}
    for (const r of filtered) {
      const key = r.data || ''
      if (!key) continue
      if (!dias[key]) dias[key] = { date: key, items: [], totalEntrada: 0, totalSaida: 0 }
      const valor = parseFloat(r.valor) || 0
      dias[key].items.push(r)
      if (r.tipo === 'entrada') dias[key].totalEntrada += valor
      else if (r.status_pagamento === 'pago') dias[key].totalSaida += valor
    }
    return Object.values(dias).sort((a, b) => b.date.localeCompare(a.date))
  }, [filtered])

  const porMes = useMemo(() => {
    const meses = {}
    for (const r of registros) {
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
      } else if (r.status_pagamento === 'pago') {
        meses[key].totalSaida += valor
      }
      meses[key].count += 1
    }
    return Object.values(meses).sort((a, b) => b.month.localeCompare(a.month))
  }, [registros])

  const summary = useMemo(() => {
    const entradas = filtered
      .filter((r) => r.tipo === 'entrada')
      .reduce((sum, r) => sum + (parseFloat(r.valor) || 0), 0)
    const saidas = filtered
      .filter((r) => r.tipo === 'saida' && r.status_pagamento === 'pago')
      .reduce((sum, r) => sum + (parseFloat(r.valor) || 0), 0)
    return { entradas, saidas, saldo: entradas - saidas }
  }, [filtered])

  const tabCounts = useMemo(() => {
    const counts = { todos: registros.length }
    for (const r of registros) {
      counts[r.tipo] = (counts[r.tipo] || 0) + 1
    }
    counts.mes_a_mes = registros.length
    return counts
  }, [registros])

  const allCategorias = useMemo(() => {
    const cats = new Set()
    for (const r of registros) {
      if (r.categoria) cats.add(r.categoria)
    }
    return [...cats].sort()
  }, [registros])

  const hasActiveFilters =
    filterCategoria || filterGrupo || filterFormaPagamento || dataInicio || dataFim || search.trim() || (activeTab !== 'todos' && activeTab !== 'mes_a_mes')

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 max-w-[calc(100vw-2rem)] flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium shadow-lg transition-all ${
            toast.type === 'error'
              ? 'bg-red-600 text-white'
              : 'bg-emerald-600 text-white'
          }`}
        >
          <span>{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="ml-2 hover:opacity-80"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <DollarSign size={28} className="text-indigo-600" />
          <h1 className="text-2xl font-bold text-gray-900">Financeiro</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              if (selectedMonth === 1) { setSelectedMonth(12); setSelectedYear(y => y - 1) }
              else setSelectedMonth(m => m - 1)
            }}
            className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
            title="Mes anterior"
          >
            <ChevronLeft size={18} />
          </button>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {MESES.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {availableYears.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button
            onClick={() => {
              if (selectedMonth === 12) { setSelectedMonth(1); setSelectedYear(y => y + 1) }
              else setSelectedMonth(m => m + 1)
            }}
            className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
            title="Proximo mes"
          >
            <ChevronRight size={18} />
          </button>
          <span className="mx-1 h-6 w-px bg-gray-200 hidden sm:block" />
          <button
            onClick={() => openCreateModal('entrada')}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 sm:px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors"
          >
            <TrendingUp size={18} />
            Nova Entrada
          </button>
          <button
            onClick={() => openCreateModal('saida')}
            className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 sm:px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-700 transition-colors"
          >
            <TrendingDown size={18} />
            Nova Saida
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <TrendingUp size={24} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-emerald-700">Total Entradas</p>
              <p className="mt-1 text-xl font-bold text-emerald-700 truncate">{formatCurrency(summary.entradas)}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
              <TrendingDown size={24} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-red-700">Total Saidas</p>
              <p className="mt-1 text-xl font-bold text-red-600 truncate">{formatCurrency(summary.saidas)}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-5 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
              <DollarSign size={24} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-indigo-700">Saldo</p>
              <p className={`mt-1 text-xl font-bold ${summary.saldo >= 0 ? 'text-indigo-700' : 'text-red-600'} truncate`}>
                {formatCurrency(summary.saldo)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Lembretes de Pagamento */}
    {lembretes.length > 0 && (
      <div className="overflow-hidden rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 shadow-sm">
        <div className="flex items-center gap-2 border-b border-amber-200 px-4 py-3 bg-amber-100/60">
          <BellRing size={18} className="text-amber-600 animate-pulse" />
          <h2 className="text-sm font-bold text-amber-800">Lembretes de Pagamento</h2>
          <span className="inline-flex items-center justify-center rounded-full bg-amber-500 px-2 py-0.5 text-xs font-bold text-white">{lembretes.length}</span>
        </div>
        <div className="divide-y divide-amber-100">
          {lembretes.map((lembrete) => {
            const today = getLocalDateISO()
            const venc = lembrete.data_vencimento || lembrete.data
            const isVencido = venc < today
            const isHoje = venc === today
            const diasAte = Math.ceil((new Date(venc + 'T00:00:00') - new Date(today + 'T00:00:00')) / (1000 * 60 * 60 * 24))
            const urgency = isVencido
              ? 'border-l-4 border-l-red-500 bg-red-50/60'
              : isHoje
              ? 'border-l-4 border-l-amber-500 bg-amber-50/60'
              : diasAte <= 3
              ? 'border-l-4 border-l-orange-400 bg-orange-50/40'
              : 'border-l-4 border-l-amber-300'
            const urgencyLabel = isVencido
              ? { text: `Vencido ha ${Math.abs(diasAte)} dia${Math.abs(diasAte) > 1 ? 's' : ''}`, bg: 'bg-red-100 text-red-700' }
              : isHoje
              ? { text: 'Vence hoje!', bg: 'bg-amber-100 text-amber-700' }
              : diasAte <= 3
              ? { text: `Vence em ${diasAte} dia${diasAte > 1 ? 's' : ''}`, bg: 'bg-orange-100 text-orange-700' }
              : { text: `Vence em ${diasAte} dias`, bg: 'bg-amber-50 text-amber-600' }
            return (
              <div key={lembrete.id} className={`flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${urgency}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900">{lembrete.descricao}</span>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${urgencyLabel.bg}`}>
                      <Clock size={10} />
                      {urgencyLabel.text}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                    <span>Categoria: {lembrete.categoria}</span>
                    {lembrete.grupo && <span>Grupo: {lembrete.grupo}</span>}
                    <span>Vencimento: {formatDate(venc)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-base font-bold text-red-600">-{formatCurrency(lembrete.valor)}</span>
                  <button
                    onClick={() => marcarPago(lembrete.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors"
                    title="Marcar como pago"
                  >
                    <CheckCircle2 size={14} />
                    Pago
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )}

    {/* Search + Filters + Tabs */}
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative max-w-full sm:max-w-md flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por descricao ou categoria..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-10 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
              showFilters || (filterCategoria || filterGrupo || filterFormaPagamento || dataInicio || dataFim)
                ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Filter size={16} />
            Filtros
          </button>
        </div>

        {showFilters && (
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Forma Pagamento</label>
                <select value={filterFormaPagamento} onChange={(e) => setFilterFormaPagamento(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                  <option value="">Todas</option>
                  {FORMAS_PAGAMENTO.map((fp) => (<option key={fp.value} value={fp.value}>{fp.label}</option>))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Grupo</label>
                <select value={filterGrupo} onChange={(e) => setFilterGrupo(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                  <option value="">Todos os grupos</option>
                  {GRUPOS_SAIDA.map((g) => (<option key={g} value={g}>{g}</option>))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Categoria</label>
                <select value={filterCategoria} onChange={(e) => setFilterCategoria(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                  <option value="">Todas as categorias</option>
                  {allCategorias.map((cat) => (<option key={cat} value={cat}>{cat}</option>))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Data inicio</label>
                <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Data fim</label>
                <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
              </div>
            </div>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors">
                <X size={14} />
                Limpar filtros
              </button>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.value
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {tab.label}
              <span className={`inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-xs font-semibold ${
                activeTab === tab.value ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
              }`}>
                {tabCounts[tab.value] || 0}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
        </div>
      ) : activeTab === 'mes_a_mes' ? (
        <div className="space-y-3">
          {porMes.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 bg-white py-16 text-center">
              <BarChart3 size={40} className="mx-auto text-gray-300" />
              <p className="mt-3 text-gray-500">Nenhum dado disponivel.</p>
            </div>
          ) : (
            <>
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
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
              </div>
              {porMes.map((m) => {
                const [y, mo] = m.month.split('-')
                const label = getMonthLabel(parseInt(mo)) + ' ' + y
                const saldo = m.totalEntrada - m.totalSaida
                return (
                  <div key={m.month} className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-gray-100 bg-gray-50 px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <BarChart3 size={16} className="text-indigo-600" />
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
                              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${FORMA_PAGAMENTO_COLORS[forma] || 'bg-gray-50 text-gray-700 ring-gray-600/20'}`}>
                                {getFormaPagamentoLabel(forma)}
                              </span>
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
                              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${BANCO_COLORS[banco] || 'bg-gray-50 text-gray-700 ring-gray-600/20'}`}>
                                {BANCO_LABEL[banco] || (banco === 'sem_banco' ? 'Sem banco' : banco)}
                              </span>
                              <span className="text-sm font-semibold text-gray-900">{formatCurrency(valor)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </>
          )}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white py-16 text-center">
          <DollarSign size={40} className="mx-auto text-gray-300" />
          <p className="mt-3 text-gray-500">
            {hasActiveFilters
              ? 'Nenhum registro encontrado para os filtros aplicados.'
              : 'Nenhum registro financeiro cadastrado ainda.'}
          </p>
          {!hasActiveFilters && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <button onClick={() => openCreateModal('entrada')} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors">
                <TrendingUp size={16} />
                Primeira entrada
              </button>
              <button onClick={() => openCreateModal('saida')} className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors">
                <TrendingDown size={16} />
                Primeira saida
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Data</th>
                    <th className="px-4 py-2 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">Registros</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide text-emerald-600">Entradas</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide text-red-600">Saidas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {porDia.map((dia) => (
                    <tr key={dia.date} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-2 text-sm font-medium text-gray-900">
                        <span className="inline-block w-8 text-right">{DIAS_SEMANA[getDayOfWeek(dia.date)]}</span> - {formatDate(dia.date)}
                      </td>
                      <td className="px-4 py-2 text-center text-sm text-gray-600">{dia.items.length}</td>
                      <td className="px-4 py-2 text-right text-sm font-semibold text-emerald-700">{formatCurrency(dia.totalEntrada)}</td>
                      <td className="px-4 py-2 text-right text-sm font-semibold text-red-700">{formatCurrency(dia.totalSaida)}</td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50">
                    <td className="px-4 py-2 text-sm font-bold text-gray-900">Total</td>
                    <td className="px-4 py-2 text-center text-sm font-bold text-gray-900">{filtered.length}</td>
                    <td className="px-4 py-2 text-right text-sm font-bold text-emerald-700">{formatCurrency(summary.entradas)}</td>
                    <td className="px-4 py-2 text-right text-sm font-bold text-red-700">{formatCurrency(summary.saidas)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {porDia.map((dia) => {
            const diaSemana = DIAS_SEMANA[getDayOfWeek(dia.date)]
            return (
              <div key={dia.date} className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-gray-100 bg-gray-50 px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-indigo-600" />
                    <span className="text-sm font-semibold text-gray-900"><span className="inline-block w-8 text-right">{diaSemana}</span> - {formatDate(dia.date)}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-gray-500">{dia.items.length} registro{dia.items.length > 1 ? 's' : ''}</span>
                    {dia.totalEntrada > 0 && <span className="font-semibold text-emerald-700">+{formatCurrency(dia.totalEntrada)}</span>}
                    {dia.totalSaida > 0 && <span className="font-semibold text-red-700">-{formatCurrency(dia.totalSaida)}</span>}
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-100">
                    <thead>
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Tipo</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Forma Pag.</th>
                        <th className="hidden sm:table-cell px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Grupo</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Categoria</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Descricao</th>
                        <th className="hidden md:table-cell px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Valor</th>
                        <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Acoes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {dia.items.map((registro) => {
                        const isEntrada = registro.tipo === 'entrada'
                        return (
                          <tr key={registro.id} className={`even:bg-gray-50 hover:bg-blue-50 transition-colors ${isEntrada ? 'border-l-2 border-l-emerald-400' : 'border-l-2 border-l-red-400'}`}>
                            <td className="px-4 py-2.5">
                              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${isEntrada ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' : 'bg-red-50 text-red-700 ring-red-600/20'}`}>
                                {isEntrada ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                                {isEntrada ? 'Entrada' : 'Saida'}
                              </span>
                            </td>
                            <td className="px-4 py-2.5">
                              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${FORMA_PAGAMENTO_COLORS[registro.forma_pagamento] || 'bg-gray-50 text-gray-700 ring-gray-600/20'}`}>
                                {getFormaPagamentoLabel(registro.forma_pagamento)}
                              </span>
                            </td>
                            <td className="hidden sm:table-cell px-4 py-2.5">
                              {registro.grupo ? (
                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${GRUPO_COLORS[registro.grupo] || 'bg-gray-50 text-gray-700 ring-gray-600/20'}`}>
                                  {registro.grupo}
                                </span>
                              ) : (
                                <span className="text-xs text-gray-400">{'—'}</span>
                              )}
                            </td>
                            <td className="px-4 py-2.5 text-sm text-gray-700">{registro.categoria || '—'}</td>
                            <td className="px-4 py-2.5 text-sm font-medium text-gray-900">{registro.descricao || '—'}{!isEntrada && registro.status_pagamento === 'pendente' && (<span className="ml-2 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700"><Bell size={10} />Pendente</span>)}</td>
                            <td className={`hidden md:table-cell px-4 py-2.5 text-right text-sm font-semibold ${isEntrada ? 'text-emerald-700' : 'text-red-600'}`}>
                              {isEntrada ? '+' : '-'}{formatCurrency(registro.valor)}
                            </td>
                            <td className="px-4 py-2.5 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button onClick={() => openEditModal(registro)} className="rounded-md p-2.5 text-gray-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors" title="Editar">
                                  <Pencil size={14} />
                                </button>
                                <button onClick={() => setDeleteId(registro.id)} className="rounded-md p-2.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors" title="Excluir">
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl bg-white p-4 sm:p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingId ? 'Editar Registro' : form.tipo === 'entrada' ? 'Nova Entrada' : 'Nova Saida'}
              </h2>
              <button onClick={closeModal} className="rounded-md p-1 text-gray-400 hover:text-gray-600 transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Tipo <span className="text-red-500">*</span></label>
                <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                  <button type="button" onClick={() => handleFormChange('tipo', 'entrada')} className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold transition-colors ${form.tipo === 'entrada' ? 'bg-emerald-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                    <TrendingUp size={16} />
                    Entrada
                  </button>
                  <button type="button" onClick={() => handleFormChange('tipo', 'saida')} className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold transition-colors ${form.tipo === 'saida' ? 'bg-red-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                    <TrendingDown size={16} />
                    Saida
                  </button>
                </div>
              </div>

              {form.tipo === 'saida' && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Grupo</label>
                  <select value={form.grupo} onChange={(e) => handleFormChange('grupo', e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                    <option value="">Todos os grupos</option>
                    {GRUPOS_SAIDA.map((g) => (<option key={g} value={g}>{g}</option>))}
                  </select>
                </div>
              )}

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Categoria <span className="text-red-500">*</span></label>
                <select required value={form.categoria} onChange={(e) => handleFormChange('categoria', e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                  <option value="">Selecione a categoria</option>
                  {form.tipo === 'saida' && form.grupo && CATEGORIAS_SAIDA_POR_GRUPO[form.grupo]
                    ? CATEGORIAS_SAIDA_POR_GRUPO[form.grupo].map((cat) => (<option key={cat} value={cat}>{cat}</option>))
                    : categoriaOptions.map((cat) => (<option key={cat} value={cat}>{cat}</option>))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Descricao <span className="text-red-500">*</span></label>
                <input type="text" required value={form.descricao} onChange={(e) => handleFormChange('descricao', e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" placeholder="Descricao do registro..." />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Forma de Pagamento <span className="text-red-500">*</span></label>
                <select value={form.forma_pagamento} onChange={(e) => handleFormChange('forma_pagamento', e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                  {FORMAS_PAGAMENTO.map((fp) => (<option key={fp.value} value={fp.value}>{fp.label}</option>))}
                </select>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Valor (R$) <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">R$</span>
                    <input type="number" step="0.01" min="0.01" required value={form.valor} onChange={(e) => handleFormChange('valor', e.target.value)} className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" placeholder="0,00" />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Data <span className="text-red-500">*</span></label>
                  <input type="date" required value={form.data} onChange={(e) => handleFormChange('data', e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                </div>
              </div>

              {form.tipo === 'saida' && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Status do Pagamento</label>
              <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                <button type="button" onClick={() => handleFormChange('status_pagamento', 'pago')} className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold transition-colors ${form.status_pagamento === 'pago' ? 'bg-emerald-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                  <CheckCircle2 size={16} />                Concluido
                </button>
                <button type="button" onClick={() => handleFormChange('status_pagamento', 'pendente')} className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold transition-colors ${form.status_pagamento === 'pendente' ? 'bg-amber-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                  <Clock size={16} />                Pendente
                </button>
              </div>
            </div>
          )}

        {form.tipo === "saida" && form.status_pagamento === "pendente" && (
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              <span className="inline-flex items-center gap-1"><Bell size={14} className="text-amber-500" /> Data de Vencimento</span>
            </label>
            <input
              type="date"
              value={form.data_vencimento || ""}
              onChange={(e) => handleFormChange("data_vencimento", e.target.value)}
              className="w-full rounded-lg border border-amber-300 bg-amber-50/50 px-3 py-2 text-sm text-gray-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
            <p className="mt-1 text-xs text-amber-600">Informe quando este pagamento vence para receber um lembrete.</p>
          </div>
        )}

          <div className="flex items-center justify-end gap-3 pt-2">
                <button type="button" onClick={closeModal} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={saving} className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${form.tipo === 'entrada' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}`}>
                  {saving ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Salvando...
                    </span>
                  ) : editingId ? 'Salvar Alteracoes' : form.tipo === 'entrada' ? 'Criar Entrada' : 'Criar Saida'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteId(null)} />
          <div className="relative w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                <AlertCircle size={20} />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Excluir registro</h2>
            </div>
            <p className="mt-3 text-sm text-gray-600">
              Tem certeza que deseja excluir este registro financeiro? Esta acao nao pode ser desfeita.
            </p>
            <div className="mt-5 flex items-center justify-end gap-3">
              <button onClick={() => setDeleteId(null)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
              <button onClick={handleDelete} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 transition-colors">
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
