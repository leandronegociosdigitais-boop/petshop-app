import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuthContext'
import { saveLocalBackup, readLocalBackup, downloadBackup } from '../lib/backup-storage'
import { getLocalDateISO } from '../lib/dates'
import { Database, Download, AlertTriangle, CheckCircle, Clock, RefreshCw, Upload, X } from 'lucide-react'
import { collectBackup, restoreFromBackup, formatDateBR } from '../lib/backup'

const TABLES = [
  { name: 'clientes', label: 'Clientes' },
  { name: 'pets', label: 'Pets' },
  { name: 'servicos', label: 'Servicos' },
  { name: 'atendimentos', label: 'Atendimentos' },
  { name: 'financeiro', label: 'Financeiro' },
]

const LAST_BACKUP_KEY = 'petshop-last-backup'

function getLastBackup(userId) {
  const val = localStorage.getItem(LAST_BACKUP_KEY + ':' + userId)
  if (!val) return null
  return new Date(val)
}

function setLastBackup(userId) {
  localStorage.setItem(LAST_BACKUP_KEY + ':' + userId, new Date().toISOString())
}

export default function Backup() {
  const { user } = useAuth()
  const [counts, setCounts] = useState({})
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [lastBackup, setLastBackupState] = useState(() => getLastBackup(user.id))
  const [restoring, setRestoring] = useState(false)
  const [selectedBackup, setSelectedBackup] = useState(null)
  const [restoreError, setRestoreError] = useState(null)
  const [showRestoreModal, setShowRestoreModal] = useState(false)

  const isSaturday = new Date().getDay() === 6
  const todayStr = getLocalDateISO()
  const lastBackupToday = lastBackup && getLocalDateISO(lastBackup) === todayStr
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
      const backup = await collectBackup()

      await saveLocalBackup(user.id, backup)
      setLastBackup(user.id)
      downloadBackup(backup, `petshop-backup-${getLocalDateISO()}.json`)
      setLastBackupState(new Date())
    } catch (err) {
      console.error('Erro ao exportar backup:', err)
      alert(`Não foi possível concluir o backup: ${err.message}`)
    } finally {
      setExporting(false)
    }
  }

  async function downloadSavedBackup() {
    try {
      const saved = await readLocalBackup(user.id)
      if (!saved) { alert('Nenhuma cópia local disponível. Use Exportar Backup.'); return }
      downloadBackup(saved.data, `petshop-backup-${getLocalDateISO(new Date(saved.createdAt))}.json`)
    } catch (error) { alert('Não foi possível abrir a cópia local: ' + error.message) }
  }

  function handleBackupSelection(e) {
    setSelectedBackup(e.target.files?.[0] || null)
    setRestoreError(null)
  }

  async function handleRestore() {
    if (!selectedBackup) return

    setRestoring(true)
    setRestoreError(null)

    try {
      const result = await restoreFromBackup(selectedBackup)

      if (result.success) {
        await fetchCounts()
        alert(result.message)
        setSelectedBackup(null)
        setShowRestoreModal(false)
      } else {
        setRestoreError(result.message)
      }
    } catch (error) {
      setRestoreError(error.message || 'Erro inesperado ao restaurar o backup.')
    } finally {
      setRestoring(false)
    }
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
              <p className="text-sm font-medium text-gray-700">Última cópia neste navegador</p>
              <p className={`text-lg font-semibold ${lastBackupToday ? 'text-emerald-600' : 'text-gray-500'}`}>
                {lastBackup ? formatDateBR(lastBackup) : 'Nenhuma cópia local registrada'}
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
            <button onClick={downloadSavedBackup} className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium">Baixar cópia local</button>
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
          <strong>Backup automático:</strong> A aplicação salva uma cópia neste navegador a partir de sábado, quando estiver aberta e conectada. Se estiver fechada, tenta na próxima abertura. Exporte o arquivo e guarde outra cópia: limpar os dados do navegador remove a cópia local.
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
                onChange={handleBackupSelection}
                disabled={restoring}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900"
              />
            </div>

            <p className="text-sm text-gray-500 mb-4">
              ⚠️ Restaurar substituirá os dados atuais. A operação começa somente depois de selecionar o arquivo e confirmar abaixo. A restauração exige a migração transacional instalada no Supabase; se ela não estiver instalada, nada será alterado.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setShowRestoreModal(false); setSelectedBackup(null) }}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleRestore}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 transition-colors disabled:opacity-50"
                disabled={restoring || !selectedBackup}
              >
                {restoring ? 'Restaurando...' : 'Confirmar restauração'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
