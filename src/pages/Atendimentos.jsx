import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { formatDate, formatDateTime, formatTime, formatCurrency, isToday, toLocalDatetimeValue, toLocalDateValue, getLocalDateISO, extractDateKey } from '../lib/dates'
import {
  Plus,
  Pencil,
  Trash2,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  X,
  CreditCard,
  DollarSign,
  Banknote,
  ChevronLeft,
  ChevronRight,
  PawPrint,
} from 'lucide-react'

const BANCO_OPTIONS = [
  { value: '', label: 'Nenhum' },
  { value: 'mercado_pago', label: 'Mercado Pago' },
  { value: 'pagseguro', label: 'PagSeguro' },
  { value: 'pagseguro_juridico', label: 'PagSeguro Juridico' },
  { value: 'caixa_loja', label: 'Caixa Loja' },
]

const BANCO_LABEL = Object.fromEntries(BANCO_OPTIONS.map(b => [b.value, b.label]))

const EMPTY_FORM = {
  cliente_id: '',
  pet_id: '',
  servico_id: '',
  data_hora: '',
  status: 'agendado',
  valor: '',
  observacoes: '',
  forma_pagamento: 'pix',
  forma_pagamento_2: '',
  valor_2: '',
  banco_2: 'caixa_loja',
  status_pagamento: 'pendente',
  data_vencimento: '',
  banco: 'mercado_pago',
}

const STATUS_OPTIONS = [
  { value: 'agendado', label: 'Agendado' },
  { value: 'em_andamento', label: 'Em Andamento' },
  { value: 'concluido', label: 'Concluido' },
  { value: 'cancelado', label: 'Cancelado' },
]

const FORMA_PAGAMENTO_OPTIONS = [
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'cartao_credito', label: 'Cartao de Credito' },
  { value: 'cartao_debito', label: 'Cartao de Debito' },
  { value: 'pix', label: 'Pix' },
  { value: 'permuta', label: 'Permuta' },
]

const STATUS_PAGAMENTO_OPTIONS = [
  { value: 'pago', label: 'Pago' },
  { value: 'pendente', label: 'Pendente' },
  { value: 'vencido', label: 'Vencido' },
]

const STATUS_BADGE = {
  agendado: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  em_andamento: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  concluido: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  cancelado: 'bg-gray-50 text-gray-500 ring-gray-500/20',
}

const STATUS_ICON = {
  agendado: Calendar,
  em_andamento: Clock,
  concluido: CheckCircle,
  cancelado: XCircle,
}

const STATUS_LABEL = {
  agendado: 'Agendado',
  em_andamento: 'Em Andamento',
  concluido: 'Concluido',
  cancelado: 'Cancelado',
}

const PAGAMENTO_STATUS_BADGE = {
  pago: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  pendente: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  vencido: 'bg-red-50 text-red-700 ring-red-600/20',
}

const PAGAMENTO_STATUS_LABEL = {
  pago: 'Pago',
  pendente: 'Pendente',
  vencido: 'Vencido',
}

const FORMA_PAGAMENTO_LABEL = {
  dinheiro: 'Dinheiro',
  cartao_credito: 'Cartao de Credito',
  cartao_debito: 'Cartao de Debito',
  pix: 'Pix',
  permuta: 'Permuta',
}

const FORMA_PAGAMENTO_BADGE = {
  dinheiro: 'bg-green-50 text-green-700 ring-green-600/20',
  cartao_credito: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  cartao_debito: 'bg-sky-50 text-sky-700 ring-sky-600/20',
  pix: 'bg-violet-50 text-violet-700 ring-violet-600/20',
  permuta: 'bg-purple-50 text-purple-700 ring-purple-600/20',
}

const NEXT_STATUS = {
  agendado: 'em_andamento',
  em_andamento: 'concluido',
  concluido: null,
  cancelado: null,
}

const NEXT_STATUS_LABEL = {
  agendado: 'Iniciar',
  em_andamento: 'Concluir',
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

const availableYears = (() => { const c = new Date().getFullYear(); const y = []; for (let i = c - 3; i <= c + 1; i++) y.push(i); return y })()

const TABS = [
  { value: 'todos', label: 'Todos' },
  { value: 'agendado', label: 'Agendados' },
  { value: 'em_andamento', label: 'Em Andamento' },
  { value: 'concluido', label: 'Concluidos' },
  { value: 'cancelado', label: 'Cancelados' },
]

export default function Atendimentos() {
  const [atendimentos, setAtendimentos] = useState([])
  const [clientes, setClientes] = useState([])
  const [pets, setPets] = useState([])
  const [servicos, setServicos] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('todos')
  const [filterDate, setFilterDate] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [toast, setToast] = useState(null)
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear())

  useEffect(() => {
    fetchAtendimentos()
    fetchClientes()
    fetchServicos()
    fetchPets()
  }, [selectedMonth, selectedYear])

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  const filteredPets = useMemo(() => {
    if (!form.cliente_id) return pets
    return pets.filter((p) => p.cliente_id === form.cliente_id)
  }, [pets, form.cliente_id])

  async function fetchAtendimentos() {
    setLoading(true)
    const lastDay = new Date(selectedYear, selectedMonth, 0).getDate()
    const start = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`
    const end = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
    const { data, error } = await supabase
      .from('atendimentos')
      .select('*, pet:pet_id(id, nome, especie), cliente:cliente_id(id, nome), servico:servico_id(id, nome, preco)')
      .gte('data_hora', start + 'T00:00:00')
      .lte('data_hora', end + 'T23:59:59')
      .order('data_hora', { ascending: false })

    if (error) {
      showToast('Erro ao carregar atendimentos: ' + error.message, 'error')
    } else {
      setAtendimentos(data || [])
    }
    setLoading(false)
  }

  async function fetchClientes() {
    const { data, error } = await supabase
      .from('clientes')
      .select('id, nome')
      .order('nome', { ascending: true })

    if (!error) setClientes(data || [])
  }

  async function fetchPets() {
    const { data, error } = await supabase
      .from('pets')
      .select('id, nome, cliente_id, especie')
      .order('nome', { ascending: true })

    if (!error) setPets(data || [])
  }

  async function fetchServicos() {
    const { data, error } = await supabase
      .from('servicos')
      .select('id, nome, preco')
      .order('preco', { ascending: false })

    if (!error) setServicos(data || [])
  }

  function showToast(message, type = 'success') {
    setToast({ message, type })
  }

  function openCreateModal() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setModalOpen(true)
  }

  function openEditModal(atendimento) {
    setEditingId(atendimento.id)
    setForm({
      cliente_id: atendimento.cliente_id || '',
      pet_id: atendimento.pet_id || '',
      servico_id: atendimento.servico_id || '',
      data_hora: toLocalDatetimeValue(atendimento.data_hora),
      status: atendimento.status || 'agendado',
      valor: atendimento.valor != null ? String(atendimento.valor) : '',
      observacoes: atendimento.observacoes || '',
      forma_pagamento: atendimento.forma_pagamento || 'dinheiro',
      forma_pagamento_2: atendimento.forma_pagamento_2 || '',
      valor_2: atendimento.valor_2 != null ? String(atendimento.valor_2) : '',
      banco_2: atendimento.banco_2 || 'caixa_loja',
      status_pagamento: atendimento.status_pagamento || 'pendente',
      data_vencimento: atendimento.data_vencimento ? toLocalDateValue(atendimento.data_vencimento) : '',
      banco: atendimento.banco || 'mercado_pago',
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

      // When cliente_id changes, reset pet_id
      if (field === 'cliente_id') {
        next.pet_id = ''
      }

      // When servico_id changes, auto-fill valor from service price
      if (field === 'servico_id') {
        const servico = servicos.find((s) => s.id === value)
        if (servico && servico.preco != null) {
          next.valor = String(servico.preco)
        }
      }

      // When status changes to concluido, auto-set status_pagamento to pago
      if (field === 'status' && value === 'concluido') {
        next.status_pagamento = 'pago'
      }

      // When forma_pagamento_2 is cleared, reset banco_2 and valor_2
    if (field === 'forma_pagamento_2' && !value) {
      next.banco_2 = ''
      next.valor_2 = ''
    }

    return next
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.cliente_id) {
      showToast('Selecione um cliente.', 'error')
      return
    }
    if (!form.pet_id) {
      showToast('Selecione um pet.', 'error')
      return
    }
    if (!form.servico_id) {
      showToast('Selecione um servico.', 'error')
      return
    }
    if (!form.data_hora) {
      showToast('Informe a data e hora.', 'error')
      return
    }

    setSaving(true)
    const payload = {
      cliente_id: form.cliente_id,
      pet_id: form.pet_id,
      servico_id: form.servico_id,
      data_hora: new Date(form.data_hora).toISOString(),
      status: form.status,
      valor: form.valor ? parseFloat(form.valor) : null,
      observacoes: form.observacoes.trim(),
      forma_pagamento: form.forma_pagamento,
      forma_pagamento_2: form.forma_pagamento_2 || null,
  valor_2: form.forma_pagamento_2 ? (form.valor_2 ? parseFloat(form.valor_2) : null) : null,
  banco_2: form.forma_pagamento_2 ? (form.banco_2 || null) : null,
      status_pagamento: form.status_pagamento,
      data_vencimento: form.data_vencimento || null,
      banco: form.banco || null,
    }

    let error
    if (editingId) {
      ;({ error } = await supabase
        .from('atendimentos')
        .update(payload)
        .eq('id', editingId))
    } else {
      ;({ error } = await supabase.from('atendimentos').insert([payload]))
    }

    if (error) {
      showToast('Erro ao salvar atendimento.', 'error')
    } else {
      showToast(
        editingId
          ? 'Atendimento atualizado com sucesso!'
          : 'Atendimento criado com sucesso!'
      )

      const valorNum = payload.valor ? parseFloat(payload.valor) : 0

      if (editingId) {
        // Editing existing atendimento
        if (payload.status === 'concluido' && valorNum > 0) {
          const { data: finEntry } = await supabase
            .from('financeiro')
            .select('id')
            .eq('atendimento_id', editingId)
            .limit(1)

          if (finEntry && finEntry.length > 0) {
            await supabase
              .from('financeiro')
              .update({
                valor: valorNum,
                forma_pagamento: payload.forma_pagamento,
                data: getLocalDateISO(new Date(payload.data_hora)),
              })
              .eq('id', finEntry[0].id)
          } else {
            await createFinanceiroFromAtendimento(editingId, payload)
          }
        }

        if (payload.status !== 'concluido') {
          const { data: finEntry } = await supabase
            .from('financeiro')
            .select('id')
            .eq('atendimento_id', editingId)
            .limit(1)

          if (finEntry && finEntry.length > 0) {
            await supabase
              .from('financeiro')
              .delete()
              .eq('id', finEntry[0].id)
          }
        }
      } else if (payload.status === 'concluido' && valorNum > 0) {
        // New atendimento created as concluido — needs financeiro entry
        const { data: newAtend } = await supabase
          .from('atendimentos')
          .select('id')
          .eq('cliente_id', payload.cliente_id)
          .eq('data_hora', payload.data_hora)
          .order('created_at', { ascending: false })
          .limit(1)

        if (newAtend && newAtend.length > 0) {
          await createFinanceiroFromAtendimento(newAtend[0].id, payload)
        }
      }

      closeModal()
      fetchAtendimentos()
    }
    setSaving(false)
  }

  async function createFinanceiroFromAtendimento(atendimentoId, payloadOrAtendimento) {
  const { data: existing } = await supabase
    .from('financeiro')
    .select('id')
    .eq('atendimento_id', atendimentoId)
    .limit(1)

  if (existing && existing.length > 0) return

  let servicoNome = payloadOrAtendimento.servico?.nome
  let petNome = payloadOrAtendimento.pet?.nome
  let clienteNome = payloadOrAtendimento.cliente?.nome

  if (!servicoNome || !petNome || !clienteNome) {
    const { data: fullAtend } = await supabase
      .from('atendimentos')
      .select('*, pet:pet_id(id, nome), cliente:cliente_id(id, nome), servico:servico_id(id, nome)')
      .eq('id', atendimentoId)
      .limit(1)

    if (fullAtend && fullAtend.length > 0) {
      servicoNome = servicoNome || fullAtend[0].servico?.nome || 'Servico'
      petNome = petNome || fullAtend[0].pet?.nome || ''
      clienteNome = clienteNome || fullAtend[0].cliente?.nome || ''
    }
  }

  const valor = parseFloat(payloadOrAtendimento.valor) || 0
  const valor2 = parseFloat(payloadOrAtendimento.valor_2) || 0
  if (valor <= 0 && valor2 <= 0) return

  const dataPag = payloadOrAtendimento.data_hora
    ? getLocalDateISO(new Date(payloadOrAtendimento.data_hora))
    : getLocalDateISO()

  const baseDesc = (servicoNome || 'Servico') + ' - ' + petNome + ' (' + clienteNome + ')'

  const entries = []

  if (valor > 0) {
    entries.push({
      tipo: 'entrada',
      categoria: 'Servicos',
      descricao: baseDesc,
      valor: valor,
      data: dataPag,
      forma_pagamento: payloadOrAtendimento.forma_pagamento || 'pix',
      banco: payloadOrAtendimento.banco || null,
      grupo: 'Servicos',
      atendimento_id: atendimentoId,
    })
  }

  if (valor2 > 0 && payloadOrAtendimento.forma_pagamento_2) {
    entries.push({
      tipo: 'entrada',
      categoria: 'Servicos',
      descricao: baseDesc + ' (2a forma)',
      valor: valor2,
      data: dataPag,
      forma_pagamento: payloadOrAtendimento.forma_pagamento_2,
      banco: payloadOrAtendimento.banco_2 || payloadOrAtendimento.banco || null,
      grupo: 'Servicos',
      atendimento_id: atendimentoId,
    })
  }

  if (entries.length > 0) {
    await supabase.from('financeiro').insert(entries)
    showToast('Entrada financeira criada automaticamente!')
  }
}

async function handleChangeStatus(atendimento, newStatus) {
    const updates = { status: newStatus }

    if (newStatus === 'concluido') {
      updates.status_pagamento = 'pago'
    }

    const { error } = await supabase
      .from('atendimentos')
      .update(updates)
      .eq('id', atendimento.id)

    if (error) {
      showToast('Erro ao atualizar status.', 'error')
    } else {
      showToast(`Status alterado para "${STATUS_LABEL[newStatus]}".`)
      setAtendimentos((prev) =>
        prev.map((a) =>
          a.id === atendimento.id ? { ...a, ...updates } : a
        )
      )

      // Auto-create financeiro entry when concluded (prevent duplicates)
      if (newStatus === 'concluido') {
        await createFinanceiroFromAtendimento(atendimento.id, atendimento)
      }

      // Remove financeiro entry when status changes away from concluido
      if (atendimento.status === 'concluido' && newStatus !== 'concluido') {
        const { data: finEntry } = await supabase
          .from('financeiro')
          .select('id')
          .eq('atendimento_id', atendimento.id)
          .limit(1)

        if (finEntry && finEntry.length > 0) {
          await supabase
            .from('financeiro')
            .delete()
            .eq('id', finEntry[0].id)
        }
      }
    }
  }

  async function handleMarcarPago(atendimento) {
    const { error } = await supabase
      .from('atendimentos')
      .update({ status_pagamento: 'pago' })
      .eq('id', atendimento.id)

    if (error) {
      showToast('Erro ao marcar pagamento.', 'error')
    } else {
      showToast('Pagamento marcado como pago!')
      setAtendimentos((prev) =>
        prev.map((a) =>
          a.id === atendimento.id ? { ...a, status_pagamento: 'pago' } : a
        )
      )
    }
  }

  async function handleDelete() {
    if (!deleteId) return
    const { error } = await supabase
      .from('atendimentos')
      .delete()
      .eq('id', deleteId)

    if (error) {
      showToast('Erro ao excluir atendimento.', 'error')
    } else {
      // Also remove linked financeiro entry
      await supabase
        .from('financeiro')
        .delete()
        .eq('atendimento_id', deleteId)

      showToast('Atendimento excluido com sucesso!')
      fetchAtendimentos()
    }
    setDeleteId(null)
  }

  const filtered = atendimentos.filter((a) => {
    // Tab filter
    if (activeTab !== 'todos' && a.status !== activeTab) return false

    // Date filter
    if (filterDate) {
      const atendimentoDate = a.data_hora ? extractDateKey(a.data_hora) : ''
      if (atendimentoDate !== filterDate) return false
    }

    // Search filter
    if (!search.trim()) return true
    const term = search.toLowerCase()
    return (
      (a.cliente?.nome && a.cliente.nome.toLowerCase().includes(term)) ||
      (a.pet?.nome && a.pet.nome.toLowerCase().includes(term)) ||
      (a.servico?.nome && a.servico.nome.toLowerCase().includes(term)) ||
      (a.observacoes && a.observacoes.toLowerCase().includes(term))
    )
  })

  const tabCounts = useMemo(() => {
    const counts = { todos: atendimentos.length }
    for (const a of atendimentos) {
      counts[a.status] = (counts[a.status] || 0) + 1
    }
    return counts
  }, [atendimentos])

  const DAY_NAMES = ['Domingo', 'Segunda', 'Terca', 'Quarta', 'Quinta', 'Sexta', 'Sabado']

  const groupedByDay = useMemo(() => {
    const groups = []
    const map = new Map()
    for (const a of filtered) {
      const key = extractDateKey(a.data_hora)
      if (!map.has(key)) {
        map.set(key, [])
      }
      map.get(key).push(a)
    }
    for (const [dateKey, items] of map) {
      const d = new Date(dateKey + 'T12:00:00')
      const dayName = DAY_NAMES[d.getDay()]
      const day = String(d.getDate()).padStart(2, '0')
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const label = `${dayName}, ${day}/${month}`
      const today = isToday(dateKey + 'T12:00:00')
      groups.push({ dateKey, label, today, items })
    }
    return groups
  }, [filtered])

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
        <div className="flex items-center gap-2 min-w-0">
          <Calendar size={28} className="text-indigo-600" />
          <h1 className="text-2xl font-bold text-gray-900">Atendimentos</h1>
          <div className="ml-4 flex items-center gap-1">
            <button
              onClick={() => {
                if (selectedMonth === 1) { setSelectedMonth(12); setSelectedYear(y => y - 1) }
                else setSelectedMonth(m => m - 1)
              }}
              className="rounded-lg border border-gray-200 p-1.5 text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
              title="Mes anterior"
            >
              <ChevronLeft size={16} />
            </button>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="rounded-lg border border-gray-300 px-2 py-1 text-sm font-medium text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {MESES.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="rounded-lg border border-gray-300 px-2 py-1 text-sm font-medium text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
              className="rounded-lg border border-gray-200 p-1.5 text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
              title="Proximo mes"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
        >
          <Plus size={18} />
          Novo Atendimento
        </button>
      </div>

      {/* Search + Date Filter + Tabs */}
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search */}
          <div className="relative max-w-md flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Buscar por cliente, pet ou servico..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-10 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            )}
          </div>
          {/* Date Filter */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Calendar
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            {filterDate && (
              <button
                onClick={() => setFilterDate('')}
                className="rounded-lg border border-gray-200 px-3 py-2.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Limpar data
              </button>
            )}
          </div>
        </div>

        {/* Status Tabs */}
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
              <span
                className={`inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-xs font-semibold ${
                  activeTab === tab.value
                    ? 'bg-white/20 text-white'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
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
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white py-16 text-center">
          <Calendar size={40} className="mx-auto text-gray-300" />
          <p className="mt-3 text-gray-500">
            {search || activeTab !== 'todos'
              ? 'Nenhum atendimento encontrado para os filtros aplicados.'
              : 'Nenhum atendimento cadastrado ainda.'}
          </p>
          {!search && activeTab === 'todos' && (
            <button
              onClick={openCreateModal}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
            >
              <Plus size={16} />
              Agendar primeiro atendimento
            </button>
          )}
        </div>
      ) : (
  <div className="space-y-4">
    {groupedByDay.map((day) => (
      <div key={day.dateKey} className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className={`px-4 sm:px-6 py-3 border-b border-gray-200 flex items-center justify-between ${
          day.today ? "bg-indigo-50" : "bg-gray-50"
        }`}>
          <div className="flex items-center gap-2">
            <Calendar size={18} className={day.today ? "text-indigo-600" : "text-gray-500"} />
            <span className={`text-sm font-semibold ${day.today ? "text-indigo-700" : "text-gray-700"}`}>
              {day.label}
            </span>
            {day.today && (
              <span className="inline-flex items-center rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-bold text-indigo-700">
                Hoje
              </span>
            )}
          </div>
          <span className="text-xs font-medium text-gray-500">
            {day.items.length} atendimento{day.items.length !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full divide-y divide-gray-100 table-fixed">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-gray-500">
                <th className="px-2 py-2 text-left font-semibold">Pet / Cliente</th>
                <th className="px-2 py-2 text-left font-semibold">Servico</th>
                <th className="hidden sm:table-cell px-2 py-2 text-left font-semibold">Hora</th>
                <th className="hidden md:table-cell px-2 py-2 text-left font-semibold">Status</th>
                <th className="hidden lg:table-cell px-2 py-2 text-left font-semibold">Pagamento</th>
                <th className="hidden xl:table-cell px-2 py-2 text-left font-semibold">Banco</th>
                <th className="hidden lg:table-cell px-2 py-2 text-right font-semibold">Valor</th>
                <th className="px-2 py-2 text-right font-semibold">Acoes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {day.items.map((atendimento) => {
                const StatusIcon = STATUS_ICON[atendimento.status] || AlertCircle
                const nextStatus = NEXT_STATUS[atendimento.status]
                const nextLabel = NEXT_STATUS_LABEL[atendimento.status]
                const pagamentoStatus = atendimento.status_pagamento || "pendente"
                const formaPagamento = atendimento.forma_pagamento || "dinheiro"

                return (
                  <tr key={atendimento.id} className="transition-colors hover:bg-gray-50">
                    <td className="px-2 py-2 max-w-[120px] sm:max-w-[150px]">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                          <PawPrint size={14} />
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-gray-900 truncate">
                            {atendimento.pet?.nome || "\u2014"}
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            {atendimento.cliente?.nome || "\u2014"}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-2 py-2 text-sm text-gray-700 max-w-[100px] sm:max-w-[130px] truncate">
                      {atendimento.servico?.nome || "\u2014"}
                    </td>

                    <td className="hidden sm:table-cell px-2 py-2">
                      <div className="flex items-center gap-1 text-sm text-gray-700">
                        <Clock size={14} className="text-gray-400" />
                        <span>{formatTime(atendimento.data_hora)}</span>
                      </div>
                    </td>

                    <td className="hidden md:table-cell px-2 py-2">
                      <span
                        className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
                          STATUS_BADGE[atendimento.status] || STATUS_BADGE.agendado
                        }`}
                      >
                        <StatusIcon size={12} />
                        {STATUS_LABEL[atendimento.status] || atendimento.status}
                      </span>
                    </td>

                    <td className="hidden lg:table-cell px-2 py-2">
                      <div className="flex flex-col gap-1 text-left items-start">
                        <span
                          className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
                            PAGAMENTO_STATUS_BADGE[pagamentoStatus] || PAGAMENTO_STATUS_BADGE.pendente
                          }`}
                        >
                          {pagamentoStatus === "pago" && <CheckCircle size={12} />}
                          {pagamentoStatus === "pendente" && <Clock size={12} />}
                          {pagamentoStatus === "vencido" && <AlertCircle size={12} />}
                          {PAGAMENTO_STATUS_LABEL[pagamentoStatus] || pagamentoStatus}
                        </span>
                        <span
                          className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
                            FORMA_PAGAMENTO_BADGE[formaPagamento] || FORMA_PAGAMENTO_BADGE.loja
                          }`}
                        >
                          <DollarSign size={10} />
                          {FORMA_PAGAMENTO_LABEL[formaPagamento] || formaPagamento}
                        </span>
                        {atendimento.data_vencimento && (
                          <span className="text-xs text-gray-400">
                            Venc: {formatDate(atendimento.data_vencimento)}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="hidden xl:table-cell px-2 py-2 text-sm text-gray-600">
                      {atendimento.banco ? (BANCO_LABEL[atendimento.banco] || atendimento.banco) : <span className="text-gray-400">{"\u2014"}</span>}
                    </td>

                    <td className="hidden lg:table-cell px-2 py-2 text-right text-sm font-semibold text-indigo-700">
                      {formatCurrency(atendimento.valor)}
                    </td>

                    <td className="px-2 py-2 text-right w-[110px] sm:w-auto">
                      <div className="flex items-center justify-end gap-1 flex-nowrap">
                        {(pagamentoStatus === "pendente" || pagamentoStatus === "vencido") && (
                          <button
                            onClick={() => handleMarcarPago(atendimento)}
                            className="inline-flex items-center gap-1 rounded-lg px-2 py-2 text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                            title="Marcar como Pago"
                          >
                            <Banknote size={12} />
                            Pago
                          </button>
                        )}
                        {nextStatus && nextLabel && (
                          <button
                            onClick={() => handleChangeStatus(atendimento, nextStatus)}
                            className={`inline-flex items-center gap-1 rounded-lg px-2 py-2 text-xs font-semibold transition-colors ${
                              nextStatus === "em_andamento"
                                ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
                                : nextStatus === "concluido"
                                ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                            }`}
                            title={`Mover para ${STATUS_LABEL[nextStatus]}`}
                          >
                            {nextStatus === "em_andamento" && <Clock size={12} />}
                            {nextStatus === "concluido" && <CheckCircle size={12} />}
                            {nextLabel}
                          </button>
                        )}
                        {atendimento.status !== "cancelado" && (
                          <button
                            onClick={() => handleChangeStatus(atendimento, "cancelado")}
                            className="rounded-md p-2.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                            title="Cancelar atendimento"
                          >
                            <XCircle size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => openEditModal(atendimento)}
                          className="rounded-md p-2.5 text-gray-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                          title="Editar"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => setDeleteId(atendimento.id)}
                          className="rounded-md p-2.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                          title="Excluir"
                        >
                          <Trash2 size={16} />
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
    ))}
  </div>
)}

{/* Create/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={closeModal}
          />
          <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl bg-white p-4 sm:p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingId ? 'Editar Atendimento' : 'Novo Atendimento'}
              </h2>
              <button
                onClick={closeModal}
                className="rounded-md p-1 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Cliente */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Cliente <span className="text-gray-400">(opcional)</span>
                </label>
                <select
                  required
                  value={form.cliente_id}
                  onChange={(e) => handleFormChange('cliente_id', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">Selecione o cliente</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                    </option>
                  ))}
                </select>
              </div>

              {/* Pet (filtered by selected client) */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Pet <span className="text-gray-400">(opcional)</span>
                </label>
                <select
                  required
                  value={form.pet_id}
                  onChange={(e) => handleFormChange('pet_id', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-50 disabled:text-gray-400"
                  disabled={!form.cliente_id}
                >
                  <option value="">
                    {form.cliente_id
                      ? 'Selecione o pet'
                      : 'Selecione um cliente primeiro'}
                  </option>
                  {filteredPets.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome}
                      {p.especie ? ` (${p.especie})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Servico */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Servico <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={form.servico_id}
                  onChange={(e) => handleFormChange('servico_id', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">Selecione o servico</option>
                  {servicos.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nome} {'—'} {formatCurrency(s.preco)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Data/Hora & Status */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Data e Hora <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Calendar
                      size={15}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="datetime-local"
                      required
                      value={form.data_hora}
                      onChange={(e) =>
                        handleFormChange('data_hora', e.target.value)
                      }
                      className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) =>
                      handleFormChange('status', e.target.value)
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Valor */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Valor (R$)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                    R$
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.valor}
                    onChange={(e) => handleFormChange('valor', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="0,00"
                  />
                </div>
              </div>

              {/* 1a Forma de Pagamento + Banco + Status */}
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <label className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-700">
                <CreditCard size={15} />
                Pagamento
              </label>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="relative">
                  <CreditCard
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <select
                    value={form.forma_pagamento}
                    onChange={(e) =>
                      handleFormChange('forma_pagamento', e.target.value)
                    }
                    className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-sm text-gray-900 text-left focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    {FORMA_PAGAMENTO_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <select
                  value={form.banco}
                  onChange={(e) => handleFormChange('banco', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  {BANCO_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label === 'Nenhum' ? 'Sem banco' : opt.label}
                    </option>
                  ))}
                </select>
                <select
                  value={form.status_pagamento}
                  onChange={(e) =>
                    handleFormChange('status_pagamento', e.target.value)
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  {STATUS_PAGAMENTO_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 2a Forma de Pagamento + Banco */}
            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4">
              <label className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-700">
                <CreditCard size={15} />
                2a Forma de Pagamento
                <span className="text-xs text-gray-400">(opcional)</span>
              </label>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <select
                  value={form.forma_pagamento_2}
                  onChange={(e) => handleFormChange('forma_pagamento_2', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">Nenhuma</option>
                  {FORMA_PAGAMENTO_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                    R$
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.valor_2}
                    onChange={(e) => handleFormChange('valor_2', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="Valor da 2a forma"
                    disabled={!form.forma_pagamento_2}
                  />
                </div>
                <select
                  value={form.banco_2}
                  onChange={(e) => handleFormChange('banco_2', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  disabled={!form.forma_pagamento_2}
                >
                  {BANCO_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label === 'Nenhum' ? 'Sem banco' : opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Data de Vencimento */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Data de Vencimento
              </label>
              <div className="relative">
                <Calendar
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="date"
                  value={form.data_vencimento}
                  onChange={(e) =>
                    handleFormChange('data_vencimento', e.target.value)
                  }
                  className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Observacoes */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Observacoes
                </label>
                <textarea
                  rows={3}
                  value={form.observacoes}
                  onChange={(e) =>
                    handleFormChange('observacoes', e.target.value)
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                  placeholder="Observacoes sobre o atendimento..."
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Salvando...
                    </span>
                  ) : editingId ? (
                    'Salvar Alteracoes'
                  ) : (
                    'Criar Atendimento'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setDeleteId(null)}
          />
          <div className="relative w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                <AlertCircle size={20} />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">
                Excluir atendimento
              </h2>
            </div>
            <p className="mt-3 text-sm text-gray-600">
              Tem certeza que deseja excluir este atendimento? Esta acao nao pode
              ser desfeita.
            </p>
            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 transition-colors"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
