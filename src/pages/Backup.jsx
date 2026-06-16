import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Database, Download, AlertTriangle, CheckCircle, Clock, RefreshCw, Upload, X } from 'lucide-react'
import { performAutomaticBackup, restoreFromBackup, formatDateBR } from '../lib/backup'

const TABLES = [
  { name: 'clientes', label: 'Clientes' },
  { name: 'pets', label: 'Pets' },
  { name: 'servicos', label: 'Servicos' },
  { name: 'atendimentos', label: 'Atendimentos' },
  { name: 'financeiro', label: 'Financeiro' },
]

const LAST_BACKUP_KEY = 'petshop-last-backup'

function getLastBackup() {
  const val = localStorage.getItem(LAST_BACKUP_KEY)
  if (!val) return null
  return new Date(val)
}

function setLastBackup() {
  localStorage.setItem(LAST_BACKUP_KEY, new Date().toISOString())
}

export default function Backup() {
  const [counts, setCounts] = useState({})
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [lastBackup, setLastBackupState] = useState(getLastBackup())
  const [restoring, setRestoring] = useState(false)
  const [restoreError, setRestoreError] = useState(null)
  const [showRestoreModal, setShowRestoreModal] = useState(false)

  const isSaturday = new Date().getDay() === 6
  const todayStr = new Date().toISOString().slice(0, 10)
  const lastBackupToday = lastBackup && lastBackup.toISOString().slice(0, 10) === todayStr
  const showReminder = isSaturday && !lastBackupToday

  useEffect(() => { fetchCounts() }, [])

  async function fetchCounts() {
    setLoading(true)
    const result = {}
    await Promise.allSettled(
      TABLES.map(async (t) => {
        const { count, error } = await supabase
          .from(t.name)
          .select('*', { count: 'exact', head: true })
        if (!error) result[t.name] = count || 0
        else result[t.name] = 0
      })
    )
    setCounts(result)
    setLoading(false)
  }

  async function handleExport() {
    setExporting(true)
    try {
      const backup = {}
      await Promise.all(
        TABLES.map(async (t) => {
          const { data, error } = await supabase
            .from(t.name)
            .select('*')
            .order('created_at', { ascending: true })
          if (!error) backup[t.name] = data || []
          else backup[t.name] = []
        })
      )

      const blob = new Blob(
        [JSON.stringify(backup, null, 2)],
        { type: 'application/json' }
      )
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const date = new Date().toISOString().slice(0, 10)
      a.href = url
      a.download = `petshop-backup-${date}.json`
      a.click()
      URL.revokeObjectURL(url)

      setLastBackup()
      setLastBackupState(new Date())
    } catch (err) {
      console.error('Erro ao exportar backup:', err)
    }
    setExporting(false)
  }

  async function handleRestore(e) {
    const file = e.target.files[0]
    if (!file) return

    setRestoring(true)
    setRestoreError(null)

    const result = await restoreFromBackup(file)

    if (result.success) {
      // Atualiza o backup local
      setLastBackup()
      setLastBackupState(new Date())
      // Atualiza os contadores
      fetchCounts()
      // Mostra mensagem de sucesso
      alert(result.message)
    } else {
      setRestoreError(result.message)
      alert('Erro ao restaurar backup: ' + result.message)
    }

    setRestoring(false)
    // Limpa o input
    e.target.value = ''
    setShowRestoreModal(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database size={28} className="text-indigo-600" />
          <h1 className="text-2xl font-bold text-gray-900">Backup</h1>
        </div>
        <button
          onClick={fetchCounts}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Atualizar
        </button>
      </div>

      {/* Lembrete sabado */}
      {showReminder && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-300 bg-amber-50 px-5 py-4">
          <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />
          <div>
            <p className="font-semibold text-amber-800">Lembrete de Backup</p>
            <p className="text-sm text-amber-700">Hoje é sábado! Faça o backup semanal dos seus dados.</p>
          </div>
        </div>
      )}

      {/* Ultimo backup */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {lastBackupToday ? (
              <CheckCircle className="w-5 h-5 text-emerald-500" />
            ) : (
              <Clock className="w-5 h-5 text-gray-400" />
            )}
            <div>
              <p className="text-sm font-medium text-gray-700">Ultimo backup</p>
              <p className={`text-lg font-semibold ${lastBackupToday ? 'text-emerald-600' : 'text-gray-500'}`}>
                {lastBackup ? formatDateBR(lastBackup) : 'Nenhum backup feito'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              disabled={exporting}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download size={16} className={exporting ? 'animate-bounce' : ''} />
              {exporting ? 'Exportando...' : 'Exportar Backup'}
            </button>
            <button
              onClick={() => setShowRestoreModal(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-green-700 transition-colors"
            >
              <Upload size={16} />
              Restaurar
            </button>
          </div>
        </div>
      </div>

      {/* Tabelas e contagem */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Dados no Banco</h2>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-3 border-indigo-200 border-t-indigo-600" />
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-gray-500 border-b border-gray-100">
                <th className="px-5 py-3 text-left font-semibold">Tabela</th>
                <th className="px-5 py-3 text-right font-semibold">Registros</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {TABLES.map((t) => (
                <tr key={t.name} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 text-sm font-medium text-gray-900">{t.label}</td>
                  <td className="px-5 py-3 text-sm text-right font-semibold text-indigo-700">
                    {(counts[t.name] ?? 0).toLocaleString('pt-BR')}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 border-t border-gray-200">
                <td className="px-5 py-3 text-sm font-bold text-gray-700">Total</td>
                <td className="px-5 py-3 text-sm text-right font-bold text-indigo-700">
                  {Object.values(counts).reduce((s, v) => s + (v || 0), 0).toLocaleString('pt-BR')}
                </td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>

      {/* Info */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 px-5 py-4">
        <p className="text-sm text-blue-800">
          <strong>Como funciona:</strong> O backup exporta todos os dados do Supabase em um arquivo JSON.
          Guarde o arquivo em um local seguro. Recomendamos fazer backup todo sábado.
        </p>
        <p className="mt-2 text-sm text-blue-800">
          <strong>Backup automático:</strong> A aplicação agora realiza backup automaticamente todo sábado!
        </p>
      </div>

      {/* Restore Modal */}
      {showRestoreModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowRestoreModal(false)} />
          <div className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Restaurar Backup</h2>
              <button
                onClick={() => setShowRestoreModal(false)}
                className="rounded-md p-1 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {restoreError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{restoreError}</p>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Selecione o arquivo de backup (.json)
              </label>
              <input
                type="file"
                accept=".json"
                onChange={handleRestore}
                disabled={restoring}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900"
              />
            </div>

            <p className="text-sm text-gray-500 mb-4">
              ⚠️ ATENÇÃO: Restaurar um backup irá substituir todos os dados atuais da aplicação.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowRestoreModal(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => setShowRestoreModal(false)}
                className="rounded-lg bg-gray-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-700 transition-colors disabled:opacity-50"
                disabled={restoring}
              >
                {restoring ? 'Restaurando...' : 'Restaurar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}