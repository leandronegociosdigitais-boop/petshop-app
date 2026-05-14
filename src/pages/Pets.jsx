import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { formatDateTime } from '../lib/dates'
import { Plus, Pencil, Trash2, Search, X, PawPrint, Dog, Cat, Calendar, Clock, ChevronRight, User } from 'lucide-react'

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
  cliente_id: '',
  cliente_search: '',
  especie: 'Cachorro',
  raca: '',
  idade: '',
  peso: '',
  observacoes: '',
}

const ESPECIE_OPTIONS = ['Cachorro', 'Gato', 'Passaro', 'Roedor', 'Outro']

const RACAS_CACHORRO = [
  'Shih Tzu', 'Yorkshire Terrier', 'Spitz Alemao', 'Golden Retriever',
  'Labrador Retriever', 'Bulldog Frances', 'Poodle', 'Pinscher',
  'Dachshund', 'Border Collie', 'Pastor Alemao', 'Rottweiler',
  'Maltes', 'Beagle', 'American Bully', 'Outro',
]

const RACAS_GATO = ['Siames', 'Persa', 'Maine Coon', 'Ragdoll', 'Sphynx', 'Angora', 'Outro']

const ESPECIE_ICON = {
  Cachorro: Dog,
  Gato: Cat,
  Passaro: PawPrint,
  Roedor: PawPrint,
  Outro: PawPrint,
}

function formatCurrency(value) {
  if (value == null) return 'R$ 0,00'
  const num = parseFloat(value)
  if (isNaN(num)) return 'R$ 0,00'
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function Pets() {
  const [pets, setPets] = useState([])
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
  const [historyPet, setHistoryPet] = useState(null)
  const [historyAtendimentos, setHistoryAtendimentos] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)

  useEffect(() => { fetchPets(); fetchClientes() }, [])

  useEffect(() => {
    if (toast) { const timer = setTimeout(() => setToast(null), 3000); return () => clearTimeout(timer) }
  }, [toast])

  async function fetchPets() {
    setLoading(true)
    const { data, error } = await supabase
      .from('pets')
      .select('id, nome, especie, raca, idade, peso, observacoes, created_at, cliente:cliente_id (id, nome)')
      .order('nome', { ascending: true })
    if (error) { showToast('Erro ao carregar pets: ' + error.message, 'error') } else { setPets(data || []) }
    setLoading(false)
  }

  async function fetchClientes() {
    const { data, error } = await supabase.from('clientes').select('id, nome, codigo').order('nome', { ascending: true })
    if (!error) setClientes(data || [])
  }

  function showToast(message, type = 'success') { setToast({ message, type }) }

  function openCreateModal() { setEditingId(null); setForm(EMPTY_FORM); setModalOpen(true) }

  function openEditModal(pet) {
    setEditingId(pet.id)
    setForm({
      nome: pet.nome || '',
      cliente_id: pet.cliente_id || '',
      cliente_search: '',
      especie: pet.especie || 'Cachorro',
      raca: pet.raca || '',
      idade: pet.idade || '',
      peso: pet.peso != null ? String(pet.peso) : '',
      observacoes: pet.observacoes || '',
    })
    setModalOpen(true)
  }

  function closeModal() { setModalOpen(false); setEditingId(null); setForm(EMPTY_FORM) }

  function handleFormChange(field, value) {
    setForm((prev) => {
      const next = { ...prev, [field]: value }
      if (field === 'especie') next.raca = ''
      if (field === 'cliente_search') {
        const search = value.trim().toLowerCase()
        const found = clientes.find((c) =>
          c.codigo && c.codigo.toLowerCase() === search
        )
        if (found) {
          next.cliente_id = found.id
          next.cliente_search = ''
        } else {
          next.cliente_search = value
        }
      }
      if (field === 'cliente_id') {
        next.cliente_search = ''
      }
      return next
    })
  }

  const racaOptions = form.especie === 'Cachorro' ? RACAS_CACHORRO
    : form.especie === 'Gato' ? RACAS_GATO : []

  async function openHistory(pet) {
    setHistoryPet(pet)
    setHistoryLoading(true)
    const { data, error } = await supabase
      .from('atendimentos')
      .select('*, servico:servico_id(id, nome, preco), cliente:cliente_id(id, nome)')
      .eq('pet_id', pet.id)
      .order('data_hora', { ascending: false })
    setHistoryAtendimentos(data || [])
    setHistoryLoading(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.nome.trim()) { showToast('Nome e obrigatorio.', 'error'); return }
    if (!form.cliente_id) { showToast('Selecione um dono/cliente.', 'error'); return }
    setSaving(true)
    const payload = {
      nome: form.nome.trim(),
      cliente_id: form.cliente_id,
      especie: form.especie,
      raca: form.raca.trim(),
      idade: form.idade.trim(),
      peso: form.peso ? parseFloat(form.peso) : null,
      observacoes: form.observacoes.trim(),
    }
    let error
    if (editingId) {
      ;({ error } = await supabase.from('pets').update(payload).eq('id', editingId))
    } else {
      ;({ error } = await supabase.from('pets').insert([payload]))
    }
    if (error) { showToast('Erro ao salvar pet.', 'error') }
    else { showToast(editingId ? 'Pet atualizado com sucesso!' : 'Pet criado com sucesso!'); closeModal(); fetchPets() }
    setSaving(false)
  }

  async function handleDelete() {
    if (!deleteId) return
    const { error } = await supabase.from('pets').delete().eq('id', deleteId)
    if (error) { showToast('Erro ao excluir pet.', 'error') } else { showToast('Pet excluido com sucesso!'); fetchPets() }
    setDeleteId(null)
  }

  const filtered = pets.filter((p) => {
    if (!search.trim()) return true
    const term = search.toLowerCase()
    return (p.nome && p.nome.toLowerCase().includes(term))
      || (p.cliente?.nome && p.cliente.nome.toLowerCase().includes(term))
  })

  const totalGasto = historyAtendimentos
    .filter(a => a.status === 'concluido')
    .reduce((sum, a) => sum + (parseFloat(a.valor) || 0), 0)

  const totalAtendimentos = historyAtendimentos.filter(a => a.status === 'concluido').length

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 max-w-[calc(100vw-2rem)] flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium shadow-lg transition-all ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'}`}>
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 hover:opacity-80"><X size={16} /></button>
        </div>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2"><PawPrint size={28} className="text-indigo-600" /><h1 className="text-2xl font-bold text-gray-900">Pets</h1></div>
        <button onClick={openCreateModal} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"><Plus size={18} /> Novo Pet</button>
      </div>

      <div className="relative max-w-md">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" placeholder="Buscar por nome do pet ou dono..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-10 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
        {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X size={16} /></button>}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" /></div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white py-16 text-center">
          <PawPrint size={40} className="mx-auto text-gray-300" />
          <p className="mt-3 text-gray-500">{search ? 'Nenhum pet encontrado para a busca.' : 'Nenhum pet cadastrado ainda.'}</p>
          {!search && <button onClick={openCreateModal} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"><Plus size={16} /> Cadastrar primeiro pet</button>}
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Pet</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Dono</th>
                  <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Especie</th>
                  <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Raca</th>
                  <th className="hidden lg:table-cell px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Idade</th>
                  <th className="hidden lg:table-cell px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Peso</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Acoes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((pet) => {
                  const IconComp = ESPECIE_ICON[pet.especie] || PawPrint
                  return (
                    <tr key={pet.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600"><IconComp size={18} /></div>
                          <div>
                            <button onClick={() => openHistory(pet)} className="font-medium text-gray-900 hover:text-indigo-600 transition-colors text-left flex items-center gap-1 group">
                              {pet.nome}
                              <ChevronRight size={14} className="text-gray-300 group-hover:text-indigo-500 transition-colors" />
                            </button>
                            {pet.observacoes && <div className="mt-0.5 max-w-[120px] sm:max-w-[180px] truncate text-xs text-gray-500">{pet.observacoes}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{pet.cliente?.nome || <span className="text-gray-400">—</span>}</td>
                      <td className="hidden sm:table-cell px-6 py-4"><span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">{pet.especie}</span></td>
                      <td className="hidden md:table-cell px-6 py-4 text-sm text-gray-700">{pet.raca || <span className="text-gray-400">—</span>}</td>
                      <td className="hidden lg:table-cell px-6 py-4 text-sm text-gray-700">{pet.idade || <span className="text-gray-400">—</span>}</td>
                      <td className="hidden lg:table-cell px-6 py-4 text-sm text-gray-700">{pet.peso != null ? `${pet.peso} kg` : <span className="text-gray-400">—</span>}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openHistory(pet)} className="rounded-md p-2.5 text-gray-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors" title="Historico"><Calendar size={16} /></button>
                          <button onClick={() => openEditModal(pet)} className="rounded-md p-2.5 text-gray-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors" title="Editar"><Pencil size={16} /></button>
                          <button onClick={() => setDeleteId(pet.id)} className="rounded-md p-2.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors" title="Excluir"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===== HISTORY DRAWER ===== */}
      {historyPet && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setHistoryPet(null)} />
          <div className="relative w-full max-w-xl bg-white shadow-2xl overflow-y-auto pb-[env(safe-area-inset-bottom,0px)]">
            {/* Drawer Header */}
            <div className="sticky top-0 z-10 border-b border-gray-200 bg-white px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Historico do Pet</h2>
                <button onClick={() => setHistoryPet(null)} className="rounded-md p-1 text-gray-400 hover:text-gray-600 transition-colors"><X size={20} /></button>
              </div>
            </div>

            {historyLoading ? (
              <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" /></div>
            ) : (
              <div className="p-6 space-y-6">
                {/* Pet Info */}
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 text-purple-600">
                      {(() => { const I = ESPECIE_ICON[historyPet.especie] || PawPrint; return <I size={24} /> })()}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{historyPet.nome}</h3>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-600">
                        {historyPet.especie && <span className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">{historyPet.especie}</span>}
                        {historyPet.raca && <span>{historyPet.raca}</span>}
                        {historyPet.idade && <span>{historyPet.idade}</span>}
                        {historyPet.peso != null && <span>{historyPet.peso} kg</span>}
                      </div>
                      {historyPet.cliente?.nome && (
                        <div className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                          <User size={12} /> Dono: {historyPet.cliente.nome}
                        </div>
                      )}
                      {historyPet.observacoes && (
                        <p className="mt-2 text-xs text-gray-500">{historyPet.observacoes}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-center">
                    <p className="text-xs font-medium text-emerald-600">Atendimentos</p>
                    <p className="mt-1 text-xl font-bold text-emerald-800">{totalAtendimentos}</p>
                  </div>
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-center">
                    <p className="text-xs font-medium text-amber-600">Total Gasto</p>
                    <p className="mt-1 text-lg font-bold text-amber-800">{formatCurrency(totalGasto)}</p>
                  </div>
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
                            <span className="flex items-center gap-1"><User size={12} />{at.cliente?.nome || '—'}</span>
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
          <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl bg-white p-4 sm:p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">{editingId ? 'Editar Pet' : 'Novo Pet'}</h2>
              <button onClick={closeModal} className="rounded-md p-1 text-gray-400 hover:text-gray-600 transition-colors"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Nome <span className="text-red-500">*</span></label>
                <input type="text" required value={form.nome} onChange={(e) => handleFormChange('nome', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" placeholder="Nome do pet" />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Dono/Cliente <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={form.cliente_search}
                  onChange={(e) => handleFormChange('cliente_search', e.target.value)}
                  placeholder="Buscar por codigo do cadastro..."
                  className="mb-1 w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                  <select required value={form.cliente_id} onChange={(e) => handleFormChange('cliente_id', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                    <option value="">Selecione o cliente</option>
                    {clientes.map((c) => (<option key={c.id} value={c.id}>{c.codigo ? `#${c.codigo} - ` : ''}{c.nome}</option>))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Especie</label>
                  <select value={form.especie} onChange={(e) => handleFormChange('especie', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                    {ESPECIE_OPTIONS.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Raca</label>
                  {racaOptions.length > 0 ? (
                    <select value={form.raca} onChange={(e) => handleFormChange('raca', e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                      <option value="">Selecione a raca</option>
                      {racaOptions.map((raca) => (<option key={raca} value={raca}>{raca}</option>))}
                    </select>
                  ) : (
                    <input type="text" value={form.raca} onChange={(e) => handleFormChange('raca', e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" placeholder="Raca do pet..." />
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Idade</label>
                  <input type="text" value={form.idade} onChange={(e) => handleFormChange('idade', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" placeholder="Ex: 2 anos" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Peso (kg)</label>
                <input type="number" step="0.01" min="0" value={form.peso} onChange={(e) => handleFormChange('peso', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" placeholder="0.00" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Observacoes</label>
                <textarea rows={3} value={form.observacoes} onChange={(e) => handleFormChange('observacoes', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none" placeholder="Informacoes adicionais sobre o pet..." />
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button type="button" onClick={closeModal} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Cancelar</button>
                <button type="submit" disabled={saving} className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  {saving ? (<span className="flex items-center gap-2"><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Salvando...</span>) : editingId ? 'Salvar Alteracoes' : 'Criar Pet'}
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
            <h2 className="text-lg font-semibold text-gray-900">Excluir pet</h2>
            <p className="mt-2 text-sm text-gray-600">Tem certeza que deseja excluir este pet? Esta acao nao pode ser desfeita.</p>
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
