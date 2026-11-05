// Paginate every row query, including when the API limit is below our page size.
export async function fetchAllRows(query) {
  const rows = []
  const pageSize = 500
  let offset = 0
  while (true) {
    const result = await query.order('id', { ascending: true }).range(offset, offset + pageSize - 1)
    if (result.error) return { ...result, data: null }
    if (!Array.isArray(result.data)) return { data: null, error: new Error('Resposta inválida do banco.') }
    if (!result.data.length) return { ...result, data: rows }
    rows.push(...result.data)
    offset += result.data.length
  }
}
