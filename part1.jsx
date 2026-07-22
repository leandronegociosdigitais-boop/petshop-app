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

