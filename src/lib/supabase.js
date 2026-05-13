import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

console.log('[Supabase] URL:', supabaseUrl ? supabaseUrl.slice(0, 30) + '...' : 'EMPTY')
console.log('[Supabase] Key:', supabaseKey ? supabaseKey.slice(0, 20) + '...' : 'EMPTY')

if (!supabaseUrl || !supabaseKey) {
  console.error('[Supabase] FALTAM VARIAVEIS DE AMBIENTE! URL e/ou Key estão vazias.')
}

export const supabase = createClient(supabaseUrl, supabaseKey)

// Teste de conexao
supabase.from('clientes').select('id').limit(1).then(({ data, error }) => {
  if (error) {
    console.error('[Supabase] ERRO DE CONEXAO:', error.message, error.code, error.details)
  } else {
    console.log('[Supabase] Conexao OK! Cliente retornado:', data?.length || 0)
  }
}).catch(err => {
  console.error('[Supabase] FALHA DE REDE:', err.message)
})
