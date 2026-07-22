import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { formatCurrency } from '../lib/dates'
import { useToast, Toast } from '../components/Toast'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import Spinner from '../components/Spinner'
import EmptyState from '../components/EmptyState'
import { Plus, Pencil, Trash2, Scissors, Clock, DollarSign, ToggleLeft, ToggleRight } from 'lucide-react'

const EMPTY_FORM = {
  nome: '',
  descricao: '',
  preco: '',
  duracao_minutos: '',
  ativo: true,
}

async function fetchServicos() {
  const { data, error } = await supabase
    .from('servicos')
    .select('*')
    .order('preco', { ascending: false })
  if (error) throw new Error(error.message)
  return data || []
}

export default function Servicos() {
  const queryClient = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [deleteId, setDeleteId] = useState(null)
  const { toast, showToast, closeToast } = useToast()

  const { data: servicos = [], isLoading, error: fetchError } = useQuery({
    queryKey: ['servicos'],
    queryFn: fetchServicos,
  })

  useEffect(() => {
    if (fetchError) showToast('Erro ao carregar servicos: ' + fetchError.message, 'error')
  }, [fetchError])

  const saveMutation = useMutation({
    mutationFn: async (payload) => {
      if (editingId) {
        const { error } = await supabase.from('servicos').update(payload).eq('id', editingId)
        if (error) throw error
      } else {
        const { error } = await supabase.from('servicos').insert([payload])
        if (error) throw error
      }
    },
    onSuccess: () => {
      showToast(editingId ? 'Servico atualizado com sucesso!' : 'Servico criado com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['servicos'] })
      closeModal()
    },
    onError: () => showToast('Erro ao salvar servico.', 'error'),
  })

  const toggleMutation = useMutation({
    mutationFn: async (servico) => {
      const novoAtivo = !servico.ativo
      const { error } = await supabase.from('servicos').update({ ativo: novoAtivo }).eq('id', servico.id)
      if (error) throw error
      return novoAtivo
    },
    onSuccess: (novoAtivo) => {
      showToast(novoAtivo ? 'Servico ativado!' : 'Servico desativado!')
      queryClient.invalidateQueries({ queryKey: ['servicos'] })
    },
    onError: () => showToast('Erro ao atualizar status.', 'error'),
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('servicos').delete().eq('id', deleteId)
      if (error) throw error
    },
    onSuccess: () => {
      showToast('Servico excluido com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['servicos'] })
      setDeleteId(null)
    },
    onError: () => {
      showToast('Erro ao excluir servico.', 'error')
      setDeleteId(null)
    },
  })

  function openCreateModal() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setModalOpen(true)
  }

  function openEditModal(servico) {
    setEditingId(servico.id)
    setForm({
      nome: servico.nome || '',
      descricao: servico.descricao || '',
      preco: servico.preco != null ? String(servico.preco) : '',
      duracao_minutos: servico.duracao_minutos != null ? String(servico.duracao_minutos) : '',
      ativo: servico.ativo !== false,
    })
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditingId(null)
    setForm(EMPTY_FORM)
  }

  function handleFormChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.nome.trim()) {
      showToast('Nome e obrigatorio.', 'error')
      return
    }
    if (!form.preco.trim()) {
      showToast('Preco e obrigatorio.', 'error')
      return
    }

    const payload = {
      nome: form.nome.trim(),
      descricao: form.descricao.trim(),
      preco: parseFloat(form.preco),
      duracao_minutos: form.duracao_minutos ? parseInt(form.duracao_minutos, 10) : null,
      ativo: form.ativo,
    }
    saveMutation.mutate(payload)
  }

  function handleToggleAtivo(servico) {
    toggleMutation.mutate(servico)
  }

  function handleDelete() {
    if (!deleteId) return
    deleteMutation.mutate()
  }

  return (
    <div className="space-y-6">
      <Toast toast={toast} onClose={closeToast} />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Scissors size={28} className="text-indigo-600" />
          <h1 className="text-2xl font-bold text-gray-900">Servicos</h1>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
        >
          <Plus size={18} />
          Novo Servico
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <Spinner />
      ) : servicos.length === 0 ? (
        <EmptyState icon={Scissors} message="Nenhum servico cadastrado ainda.">
          <button onClick={openCreateModal} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"><Plus size={16} /> Cadastrar primeiro servico</button>
        </EmptyState>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {servicos.map((servico) => (
            <div
              key={servico.id}
              className={`rounded-xl border bg-white p-5 shadow-sm transition-all hover:shadow-md ${
                servico.ativo
                  ? 'border-gray-200'
                  : 'border-gray-200 opacity-60'
              }`}
            >
              {/* Card Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                    <Scissors size={20} />
                  </div>
                  <div className="min-w-0 overflow-hidden">
                    <h3 className="truncate font-semibold text-gray-900">
                      {servico.nome}
                    </h3>
                    <span
                      className={`mt-0.5 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        servico.ativo
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {servico.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={() => openEditModal(servico)}
                    className="rounded-md p-2.5 text-gray-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                    title="Editar"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => setDeleteId(servico.id)}
                    className="rounded-md p-2.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                    title="Excluir"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Description */}
              {servico.descricao && (
                <p className="mt-3 text-sm text-gray-600 line-clamp-2">
                  {servico.descricao}
                </p>
              )}

              {/* Details */}
              <div className="mt-4 flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-sm text-gray-700">
                  <DollarSign size={15} className="text-indigo-500" />
                  <span className="font-semibold text-indigo-700">
                    {formatCurrency(servico.preco)}
                  </span>
                </div>
                {servico.duracao_minutos != null && (
                  <div className="flex items-center gap-1.5 text-sm text-gray-600">
                    <Clock size={15} className="text-gray-400" />
                    <span>{servico.duracao_minutos} min</span>
                  </div>
                )}
              </div>

              {/* Toggle */}
              <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
                <span className="text-xs font-medium text-gray-500">Status</span>
                <button
                  onClick={() => handleToggleAtivo(servico)}
                  className="flex items-center gap-1.5 rounded-md p-2 transition-colors"
                  title={servico.ativo ? 'Desativar servico' : 'Ativar servico'}
                >
                  {servico.ativo ? (
                    <ToggleRight size={26} className="text-indigo-600" />
                  ) : (
                    <ToggleLeft size={26} className="text-gray-400" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={closeModal} title={editingId ? 'Editar Servico' : 'Novo Servico'} icon={Scissors}>
        <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nome */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Nome <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.nome}
                  onChange={(e) => handleFormChange('nome', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="Ex: Banho e Tosa"
                />
              </div>

              {/* Descricao */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Descricao
                </label>
                <textarea
                  rows={3}
                  value={form.descricao}
                  onChange={(e) => handleFormChange('descricao', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                  placeholder="Descricao do servico..."
                />
              </div>

              {/* Preco & Duracao */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Preco (R$) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                      R$
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={form.preco}
                      onChange={(e) => handleFormChange('preco', e.target.value)}
                      className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      placeholder="50,00"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Duracao (minutos)
                  </label>
                  <div className="relative">
                    <Clock
                      size={15}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="number"
                      min="0"
                      value={form.duracao_minutos}
                      onChange={(e) => handleFormChange('duracao_minutos', e.target.value)}
                      className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-12 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      placeholder="60"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                      min
                    </span>
                  </div>
                </div>
              </div>

              {/* Ativo toggle */}
              <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                <div>
                  <span className="text-sm font-medium text-gray-700">Servico ativo</span>
                  <p className="text-xs text-gray-500">
                    {form.ativo ? 'Disponivel para agendamento' : 'Indisponivel para agendamento'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleFormChange('ativo', !form.ativo)}
                  className="flex items-center transition-colors"
                >
                  {form.ativo ? (
                    <ToggleRight size={28} className="text-indigo-600" />
                  ) : (
                    <ToggleLeft size={28} className="text-gray-400" />
                  )}
                </button>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button type="button" onClick={closeModal} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Cancelar</button>
                <button type="submit" disabled={saveMutation.isPending} className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  {saveMutation.isPending ? (<span className="flex items-center gap-2"><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Salvando...</span>) : editingId ? 'Salvar Alteracoes' : 'Criar Servico'}
                </button>
              </div>
            </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Excluir servico"
        message="Tem certeza que deseja excluir este servico? Esta acao nao pode ser desfeita."
      />
    </div>
  )
}
