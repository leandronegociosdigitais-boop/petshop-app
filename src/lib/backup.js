import { supabase } from './supabase'

const TABLES = [
  'clientes',
  'pets',
  'servicos',
  'atendimentos',
  'financeiro'
]

const LAST_BACKUP_KEY = 'petshop-last-backup'

/**
 * Verifica se é sábado e se o backup já foi feito hoje
 * @returns {boolean} true se é sábado e o backup ainda não foi feito hoje
 */
export function shouldPerformWeeklyBackup() {
  const today = new Date()
  const isSaturday = today.getDay() === 6 // 6 = sábado

  if (!isSaturday) return false

  const lastBackup = localStorage.getItem(LAST_BACKUP_KEY)
  if (!lastBackup) return true

  const lastBackupDate = new Date(lastBackup)
  const lastBackupDay = lastBackupDate.getDate()
  const lastBackupMonth = lastBackupDate.getMonth()
  const lastBackupYear = lastBackupDate.getFullYear()

  const todayDay = today.getDate()
  const todayMonth = today.getMonth()
  const todayYear = today.getFullYear()

  // Se o backup foi feito hoje, não precisa fazer novamente
  return !(lastBackupDay === todayDay &&
           lastBackupMonth === todayMonth &&
           lastBackupYear === todayYear)
}

/**
 * Realiza o backup automático dos dados do Supabase
 */
export async function performAutomaticBackup() {
  // Só executa se for sábado e não tiver feito backup hoje
  if (!shouldPerformWeeklyBackup()) return

  try {
    // Mostra um alerta sutil para o usuário
    console.log('Executando backup automático semanal...')

    const backup = {}

    // Faz o backup de todas as tabelas
    await Promise.all(
      TABLES.map(async (table) => {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .order('created_at', { ascending: true })

        if (!error) {
          backup[table] = data || []
        } else {
          console.error(`Erro ao fazer backup da tabela ${table}:`, error)
          backup[table] = []
        }
      })
    )

    // Cria o arquivo JSON
    const backupString = JSON.stringify(backup, null, 2)
    const blob = new Blob([backupString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)

    // Cria um link para download
    const date = new Date().toISOString().slice(0, 10)
    const a = document.createElement('a')
    a.href = url
    a.download = `petshop-backup-automatico-${date}.json`
    a.click()
    URL.revokeObjectURL(url)

    // Atualiza o timestamp do último backup
    localStorage.setItem(LAST_BACKUP_KEY, new Date().toISOString())

    console.log('Backup automático concluído com sucesso!')

    // Mostra uma notificação para o usuário
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification('Backup Automático', {
          body: 'Seu backup semanal foi concluído com sucesso!',
          icon: '/favicon.svg'
        })
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification('Backup Automático', {
              body: 'Seu backup semanal foi concluído com sucesso!',
              icon: '/favicon.svg'
            })
          }
        })
      }
    }

  } catch (error) {
    console.error('Erro ao executar backup automático:', error)

    // Mostra uma notificação de erro
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Erro no Backup', {
        body: 'O backup automático falhou. Por favor, faça o backup manualmente.',
        icon: '/favicon.svg'
      })
    }
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

    // Verifica se o backup tem todas as tabelas necessárias
    const missingTables = TABLES.filter(table => !backup[table])
    if (missingTables.length > 0) {
      return {
        success: false,
        message: `Backup inválido. Tabelas ausentes: ${missingTables.join(', ')}`
      }
    }

    // Limpa as tabelas atuais (apenas para fins de teste)
    // Em uma implementação real, você provavelmente quer fazer um merge
    // ou verificar se já existem dados antes de apagar

    // Para cada tabela, insere os dados do backup
    for (const table of TABLES) {
      if (backup[table] && backup[table].length > 0) {
        // Primeiro, exclui todos os registros da tabela atual
        const { error: deleteError } = await supabase
          .from(table)
          .delete()

        if (deleteError) {
          return {
            success: false,
            message: `Erro ao limpar tabela ${table}: ${deleteError.message}`
          }
        }

        // Depois, insere os dados do backup
        const { error: insertError } = await supabase
          .from(table)
          .insert(backup[table])

        if (insertError) {
          return {
            success: false,
            message: `Erro ao inserir dados na tabela ${table}: ${insertError.message}`
          }
        }
      }
    }

    // Atualiza o timestamp do último backup
    localStorage.setItem(LAST_BACKUP_KEY, new Date().toISOString())

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