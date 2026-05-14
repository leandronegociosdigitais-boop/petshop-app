import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { formatDate, formatCurrency, formatDateTime, getLocalDateISO, extractDateKey, getDayOfWeek } from '../lib/dates'
import { Percent, DollarSign, Calendar, Search, X, ChevronLeft, ChevronRight, Landmark, PawPrint, CalendarDays } from 'lucide-react'

const COMISSAO_RATE = 0.4

const FORMA_PAGAMENTO_LABEL = {
  dinheiro: 'Dinheiro',
  cartao_credito: 'Cartao de Credito',
  cartao_debito: 'Cartao de Debito',
  pix: 'Pix',
  permuta: 'Permuta',
}

const BANCO_LABEL = {
  mercado_pago: 'Mercado Pago',
  pagseguro: 'PagSeguro',
  pagseguro_juridico: 'PagSeguro Juridico',
  caixa_loja: 'Caixa Loja',
}

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab']

const MESES = [
  { value: 1, label: 'Janeiro' }, { value: 2, label: 'Fevereiro' }, { value: 3, label: 'Marco' },
  { value: 4, label: 'Abril' }, { value: 5, label: 'Maio' }, { value: 6, label: 'Junho' },
  { value: 7, label: 'Julho' }, { value: 8, label: 'Agosto' }, { value: 9, label: 'Setembro' },
  { value: 10, label: 'Outubro' }, { value: 11, label: 'Novembro' }, { value: 12, label: 'Dezembro' },
]

function getMonthRange(month, year) {
  const start = `${year}-${String(month).padStart(2, '0')}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const end = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
  return { start, end }
}

export default function Comissoes() {
  const [atendimentos, setAtendimentos] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [toast, setToast] = useState(null)

  const now = new Date()
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())

  useEffect(() => { fetchAtendimentos() }, [selectedMonth, selectedYear])

  useEffect(() => {
    if (toast) { const timer = setTimeout(() => setToast(null), 3000); return () => clearTimeout(timer) }
  }, [toast])

  async function fetchAtendimentos() {
    setLoading(true)
    const { start, end } = getMonthRange(selectedMonth, selectedYear)
    const { data, error } = await supabase
      .from('atendimentos')
      .select('*, pet:pet_id(id, nome, especie), cliente:cliente_id(id, nome), servico:servico_id(id, nome, preco)')
      .eq('status', 'concluido')
      .gte('data_hora', start + 'T00:00:00')
      .lte('data_hora', end + 'T23:59:59')
      .order('data_hora', { ascending: false })
    if (error) { showToast('Erro ao carregar comissoes: ' + error.message, 'error') } else { setAtendimentos(data || []) }
    setLoading(false)
  }

  function showToast(message, type = 'success') { setToast({ message, type }) }

  const monthRange = useMemo(() => getMonthRange(selectedMonth, selectedYear), [selectedMonth, selectedYear])

  const filtered = useMemo(() => {
    return atendimentos.filter((a) => {
      const dateStr = a.data_hora ? extractDateKey(a.data_hora) : ''
      if (dateStr < monthRange.start || dateStr > monthRange.end) return false
      if (search.trim()) {
        const term = search.toLowerCase()
        const matchCliente = a.cliente?.nome?.toLowerCase().includes(term)
        const matchPet = a.pet?.nome?.toLowerCase().includes(term)
        const matchServico = a.servico?.nome?.toLowerCase().includes(term)
        if (!matchCliente && !matchPet && !matchServico) return false
      }
      return true
    })
  }, [atendimentos, monthRange, search])

  const summaryMes = useMemo(() => {
    return filtered.reduce((sum, a) => sum + (parseFloat(a.valor) || 0) * COMISSAO_RATE, 0)
  }, [filtered])

  const summaryServicosMes = useMemo(() => {
    return filtered.reduce((sum, a) => sum + (parseFloat(a.valor) || 0), 0)
  }, [filtered])

  const porDia = useMemo(() => {
    const dias = {}
    for (const a of filtered) {
      const key = a.data_hora ? extractDateKey(a.data_hora) : ''
      if (!key) continue
      if (!dias[key]) dias[key] = { date: key, items: [], total: 0, comissao: 0, pets: new Set() }
      const valor = parseFloat(a.valor) || 0
      dias[key].items.push(a)
      dias[key].total += valor
      dias[key].comissao += valor * COMISSAO_RATE
      if (a.pet?.id) dias[key].pets.add(a.pet.id)
    }
    return Object.values(dias).sort((a, b) => b.date.localeCompare(a.date))
  }, [filtered])

  const isCurrentMonth = selectedMonth === now.getMonth() + 1 && selectedYear === now.getFullYear()

  function getISOWeekKey(dateStr) {
    const d = new Date(dateStr + 'T00:00:00')
    const dayNum = d.getUTCDay() || 7
    d.setUTCDate(d.getUTCDate() + 4 - dayNum)
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
    const weekNum = Math.ceil(((d - yearStart) / 86400000 + 1) / 7)
    return { year: d.getUTCFullYear(), week: weekNum }
  }

  const porSemana = useMemo(() => {
    const semanas = {}
    for (const a of filtered) {
      const dateStr = a.data_hora ? extractDateKey(a.data_hora) : ''
      if (!dateStr) continue
      const { year, week } = getISOWeekKey(dateStr)
      const key = `${year}-W${String(week).padStart(2, '0')}`
      if (!semanas[key]) {
        semanas[key] = { key, year, week, items: [], total: 0, comissao: 0, pets: new Set(), dates: new Set() }
      }
      const valor = parseFloat(a.valor) || 0
      semanas[key].items.push(a)
      semanas[key].total += valor
      semanas[key].comissao += valor * COMISSAO_RATE
      if (a.pet?.id) semanas[key].pets.add(a.pet.id)
      semanas[key].dates.add(dateStr)
    }
    return Object.values(semanas).sort((a, b) => a.key.localeCompare(b.key))
  }, [filtered])

  const currentWeekKey = useMemo(() => {
    const today = getLocalDateISO()
    const { year, week } = getISOWeekKey(today)
    return `${year}-W${String(week).padStart(2, '0')}`
  }, [])

  const monthLabel = MESES.find(m => m.value === selectedMonth)?.label || ''

  const availableYears = useMemo(() => {
    const current = new Date().getFullYear()
    const years = []
    for (let y = current - 3; y <= current + 1; y++) years.push(y)
    return years
  }, [])

  function goToPrevMonth() {
    if (selectedMonth === 1) { setSelectedMonth(12); setSelectedYear(y => y - 1) }
    else { setSelectedMonth(m => m - 1) }
  }

  function goToNextMonth() {
    if (selectedMonth === 12) { setSelectedMonth(1); setSelectedYear(y => y + 1) }
    else { setSelectedMonth(m => m + 1) }
  }

  function goToToday() {
    const n = new Date()
    setSelectedMonth(n.getMonth() + 1)
    setSelectedYear(n.getFullYear())
  }

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 max-w-[calc(100vw-2rem)] flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium shadow-lg transition-all ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'}`}>
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 hover:opacity-80"><X size={16} /></button>
        </div>
      )}

      <div className="flex items-center gap-2">
        <Percent size={28} className="text-indigo-600" />
        <h1 className="text-2xl font-bold text-gray-900">Comissoes</h1>
        <span className="text-sm text-gray-500">(40% dos servicos)</span>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-indigo-700">Comissao do Mes</p>
              <p className="mt-1 text-2xl font-bold text-indigo-800">{formatCurrency(summaryMes)}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-600"><Percent size={24} /></div>
          </div>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-700">Total Servicos do Mes</p>
              <p className="mt-1 text-2xl font-bold text-emerald-800">{formatCurrency(summaryServicosMes)}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"><DollarSign size={24} /></div>
          </div>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-amber-700">Atendimentos no Mes</p>
              <p className="mt-1 text-2xl font-bold text-amber-800">{filtered.length}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600"><Calendar size={24} /></div>
          </div>
        </div>
      </div>

      {/* Month Navigator */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <button onClick={goToPrevMonth} className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors" title="Mes anterior">
            <ChevronLeft size={20} />
          </button>
          <select value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500">
              {MESES.map(m => (<option key={m.value} value={m.value}>{m.label}</option>))}
            </select>
            <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500">
              {availableYears.map(y => (<option key={y} value={y}>{y}</option>))}
</select>
<button onClick={goToNextMonth} className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors" title="Proximo mes">
            <ChevronRight size={20} />
          </button>
          <button onClick={goToToday} className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors">
Hoje
</button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" placeholder="Buscar por cliente, pet ou servico..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-10 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
        {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X size={16} /></button>}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" /></div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white py-16 text-center">
          <Percent size={40} className="mx-auto text-gray-300" />
          <p className="mt-3 text-gray-500">Sem comissoes em {monthLabel} {selectedYear}.</p>
          {!isCurrentMonth && (
            <button onClick={goToToday} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors">
              Voltar para mes atual
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
{/* Comissoes por Semana */}
<div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
<div className="border-b border-gray-100 bg-gray-50 px-3 sm:px-4 py-3">
<div className="flex items-center gap-2">
<CalendarDays size={16} className="text-amber-600" />
<span className="text-sm font-semibold text-gray-900">Comissoes por Semana - {monthLabel} {selectedYear}</span>
</div>
</div>
<div className="overflow-x-auto">
<table className="min-w-full divide-y divide-gray-100">
<thead>
<tr>
<th className="px-3 sm:px-6 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Semana</th>
<th className="px-3 sm:px-6 py-2 text-center text-xs font-semibold uppercase tracking-wide text-gray-400 hidden sm:table-cell">Dias</th>
<th className="px-3 sm:px-6 py-2 text-center text-xs font-semibold uppercase tracking-wide text-gray-400 hidden sm:table-cell">Pets</th>
<th className="px-3 sm:px-6 py-2 text-center text-xs font-semibold uppercase tracking-wide text-gray-400 hidden md:table-cell">Servicos</th>
<th className="px-3 sm:px-6 py-2 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Total</th>
<th className="px-3 sm:px-6 py-2 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Comissao</th>
<th className="px-3 sm:px-6 py-2 text-center text-xs font-semibold uppercase tracking-wide text-gray-400 hidden md:table-cell">Status</th>
</tr>
</thead>
<tbody className="divide-y divide-gray-50">
{porSemana.map((sem) => {
const isCurrent = sem.key === currentWeekKey
const sortedDates = [...sem.dates].sort()
const firstDate = sortedDates[0]
const lastDate = sortedDates[sortedDates.length - 1]
return (
<tr key={sem.key} className={isCurrent ? 'bg-indigo-50' : 'hover:bg-gray-50 transition-colors'}>
<td className="px-3 sm:px-6 py-3 text-sm font-medium text-gray-900">
<span className="text-xs text-gray-500 mr-1">S{sem.week}</span>
{formatDate(firstDate)}{firstDate !== lastDate && <span className="text-gray-400"> a {formatDate(lastDate)}</span>}
</td>
<td className="px-3 sm:px-6 py-3 text-center text-sm text-gray-600 hidden sm:table-cell">{sem.dates.size}</td>
<td className="px-3 sm:px-6 py-3 text-center hidden sm:table-cell"><span className="inline-flex items-center justify-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-bold text-indigo-700">{sem.pets.size}</span></td>
<td className="px-3 sm:px-6 py-3 text-center text-sm text-gray-600 hidden md:table-cell">{sem.items.length}</td>
<td className="px-3 sm:px-6 py-3 text-right text-sm font-semibold text-gray-900">{formatCurrency(sem.total)}</td>
<td className="px-3 sm:px-6 py-3 text-right text-sm font-bold text-indigo-700">{formatCurrency(sem.comissao)}</td>
<td className="px-3 sm:px-6 py-3 text-center hidden md:table-cell">
{isCurrent ? (
<span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700">Semana Atual</span>
) : (
<span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">Fechada</span>
)}
</td>
</tr>
)
})}
<tr className="bg-gray-50">
<td className="px-3 sm:px-6 py-3 text-sm font-bold text-gray-900">Total</td>
<td className="px-3 sm:px-6 py-3 text-center text-sm font-bold text-gray-900 hidden sm:table-cell">{porSemana.reduce((s, w) => s + w.dates.size, 0)}</td>
<td className="px-3 sm:px-6 py-3 text-center hidden sm:table-cell"><span className="inline-flex items-center justify-center rounded-full bg-indigo-200 px-2.5 py-0.5 text-xs font-bold text-indigo-800">{new Set(filtered.flatMap(a => a.pet?.id ? [a.pet.id] : [])).size}</span></td>
<td className="px-3 sm:px-6 py-3 text-center text-sm font-bold text-gray-900 hidden md:table-cell">{filtered.length}</td>
<td className="px-3 sm:px-6 py-3 text-right text-sm font-bold text-gray-900">{formatCurrency(summaryServicosMes)}</td>
<td className="px-3 sm:px-6 py-3 text-right text-sm font-bold text-indigo-800">{formatCurrency(summaryMes)}</td>
<td className="px-3 sm:px-6 py-3 hidden md:table-cell"></td>
</tr>
</tbody>
</table>
</div>
</div>

{/* Pets por Dia - Resumo */}
<div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
<div className="border-b border-gray-100 bg-gray-50 px-3 sm:px-4 py-3">
<div className="flex items-center gap-2">
  <PawPrint size={16} className="text-indigo-600" />
  <span className="text-sm font-semibold text-gray-900">Pets por Dia - {monthLabel} {selectedYear}</span>
</div>
</div>
<div className="overflow-x-auto">
<table className="min-w-full divide-y divide-gray-100">
<thead>
  <tr>
    <th className="px-3 sm:px-6 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Data</th>
    <th className="px-3 sm:px-6 py-2 text-center text-xs font-semibold uppercase tracking-wide text-gray-400">Pets</th>
    <th className="px-3 sm:px-6 py-2 text-center text-xs font-semibold uppercase tracking-wide text-gray-400 hidden md:table-cell">Servicos</th>
    <th className="px-3 sm:px-6 py-2 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Total</th>
    <th className="px-3 sm:px-6 py-2 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Comissao</th>
  </tr>
</thead>
<tbody className="divide-y divide-gray-50">
  {porDia.map((dia) => {
    const diaSemana2 = DIAS_SEMANA[getDayOfWeek(dia.date)]
    const diaFormatado2 = formatDate(dia.date)
    const petsCount = dia.pets.size
    return (
      <tr key={dia.date} className="hover:bg-gray-50 transition-colors">
        <td className="px-3 sm:px-6 py-2.5 text-sm font-medium text-gray-900">{diaSemana2} - {diaFormatado2}</td>
        <td className="px-3 sm:px-6 py-2.5 text-center"><span className="inline-flex items-center justify-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-bold text-indigo-700">{petsCount}</span></td>
        <td className="px-3 sm:px-6 py-2.5 text-center text-sm text-gray-600 hidden md:table-cell">{dia.items.length}</td>
        <td className="px-3 sm:px-6 py-2.5 text-right text-sm font-semibold text-gray-900">{formatCurrency(dia.total)}</td>
        <td className="px-3 sm:px-6 py-2.5 text-right text-sm font-bold text-indigo-700">{formatCurrency(dia.comissao)}</td>
      </tr>
    )
  })}
  <tr className="bg-gray-50">
    <td className="px-6 py-3 text-sm font-bold text-gray-900">Total</td>
    <td className="px-6 py-3 text-center"><span className="inline-flex items-center justify-center rounded-full bg-indigo-200 px-2.5 py-0.5 text-xs font-bold text-indigo-800">{new Set(filtered.flatMap(a => a.pet?.id ? [a.pet.id] : [])).size}</span></td>
    <td className="px-6 py-3 text-center text-sm font-bold text-gray-900">{filtered.length}</td>
    <td className="px-6 py-3 text-right text-sm font-bold text-gray-900">{formatCurrency(summaryServicosMes)}</td>
    <td className="px-6 py-3 text-right text-sm font-bold text-indigo-800">{formatCurrency(summaryMes)}</td>
  </tr>
</tbody>
</table>
</div>
</div>

          {porDia.map((dia) => {
            const diaSemana = DIAS_SEMANA[getDayOfWeek(dia.date)]
            const diaFormatado = formatDate(dia.date)
            return (
              <div key={dia.date} className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 bg-gray-50 px-3 sm:px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-indigo-600" />
                    <span className="text-sm font-semibold text-gray-900">{diaSemana} - {diaFormatado}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-gray-500">{dia.items.length} servico{dia.items.length > 1 ? 's' : ''}</span>
                    <span className="font-semibold text-gray-900">Total: {formatCurrency(dia.total)}</span>
                    <span className="font-bold text-indigo-700">Comissao: {formatCurrency(dia.comissao)}</span>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-100">
                    <thead>
                      <tr>
                        <th className="px-3 sm:px-6 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Pet</th>
                        <th className="hidden sm:table-cell px-6 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Cliente</th>
                        <th className="px-3 sm:px-6 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Servico</th>
                        <th className="hidden md:table-cell px-6 py-2 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Valor</th>
                        <th className="px-3 sm:px-6 py-2 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Comissao</th>
                        <th className="hidden lg:table-cell px-6 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Forma Pag.</th>
                        <th className="hidden xl:table-cell px-6 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Banco</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {dia.items.map((a) => {
                        const valor = parseFloat(a.valor) || 0
                        const comissao = valor * COMISSAO_RATE
                        return (
                          <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-3 text-sm font-medium text-gray-900">{a.pet?.nome || '—'}</td>
                            <td className="hidden sm:table-cell px-6 py-3 text-sm text-gray-700">{a.cliente?.nome || '—'}</td>
                            <td className="px-6 py-3 text-sm text-gray-700">{a.servico?.nome || '—'}</td>
                            <td className="hidden md:table-cell px-6 py-3 text-right text-sm font-semibold text-gray-900">{formatCurrency(valor)}</td>
                            <td className="px-6 py-3 text-right text-sm font-bold text-indigo-700">{formatCurrency(comissao)}</td>
                            <td className="hidden lg:table-cell px-6 py-3">
                              <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                                {FORMA_PAGAMENTO_LABEL[a.forma_pagamento] || a.forma_pagamento || '—'}
                              </span>
                            </td>
                            <td className="hidden xl:table-cell px-6 py-3 text-sm text-gray-600">
                              {a.banco ? (BANCO_LABEL[a.banco] || a.banco) : <span className="text-gray-400">—</span>}
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

          {/* Monthly Total Footer */}
          <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-indigo-700">Total do Mes - {monthLabel} {selectedYear}</p>
                <p className="text-lg font-bold text-indigo-900">{filtered.length} atendimentos</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-indigo-700">Comissao Total</p>
                <p className="text-2xl font-bold text-indigo-900">{formatCurrency(summaryMes)}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
