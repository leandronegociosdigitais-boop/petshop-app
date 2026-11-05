import { supabase } from './supabase'
import { saveLocalBackup } from './backup-storage'
import { isWeeklyBackupDue } from './backup-schedule'
import { fetchAllRows } from './queries'

const TABLES = [
  'clientes',
  'pets',
  'servicos',
  'atendimentos',
  'financeiro'
]

const LAST_BACKUP_KEY = 'petshop-last-backup'
let automaticBackupInFlight = false

export async function collectBackup() {
  const { data, error } = await supabase.rpc('export_petshop_backup')
  if (error) throw new Error('Não foi possível exportar o backup: ' + error.message)
  if (!data || TABLES.some(table => !Array.isArray(data[table]))) {
    throw new Error('O banco retornou um backup incompleto.')
  }
  return data
}

export async function fetchAllTableRows(table) {
  const { data, error } = await fetchAllRows(supabase.from(table).select('*'))
  if (error) throw new Error(`Erro ao exportar ${table}: ${error.message}`)
  return data
}

/**
 * Verifica se falta a cópia da semana iniciada no último sábado.
 */
export function shouldPerformWeeklyBackup(userId) {
  return isWeeklyBackupDue(localStorage.getItem(LAST_BACKUP_KEY + ':' + userId))
}

/**
 * Realiza o backup automático dos dados do Supabase
 */
export async function performAutomaticBackup(userId) {
  // Também recupera semanas em que a aplicação ficou fechada no sábado.
  if (!userId) return
  if (automaticBackupInFlight) return
  automaticBackupInFlight = true

  try {
    if (!shouldPerformWeeklyBackup(userId)) return
    // Mostra um alerta sutil para o usuário
    console.log('Executando backup automático semanal...')

    const backup = await collectBackup()

    await saveLocalBackup(userId, backup)
    localStorage.setItem(LAST_BACKUP_KEY + ':' + userId, new Date().toISOString())

    console.log('Backup automático concluído com sucesso!')

    // Mostra uma notificação para o usuário
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification('Backup Automático', {
          body: 'Cópia semanal salva neste navegador. Exporte também um arquivo na tela Backup.',
          icon: '/favicon.svg'
        })
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification('Backup Automático', {
              body: 'Cópia semanal salva neste navegador. Exporte também um arquivo na tela Backup.',
              icon: '/favicon.svg'
            })
          }
        })
      }
    }
    return true

  } catch (error) {
    console.error('Erro ao executar backup automático:', error)

    // Mostra uma notificação de erro
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Erro no Backup', {
        body: 'O backup automático falhou. Por favor, faça o backup manualmente.',
        icon: '/favicon.svg'
      })
    }
    return false
  } finally {
    automaticBackupInFlight = false
  }
}

/**
 * Restaura os dados de um arquivo de backup
 * @param {File} backupFile - O arquivo JSON de backup
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function restoreFromBackup(backupFile) {
  try {
    const text = await backupFile.text()
    const backup = JSON.parse(text)

    if (!backup || typeof backup !== 'object' || Array.isArray(backup)) {
      return { success: false, message: 'Backup inválido: formato JSON inesperado.' }
    }

    // Verifica se o backup tem todas as tabelas necessárias
    const missingTables = TABLES.filter(table => !backup[table])
    if (missingTables.length > 0) {
      return {
        success: false,
        message: `Backup inválido. Tabelas ausentes: ${missingTables.join(', ')}`
      }
    }

    const invalidTables = TABLES.filter(table => !Array.isArray(backup[table]))
    if (invalidTables.length > 0) {
      return {
        success: false,
        message: `Backup inválido. Dados inválidos nas tabelas: ${invalidTables.join(', ')}`
      }
    }

    const { error } = await supabase.rpc('restore_petshop_backup', { backup_data: backup })
    if (error) {
      const migrationMissing = error.code === 'PGRST202' || error.message?.includes('restore_petshop_backup')
      return {
        success: false,
        message: migrationMissing
          ? 'Restauração segura ainda não habilitada no banco. Aplique a migração do projeto Supabase e tente novamente.'
          : `Restauração cancelada sem concluir a transação: ${error.message}`
      }
    }

    // Atualiza o timestamp do último backup

    return {
      success: true,
      message: 'Backup restaurado com sucesso!'
    }

  } catch (error) {
    console.error('Erro ao restaurar backup:', error)
    return {
      success: false,
      message: `Erro ao restaurar backup: ${error.message}`
    }
  }
}

/**
 * Verifica se há backup disponível para restauração
 * @returns {boolean}
 */
export function hasBackupAvailable() {
  // Verifica se há algum arquivo de backup armazenado localmente
  // (isso seria útil se você quisesse armazenar backups locais)
  return false // Por enquanto, não implementamos armazenamento local de backups
}

/**
 * Formata a data para o formato brasileiro
 * @param {Date} date
 * @returns {string}
 */
export function formatDateBR(date) {
  if (!date) return '—'
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
