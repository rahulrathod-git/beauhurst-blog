import { loadCompanies } from '../../utils/loadCompanies'
import { rankRows, summarise } from '../../utils/companies'

export default defineEventHandler(() => {
  const valueKey = 'Total Raised'
  const rows = loadCompanies('fintech_companies_seed.csv')
  const headers = Object.keys(rows[0] ?? {})
  const ranked = rankRows(rows, valueKey)

  return {
    headers,
    valueKey,
    stats: summarise(rows, valueKey),
    table: ranked.map(r => ({
      rank: r.rank,
      value: r.value,
      cells: headers.map(h => r.row[h] ?? ''),
    })),
  }
})