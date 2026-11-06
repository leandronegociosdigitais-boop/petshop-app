import { supabase } from './supabase'
import { fetchAllRows } from './queries'

const appointmentFields = 'id,cliente_id,pet_id,servico_id,data_hora,status,status_pagamento,valor,valor_2,forma_pagamento_2,data_vencimento,pet:pet_id(id,nome,especie),cliente:cliente_id(id,nome),servico:servico_id(id,nome)'

export async function fetchDashboardData(year, signal) {
  const start = new Date(`${year - 1}-01-01T00:00:00`).toISOString()
  const next = new Date(`${year + 1}-01-01T00:00:00`).toISOString()
  const results = await Promise.all([
    fetchAllRows(supabase.from('atendimentos').select(appointmentFields).gte('data_hora', start).lt('data_hora', next).abortSignal(signal)),
    fetchAllRows(supabase.from('financeiro').select('id,tipo,valor,data,forma_pagamento,status_pagamento').gte('data', `${year - 1}-01-01`).lt('data', `${year + 1}-01-01`).abortSignal(signal)),
    fetchAllRows(supabase.from('atendimentos').select(appointmentFields).or('status_pagamento.neq.pago,status_pagamento.is.null').abortSignal(signal)),
    fetchAllRows(supabase.from('financeiro').select('id,tipo,valor,data,data_vencimento,descricao,status_pagamento').eq('tipo', 'saida').eq('status_pagamento', 'pendente').abortSignal(signal)),
    fetchAllRows(supabase.from('atendimentos').select('id,data_hora,status').in('status', ['agendado', 'em_andamento']).abortSignal(signal)),
  ])
  for (const result of results) if (result.error) throw new Error('Não foi possível carregar todos os indicadores. Tente atualizar novamente.')
  const [appointments, finance, pendingAppointments, pendingBills, openAppointments] = results.map(result => result.data)
  return { appointments, finance, pendingAppointments, pendingBills, openAppointments }
}
