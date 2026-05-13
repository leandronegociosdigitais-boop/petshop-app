import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { formatDate, formatDateTime } from '../lib/dates'
import { Plus, Pencil, Trash2, Search, X, Phone, MapPin, MessageCircle, Hash, PawPrint, Calendar, Clock, DollarSign, ChevronRight, User } from 'lucide-react'

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

const EMPTY_FORM = {
  nome: '',
  telefone: '',
  endereco: '',
  observacoes: '',
}

function formatCurrency(value) {
  if (value == null) return 'R$ 0,00'
  const num = parseFloat(value)
  if (isNaN(num)) return 'R$ 0,00'
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function Clientes() {
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [toast, setToast] = useState(null)

  // History drawer state
  const [historyCliente, setHistoryCliente] = useState(null)
  const [historyPets, setHistoryPets] = useState([])
  const [historyAtendimentos, setHistoryAtendimentos] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)

  useEffect(() => { fetchClientes() }, [])

  useEffect(() => {
    if (toast) { const timer = setTimeout(() => setToast(null), 3000); return () => clearTimeout(timer) }
  }, [toast])

  async function fetchClientes() {
    setLoading(true)
    const { data, error } = await supabase.from('clientes').select('*').order('codigo', { ascending: true, nullsFirst: false })
    if (error) { showToast('Erro ao carregar clientes: ' + error.message, 'error') } else { setClientes(data || []) }
    setLoading(false)
  }

  async function generateCodigo() {
    const { data } = await supabase.from('clientes').select('codigo').not('codigo', 'is', null).order('codigo', { ascending: false }).limit(1)
    if (data && data.length > 0 && data[0].codigo) {
      const num = parseInt(data[0].codigo.replace(/\D/g, '')) || 0
      return String(num + 1).padStart(4, '0')
    }
    return '0001'
  }

  function showToast(message, type = 'success') { setToast({ message, type }) }

  function openCreateModal() { setEditingId(null); setForm(EMPTY_FORM); setModalOpen(true) }

  function openEditModal(cliente) {
    setEditingId(cliente.id)
    setForm({
      nome: cliente.nome || '',
      telefone: cliente.telefone || '',
      endereco: cliente.endereco || '',
      observacoes: cliente.observacoes || '',
    })
    setModalOpen(true)
  }

  function closeModal() { setModalOpen(false); setEditingId(null); setForm(EMPTY_FORM) }

  function handleFormChange(field, value) { setForm((prev) => ({ ...prev, [field]: value })) }

  function openWhatsApp(telefone) {
    if (!telefone) return
    const numero = telefone.replace(/\D/g, '')
    window.open(`https://wa.me/55${numero}`, '_blank')
  }

  async function openHistory(cliente) {
    setHistoryCliente(cliente)
    setHistoryLoading(true)
    const [petsRes, atendRes] = await Promise.all([
      supabase.from('pets').select('*').eq('cliente_id', cliente.id).order('nome'),
      supabase.from('atendimentos')
        .select('*, pet:pet_id(id, nome, especie), servico:servico_id(id, nome, preco)')
        .eq('cliente_id', cliente.id)
        .order('data_hora', { ascending: false }),
    ])
    setHistoryPets(petsRes.data || [])
    setHistoryAtendimentos(atendRes.data || [])
    setHistoryLoading(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.nome.trim()) { showToast('Nome e obrigatorio.', 'error'); return }
    setSaving(true)
    const payload = {
      nome: form.nome.trim(),
      telefone: form.telefone.trim(),
      endereco: form.endereco.trim(),
      observacoes: form.observacoes.trim(),
    }
    let error
    if (editingId) {
      ;({ error } = await supabase.from('clientes').update(payload).eq('id', editingId))
    } else {
      const codigo = await generateCodigo()
      payload.codigo = codigo
      ;({ error } = await supabase.from('clientes').insert([payload]))
    }
    if (error) { showToast('Erro ao salvar cliente.', 'error') }
    else { showToast(editingId ? 'Cliente atualizado com sucesso!' : `Cliente criado! Codigo: ${payload.codigo}`); closeModal(); fetchClientes() }
    setSaving(false)
  }

  async function handleDelete() {
    if (!deleteId) return
    const { error } = await supabase.from('clientes').delete().eq('id', deleteId)
    if (error) { showToast('Erro ao excluir cliente.', 'error') } else { showToast('Cliente excluido com sucesso!'); fetchClientes() }
    setDeleteId(null)
  }

  const filtered = clientes.filter((c) => {
    if (!search.trim()) return true
    const term = search.toLowerCase()
    return (c.nome && c.nome.toLowerCase().includes(term))
      || (c.telefone && c.telefone.toLowerCase().includes(term))
      || (c.codigo && c.codigo.toLowerCase().includes(term))
  })

  const totalGasto = historyAtendimentos
    .filter(a => a.status === 'concluido')
    .reduce((sum, a) => sum + (parseFloat(a.valor) || 0), 0)

  const totalAtendimentos = historyAtendimentos.filter(a => a.status === 'concluido').length

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-2 rounded-lg px-5 py-3 text-sm font-medium shadow-lg transition-all ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'}`}>
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 hover:opacity-80"><X size={16} /></button>
        </div>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
        <button onClick={openCreateModal} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors">
          <Plus size={18} /> Novo Cliente
        </button>
      </div>

      <div className="relative max-w-md">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" placeholder="Buscar por codigo, nome ou telefone..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-10 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
        {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X size={16} /></button>}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" /></div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white py-16 text-center">
          <p className="text-gray-500">{search ? 'Nenhum cliente encontrado para a busca.' : 'Nenhum cliente cadastrado ainda.'}</p>
          {!search && <button onClick={openCreateModal} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"><Plus size={16} /> Cadastrar primeiro cliente</button>}
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Codigo</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Nome</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Contato</th>
                  <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Endereco</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Acoes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((cliente) => (
                  <tr key={cliente.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-1 text-xs font-bold text-indigo-700">
                        <Hash size={12} />{cliente.codigo || '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button onClick={() => openHistory(cliente)} className="font-medium text-gray-900 hover:text-indigo-600 transition-colors text-left flex items-center gap-1 group">
                        {cliente.nome}
                        <ChevronRight size={14} className="text-gray-300 group-hover:text-indigo-500 transition-colors" />
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      {cliente.telefone ? (
                        <div className="flex items-center gap-1.5 text-sm text-gray-700"><Phone size={14} className="text-gray-400" /> {cliente.telefone}</div>
                      ) : (<span className="text-sm text-gray-400">—</span>)}
                    </td>
                    <td className="hidden md:table-cell px-6 py-4">
                      {cliente.endereco ? (
                        <div className="flex items-center gap-1.5 text-sm text-gray-700"><MapPin size={14} className="text-gray-400 shrink-0" /><span className="truncate max-w-[200px]">{cliente.endereco}</span></div>
                      ) : (<span className="text-sm text-gray-400">—</span>)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {cliente.telefone && (
                          <button onClick={() => openWhatsApp(cliente.telefone)} className="rounded-md p-2 text-green-500 hover:bg-green-50 hover:text-green-600 transition-colors" title="WhatsApp"><MessageCircle size={16} /></button>
                        )}
                        <button onClick={() => openHistory(cliente)} className="rounded-md p-2 text-gray-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors" title="Historico"><Calendar size={16} /></button>
                        <button onClick={() => openEditModal(cliente)} className="rounded-md p-2 text-gray-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors" title="Editar"><Pencil size={16} /></button>
                        <button onClick={() => setDeleteId(cliente.id)} className="rounded-md p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors" title="Excluir"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===== HISTORY DRAWER ===== */}
      {historyCliente && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setHistoryCliente(null)} />
          <div className="relative w-full max-w-xl bg-white shadow-2xl overflow-y-auto">
            {/* Drawer Header */}
            <div className="sticky top-0 z-10 border-b border-gray-200 bg-white px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Historico do Cliente</h2>
                <button onClick={() => setHistoryCliente(null)} className="rounded-md p-1 text-gray-400 hover:text-gray-600 transition-colors"><X size={20} /></button>
              </div>
            </div>

            {historyLoading ? (
              <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" /></div>
            ) : (
              <div className="p-6 space-y-6">
                {/* Client Info */}
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-600"><User size={24} /></div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-gray-900">{historyCliente.nome}</h3>
                        {historyCliente.codigo && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-indigo-100 px-2 py-0.5 text-xs font-bold text-indigo-700">
                            <Hash size={10} />{historyCliente.codigo}
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-gray-600">
                        {historyCliente.telefone && (
                          <span className="flex items-center gap-1"><Phone size={13} className="text-gray-400" />{historyCliente.telefone}</span>
                        )}
                        {historyCliente.endereco && (
                          <span className="flex items-center gap-1"><MapPin size={13} className="text-gray-400" />{historyCliente.endereco}</span>
                        )}
                      </div>
                      {historyCliente.observacoes && (
                        <p className="mt-2 text-xs text-gray-500">{historyCliente.observacoes}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-3 text-center">
                    <p className="text-xs font-medium text-indigo-600">Pets</p>
                    <p className="mt-1 text-xl font-bold text-indigo-800">{historyPets.length}</p>
                  </div>
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-center">
                    <p className="text-xs font-medium text-emerald-600">Atendimentos</p>
                    <p className="mt-1 text-xl font-bold text-emerald-800">{totalAtendimentos}</p>
                  </div>
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-center">
                    <p className="text-xs font-medium text-amber-600">Total Gasto</p>
                    <p className="mt-1 text-lg font-bold text-amber-800">{formatCurrency(totalGasto)}</p>
                  </div>
                </div>

                {/* Pets Section */}
                <div>
                  <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-3">
                    <PawPrint size={16} className="text-indigo-600" /> Pets ({historyPets.length})
                  </h4>
                  {historyPets.length === 0 ? (
                    <p className="text-sm text-gray-400">Nenhum pet cadastrado.</p>
                  ) : (
                    <div className="grid grid-cols-1 gap-2">
                      {historyPets.map((pet) => (
                        <div key={pet.id} className="flex items-center gap-3 rounded-lg border border-gray-100 bg-white px-4 py-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-50 text-purple-600"><PawPrint size={16} /></div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">{pet.nome}</p>
                            <p className="text-xs text-gray-500">{pet.especie}{pet.raca ? ` - ${pet.raca}` : ''}{pet.idade ? ` - ${pet.idade}` : ''}</p>
                          </div>
                          {pet.peso != null && (
                            <span className="text-xs text-gray-400">{pet.peso} kg</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Atendimentos History */}
                <div>
                  <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-3">
                    <Calendar size={16} className="text-indigo-600" /> Atendimentos ({historyAtendimentos.length})
                  </h4>
                  {historyAtendimentos.length === 0 ? (
                    <p className="text-sm text-gray-400">Nenhum atendimento registrado.</p>
                  ) : (
                    <div className="space-y-2">
                      {historyAtendimentos.map((at) => (
                        <div key={at.id} className="rounded-lg border border-gray-100 bg-white px-4 py-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_BADGE[at.status] || STATUS_BADGE.agendado}`}>
                                {STATUS_LABEL[at.status] || at.status}
                              </span>
                              <span className="text-sm font-medium text-gray-900 truncate">{at.servico?.nome || '—'}</span>
                            </div>
                            <span className="text-sm font-bold text-indigo-700 ml-2 shrink-0">{formatCurrency(at.valor)}</span>
                          </div>
                          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                            <span className="flex items-center gap-1"><PawPrint size={12} />{at.pet?.nome || '—'}</span>
                            <span className="flex items-center gap-1"><Clock size={12} />{formatDateTime(at.data_hora)}</span>
                          </div>
                          {at.observacoes && (
                            <p className="mt-1.5 text-xs text-gray-400 truncate">{at.observacoes}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">{editingId ? 'Editar Cliente' : 'Novo Cliente'}</h2>
              <button onClick={closeModal} className="rounded-md p-1 text-gray-400 hover:text-gray-600 transition-colors"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Nome <span className="text-red-500">*</span></label>
                <input type="text" required value={form.nome} onChange={(e) => handleFormChange('nome', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" placeholder="Nome completo" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Telefone</label>
                <input type="text" value={form.telefone} onChange={(e) => handleFormChange('telefone', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" placeholder="(00) 00000-0000" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Endereco</label>
                <input type="text" value={form.endereco} onChange={(e) => handleFormChange('endereco', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" placeholder="Rua, numero, bairro, cidade" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Observacoes</label>
                <textarea rows={3} value={form.observacoes} onChange={(e) => handleFormChange('observacoes', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none" placeholder="Informacoes adicionais sobre o cliente..." />
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button type="button" onClick={closeModal} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Cancelar</button>
                <button type="submit" disabled={saving} className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  {saving ? (<span className="flex items-center gap-2"><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Salvando...</span>) : editingId ? 'Salvar Alteracoes' : 'Criar Cliente'}
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
            <h2 className="text-lg font-semibold text-gray-900">Excluir cliente</h2>
            <p className="mt-2 text-sm text-gray-600">Tem certeza que deseja excluir este cliente? Esta acao nao pode ser desfeita.</p>
            <div className="mt-5 flex items-center justify-end gap-3">
              <button onClick={() => setDeleteId(null)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Cancelar</button>
              <button onClick={handleDelete} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 transition-colors">Excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
