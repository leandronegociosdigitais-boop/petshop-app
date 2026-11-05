import { supabase } from './supabase'

// Never fall back to multiple browser writes: the database trigger is required.
export async function mutateAtendimento({ id, payload, remove = false }) {
  try {
    const { data: ready, error: readinessError } = await supabase.rpc('petshop_finance_sync_ready')
    if (readinessError || ready !== true) {
      throw new Error('A atualização de segurança do financeiro ainda precisa ser aplicada no Supabase. Nenhum atendimento foi alterado.')
    }
    let query
    if (remove) query = supabase.from('atendimentos').delete().eq('id', id)
    else if (id) query = supabase.from('atendimentos').update(payload).eq('id', id)
    else query = supabase.from('atendimentos').insert([payload])
    return await query.select('id').single()
  } catch (error) {
    return { data: null, error }
  }
}
