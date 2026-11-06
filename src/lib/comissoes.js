// Commission accrues when work starts, independently of payment settlement.
export const COMMISSION_STATUSES = ['em_andamento', 'concluido']

export function commissionableAppointments(rows) {
  return rows.filter(row => COMMISSION_STATUSES.includes(row.status))
}
