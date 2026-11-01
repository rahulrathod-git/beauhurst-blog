import { parseCsv } from '../../utils/loadCompanies'
import { rankRows, summarise } from '../../utils/companies'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ csv?: string; valueKey?: string }>(event)

  if (!body?.csv || !body?.valueKey) {
    throw createError({ statusCode: 400, statusMessage: 'Missing csv or valueKey' })
  }

  const rows = parseCsv(body.csv)
  const firstRow = rows[0]

  if (!firstRow) {
    throw createError({ statusCode: 400, statusMessage: 'No rows found in the CSV' })
  }

  if (!(body.valueKey in firstRow)) {
    throw createError({ statusCode: 400, statusMessage: `Column "${body.valueKey}" not found` })
  }

  const nameColumn = Object.keys(firstRow)[0] ?? ''
  const ranked = rankRows(rows, body.valueKey)

  return {
    stats: summarise(rows, body.valueKey),
    top: ranked.slice(0, 5).map(r => ({
      rank: r.rank,
      name: r.row[nameColumn] ?? '',
      value: r.value,
    })),
  }
})